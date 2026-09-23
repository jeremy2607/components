/*
 * La scène.
 *
 * three.js piloté à la main, sans réconciliateur. Le graphe tient en deux
 * appels de dessin — un `InstancedMesh` pour tous les noeuds, un
 * `LineSegments` pour toutes les arêtes — auxquels s'ajoutent deux nuages de
 * points additifs, halos et poussière, puis deux objets de plus seulement
 * pendant qu'un composant est déplié.
 *
 * Le rendu est à la demande. La boucle s'arrête dès que la caméra est arrivée
 * et que rien ne bouge, et elle est coupée net quand la galerie ouvre un
 * panneau de détail : pendant qu'on lit du code, la scène ne rend rien.
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  RingGeometry,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
  type Texture,
} from 'three';
import type { StackLayer } from '../types.ts';
import {
  approach,
  clampElevation,
  clampZoom,
  focusPose,
  FOV,
  orbitAround,
  overviewPose,
  settled,
  strataPose,
  type Pose,
} from './camera.ts';
import { componentNodeId, techNodeId, type Graph, type GraphNode } from './graph.ts';
import { boundsOf, type Layout } from './layout.ts';
import { readPalette } from './palette.ts';
import { strataHeight, unfold, type Stratum } from './strata.ts';
import type { TierSettings } from './tiers.ts';

export interface SceneOptions {
  canvas: HTMLCanvasElement;
  graph: Graph;
  layout: Layout;
  settings: TierSettings;
  /** Les couches par composant, pour le dépliage en strates. */
  layers: Readonly<Record<string, readonly StackLayer[]>>;
  /** Clic sur un composant atteignable. */
  onSelect: (ref: string) => void;
  onHover: (node: GraphNode | null) => void;
  /** Contexte WebGL perdu : la galerie doit repasser en 2D. */
  onLost: () => void;
}

export interface SceneHandle {
  /** Déplie un composant et y plonge. `null` revient à la vue d'ensemble. */
  focus: (ref: string | null) => void;
  /** Met une techno en avant et éteint le reste. */
  highlight: (tech: string | null) => void;
  /** Les étiquettes DOM que la scène positionne à chaque image. */
  setLabels: (elements: ReadonlyMap<string, HTMLElement>) => void;
  dispose: () => void;
}

/** Rayon d'accroche du pointeur, en pixels CSS. */
const PICK_RADIUS = 26;
const UNFOLD_SECONDS = 0.85;
/** Fils au maximum par couche : borne la géométrie des strates, allouée une fois. */
const MAX_TECH_PER_LAYER = 12;

function radiusOf(node: GraphNode): number {
  return node.kind === 'component' ? 0.72 + node.degree * 0.05 : 0.44 + node.degree * 0.07;
}

/**
 * Le dégradé radial des halos, peint une fois dans un canevas de 64 pixels.
 *
 * C'est la seule texture de la scène, et elle ne pèse aucun octet
 * téléchargé : elle n'est qu'un alpha, la couleur vient des jetons.
 */
function haloTexture(): Texture | null {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;

  const context = canvas.getContext('2d');
  if (!context) return null;

  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.32)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);

  return new CanvasTexture(canvas);
}

export function createScene(options: SceneOptions): SceneHandle {
  const { canvas, graph, layout, settings, layers } = options;
  const palette = readPalette();

  const renderer = new WebGLRenderer({
    canvas,
    antialias: settings.antialias,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(palette.background, 1);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 400);
  const bounds = boundsOf(layout);

  const positions = graph.nodes.map((node) => {
    const point = layout[node.id];
    return new Vector3(point?.x ?? 0, point?.y ?? 0, point?.z ?? 0);
  });
  const indexOf = new Map(graph.nodes.map((node, index) => [node.id, index]));

  // Voisinage précalculé : `paint` s'exécute à chaque image de transition, et
  // relire la liste des arêtes à chaque noeud y serait du travail refait.
  const neighbours = new Map<string, Set<string>>();
  for (const edge of graph.edges) {
    if (!neighbours.has(edge.source)) neighbours.set(edge.source, new Set());
    if (!neighbours.has(edge.target)) neighbours.set(edge.target, new Set());
    neighbours.get(edge.source)?.add(edge.target);
    neighbours.get(edge.target)?.add(edge.source);
  }
  const linked = (a: string, b: string) => neighbours.get(a)?.has(b) === true;

  /* ------------------------------------------------------------------ noeuds */

  const nodeGeometry = new SphereGeometry(1, 16, 12);
  const nodeMaterial = new MeshBasicMaterial();
  const nodes = new InstancedMesh(nodeGeometry, nodeMaterial, graph.nodes.length);
  const dummy = new Object3D();

  graph.nodes.forEach((node, index) => {
    const position = positions[index];
    if (!position) return;
    dummy.position.copy(position);
    dummy.scale.setScalar(radiusOf(node));
    dummy.updateMatrix();
    nodes.setMatrixAt(index, dummy.matrix);
  });
  nodes.instanceMatrix.needsUpdate = true;
  scene.add(nodes);

  /* ------------------------------------------------------------------ arêtes */

  const edgeGeometry = new BufferGeometry();
  const edgePositions = new Float32Array(graph.edges.length * 6);
  /*
   * Quatre composantes par sommet : la couleur des arêtes porte son alpha.
   * three active `USE_COLOR_ALPHA` dès que l'attribut a quatre composantes, ce
   * qui permet d'éteindre un fil sans toucher à la géométrie ni ajouter un
   * appel de dessin.
   */
  const edgeColors = new Float32Array(graph.edges.length * 8);

  graph.edges.forEach((edge, index) => {
    const from = positions[indexOf.get(edge.source) ?? -1];
    const to = positions[indexOf.get(edge.target) ?? -1];
    if (!from || !to) return;
    edgePositions.set([from.x, from.y, from.z, to.x, to.y, to.z], index * 6);
  });

  edgeGeometry.setAttribute('position', new BufferAttribute(edgePositions, 3));
  edgeGeometry.setAttribute('color', new BufferAttribute(edgeColors, 4));
  const edgeMaterial = new LineBasicMaterial({ vertexColors: true, transparent: true });
  const edges = new LineSegments(edgeGeometry, edgeMaterial);
  scene.add(edges);

  /* ------------------------------------------------------------------- halos */

  const texture = settings.halos ? haloTexture() : null;
  let haloGeometry: BufferGeometry | null = null;
  let haloMaterial: PointsMaterial | null = null;
  let haloColors: BufferAttribute | null = null;

  if (texture) {
    haloGeometry = new BufferGeometry();
    const haloPositions = new Float32Array(graph.nodes.length * 3);
    positions.forEach((position, index) => {
      haloPositions.set([position.x, position.y, position.z], index * 3);
    });
    haloColors = new BufferAttribute(new Float32Array(graph.nodes.length * 3), 3);
    haloGeometry.setAttribute('position', new BufferAttribute(haloPositions, 3));
    haloGeometry.setAttribute('color', haloColors);

    haloMaterial = new PointsMaterial({
      size: 4.4,
      map: texture,
      transparent: true,
      vertexColors: true,
      blending: AdditiveBlending,
      depthWrite: false,
      opacity: 0.85,
    });
    scene.add(new Points(haloGeometry, haloMaterial));
  }

  /* --------------------------------------------------------------- poussière */

  let dustGeometry: BufferGeometry | null = null;
  let dustMaterial: PointsMaterial | null = null;

  if (settings.dust > 0) {
    dustGeometry = new BufferGeometry();
    const grains = new Float32Array(settings.dust * 3);
    // Répartition déterministe sur une coquille : la poussière fait la
    // profondeur, et elle ne doit pas changer d'une visite à l'autre.
    for (let i = 0; i < settings.dust; i += 1) {
      const y = 1 - ((i + 0.5) / settings.dust) * 2;
      const ring = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = Math.PI * (3 - Math.sqrt(5)) * i;
      const spread = bounds.radius * (2.1 + ((i * 37) % 11) / 11);
      grains.set(
        [Math.cos(theta) * ring * spread, y * spread, Math.sin(theta) * ring * spread],
        i * 3,
      );
    }
    dustGeometry.setAttribute('position', new BufferAttribute(grains, 3));
    dustMaterial = new PointsMaterial({
      size: 0.09,
      color: palette.muted,
      transparent: true,
      opacity: 0.32,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new Points(dustGeometry, dustMaterial));
  }

  /* ------------------------------------------------------------------ strates */

  const maxLayers = Math.max(1, ...Object.values(layers).map((list) => list.length));
  // L'anneau est posé à plat une fois pour toutes dans la géométrie : les
  // matrices d'instance ne portent alors qu'une translation et une échelle.
  const plateGeometry = new RingGeometry(0.82, 1, 48);
  plateGeometry.rotateX(-Math.PI / 2);
  const plateMaterial = new MeshBasicMaterial({
    transparent: true,
    opacity: 0.9,
    side: DoubleSide,
  });
  const plates = new InstancedMesh(plateGeometry, plateMaterial, maxLayers);
  plates.visible = false;
  plates.count = 0;
  scene.add(plates);

  const strataGeometry = new BufferGeometry();
  const strataPositions = new Float32Array(maxLayers * MAX_TECH_PER_LAYER * 6);
  const strataColors = new BufferAttribute(new Float32Array(maxLayers * MAX_TECH_PER_LAYER * 8), 4);
  strataGeometry.setAttribute('position', new BufferAttribute(strataPositions, 3));
  strataGeometry.setAttribute('color', strataColors);
  const strataMaterial = new LineBasicMaterial({ vertexColors: true, transparent: true });
  const strataEdges = new LineSegments(strataGeometry, strataMaterial);
  strataEdges.visible = false;
  scene.add(strataEdges);

  /* -------------------------------------------------------------------- état */

  let focused: string | null = null;
  /*
   * Le composant dont les strates sont construites. Il survit à `focus(null)`
   * le temps que la pile se referme : sans lui, refermer ferait disparaître
   * les couches d'un coup au lieu de les replier.
   */
  let unfolding: string | null = null;
  let highlighted: string | null = null;
  let hovered: number | null = null;
  let unfoldProgress = 0;
  let unfoldTarget = 0;
  let strataPairs = 0;

  let azimuth = 0;
  let elevation = 0;
  let zoom = 1;
  let drift = 0;

  let labels: ReadonlyMap<string, HTMLElement> = new Map();
  let onScreen = true;
  let disposed = false;
  let frame = 0;
  let last = 0;

  const scratch = new Color();
  const projected = new Vector3();

  function aspect(): number {
    return canvas.clientHeight > 0 ? canvas.clientWidth / canvas.clientHeight : 1.6;
  }

  function strataOf(ref: string): { origin: Vector3; strata: readonly Stratum[] } | null {
    const index = indexOf.get(componentNodeId(ref));
    const origin = index === undefined ? undefined : positions[index];
    const stack = layers[ref];
    if (!origin || !stack || stack.length === 0) return null;
    return { origin, strata: unfold(stack, { x: origin.x, y: origin.y, z: origin.z }) };
  }

  function basePose(): Pose {
    if (focused === null) return overviewPose(bounds, aspect());

    const index = indexOf.get(componentNodeId(focused));
    const position = index === undefined ? undefined : positions[index];
    if (!position) return overviewPose(bounds, aspect());

    // Tant que le dépliage n'a pas commencé on vise le noeud ; une fois
    // ouvert, on recule pour cadrer la pile entière.
    return unfoldProgress < 0.05
      ? focusPose(position, bounds, aspect())
      : strataPose(position, strataHeight(layers[focused] ?? []), bounds, aspect());
  }

  function targetPose(): Pose {
    return orbitAround(basePose(), azimuth + drift, elevation, zoom);
  }

  function applyPose(next: Pose): void {
    camera.position.set(next.position.x, next.position.y, next.position.z);
    camera.lookAt(next.target.x, next.target.y, next.target.z);
  }

  let pose: Pose = targetPose();

  /* --------------------------------------------------------------- couleurs */

  /**
   * Un noeud est éteint quand il ne participe ni à la techno mise en avant ni
   * au composant déplié. La même règle sert à la couleur du noeud et à
   * l'opacité de son étiquette : un nom bien lisible au-dessus d'une bille
   * éteinte donnerait deux messages contraires.
   */
  function isDimmed(node: GraphNode): boolean {
    const focusedId = focused === null ? null : componentNodeId(focused);
    const highlightedId = highlighted === null ? null : techNodeId(highlighted);

    return (
      (highlightedId !== null && node.id !== highlightedId && !linked(node.id, highlightedId)) ||
      (focusedId !== null && node.id !== focusedId && !linked(focusedId, node.id))
    );
  }

  function paint(): void {
    const focusedId = focused === null ? null : componentNodeId(focused);
    const highlightedId = highlighted === null ? null : techNodeId(highlighted);

    graph.nodes.forEach((node, index) => {
      const isHovered = hovered === index;
      const isFocused = node.id === focusedId;
      const dimmed =
        (highlightedId !== null && node.id !== highlightedId && !linked(node.id, highlightedId)) ||
        (focusedId !== null && !isFocused && !linked(focusedId, node.id));

      let color = node.kind === 'component' ? palette.text : palette.muted;
      if (isHovered || isFocused) color = palette.accent;

      scratch.setHex(color);
      if (dimmed) scratch.multiplyScalar(0.22);
      else if (node.kind === 'tech' && !isHovered) scratch.multiplyScalar(0.8);
      nodes.setColorAt(index, scratch);

      if (haloColors) {
        const glow = isHovered || isFocused ? 1 : node.kind === 'component' ? 0.42 : 0.24;
        scratch.setHex(color);
        // Le halo du composant déplié s'éteint en même temps que sa bille :
        // ce sont les plaques qui le représentent une fois ouvert, et un halo
        // resté allumé flotterait au milieu de sa propre pile.
        scratch.multiplyScalar((dimmed ? 0.06 : glow) * (isFocused ? 1 - unfoldProgress : 1));
        haloColors.setXYZ(index, scratch.r, scratch.g, scratch.b);
      }
    });

    if (nodes.instanceColor) nodes.instanceColor.needsUpdate = true;
    if (haloColors) haloColors.needsUpdate = true;

    const colors = edgeGeometry.getAttribute('color') as BufferAttribute;
    const hoveredId = hovered === null ? null : (graph.nodes[hovered]?.id ?? null);

    graph.edges.forEach((edge, index) => {
      const onHovered =
        hoveredId !== null && (edge.source === hoveredId || edge.target === hoveredId);
      // Les fils du composant déplié sont remplacés par ceux des strates.
      const replaced = focusedId !== null && edge.source === focusedId;
      const related =
        focusedId !== null && (edge.source === focusedId || edge.target === focusedId);
      const muted =
        (highlightedId !== null && edge.target !== highlightedId) ||
        (focusedId !== null && !related);

      scratch.setHex(onHovered ? palette.accent : palette.line);
      let alpha = onHovered ? 0.95 : 0.55;
      if (muted) alpha = 0.06;
      if (replaced) alpha *= 1 - unfoldProgress;

      colors.setXYZW(index * 2, scratch.r, scratch.g, scratch.b, alpha);
      colors.setXYZW(index * 2 + 1, scratch.r, scratch.g, scratch.b, alpha);
    });
    colors.needsUpdate = true;
  }

  /* ---------------------------------------------------------------- strates */

  /** Compte les fils à tracer et fixe la plage de dessin, une fois par dépliage. */
  function buildStrata(): void {
    if (unfolding === null) {
      strataPairs = 0;
      plates.count = 0;
      plates.visible = false;
      strataEdges.visible = false;
      return;
    }

    const built = strataOf(unfolding);
    if (!built) {
      strataPairs = 0;
      plates.count = 0;
      return;
    }

    let pair = 0;
    for (const layer of built.strata) {
      for (const tech of layer.tech) {
        if (!indexOf.has(techNodeId(tech))) continue;
        if (pair >= maxLayers * MAX_TECH_PER_LAYER) break;
        pair += 1;
      }
    }

    strataPairs = pair;
    plates.count = built.strata.length;
    plates.visible = true;
    strataEdges.visible = pair > 0;
    strataGeometry.setDrawRange(0, pair * 2);
  }

  /** Replace plaques et fils pour l'avancement courant du dépliage. */
  function animateStrata(): void {
    if (unfolding === null) return;
    const built = strataOf(unfolding);
    if (!built) return;

    const { origin, strata } = built;
    // Lissage en S : le dépliage démarre et s'arrête sans à-coup.
    const eased = unfoldProgress * unfoldProgress * (3 - 2 * unfoldProgress);
    const positionsAttribute = strataGeometry.getAttribute('position');
    let pair = 0;

    strata.forEach((layer, slot) => {
      // Les plaques partent toutes du noeud et s'en écartent : le composant
      // s'ouvre depuis sa place dans le graphe, il ne saute pas ailleurs.
      const y = origin.y + (layer.position.y - origin.y) * eased;
      dummy.position.set(origin.x, y, origin.z);
      dummy.scale.setScalar(0.4 + eased * 1.5);
      dummy.updateMatrix();
      plates.setMatrixAt(slot, dummy.matrix);

      // La couche sans techno est la démonstration : elle est à l'accent, les
      // autres au gris. La couleur dit « rien ne sort d'ici ».
      scratch.setHex(layer.pure ? palette.accent : palette.muted);
      scratch.multiplyScalar(layer.pure ? eased : eased * 0.55);
      plates.setColorAt(slot, scratch);

      for (const tech of layer.tech) {
        const target = positions[indexOf.get(techNodeId(tech)) ?? -1];
        if (!target || pair >= strataPairs) continue;
        // Le fil part de la couche où la techno intervient vraiment, et il
        // suit la plaque pendant qu'elle s'écarte.
        strataPositions.set([origin.x, y, origin.z, target.x, target.y, target.z], pair * 6);
        scratch.setHex(palette.accentDim);
        strataColors.setXYZW(pair * 2, scratch.r, scratch.g, scratch.b, eased * 0.85);
        strataColors.setXYZW(pair * 2 + 1, scratch.r, scratch.g, scratch.b, eased * 0.85);
        pair += 1;
      }
    });

    /*
     * La bille du composant s'efface à mesure que ses couches s'écartent : ce
     * sont les plaques qui le représentent une fois ouvert, et laisser les deux
     * à l'écran donnerait un noeud posé au milieu de sa propre pile.
     */
    const index = indexOf.get(componentNodeId(unfolding));
    const node = index === undefined ? undefined : graph.nodes[index];
    if (index !== undefined && node) {
      dummy.position.copy(origin);
      dummy.scale.setScalar(Math.max(radiusOf(node) * (1 - eased), 1e-4));
      dummy.updateMatrix();
      nodes.setMatrixAt(index, dummy.matrix);
      nodes.instanceMatrix.needsUpdate = true;
    }

    plates.instanceMatrix.needsUpdate = true;
    if (plates.instanceColor) plates.instanceColor.needsUpdate = true;
    positionsAttribute.needsUpdate = true;
    strataColors.needsUpdate = true;
  }

  /* ------------------------------------------------------------ étiquettes */

  function placeLabels(): void {
    if (labels.size === 0) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const focusedId = focused === null ? null : componentNodeId(focused);
    // De quoi convertir un rayon du monde en pixels, à une distance donnée.
    const halfPlane = Math.tan((FOV * Math.PI) / 180 / 2);

    graph.nodes.forEach((node, index) => {
      const element = labels.get(node.id);
      const position = positions[index];
      if (!element || !position) return;

      projected.copy(position).project(camera);
      const behind = projected.z > 1;

      // Une techno ne s'étiquette qu'au survol, à la mise en avant, ou quand
      // elle tient au composant déplié : sinon la scène devient un annuaire.
      const wanted =
        node.kind === 'component' ||
        hovered === index ||
        node.ref === highlighted ||
        (focusedId !== null && linked(focusedId, node.id));
      const shown = wanted && !behind;

      element.hidden = !shown;
      if (!shown) return;

      /*
       * L'étiquette se pose sous la bille, pas dessus. Le décalage est le
       * rayon du noeud converti en pixels : il suit donc la perspective, et le
       * nom reste lisible aussi bien en vue d'ensemble, où les noeuds font
       * quelques pixels, qu'au plus près, où ils en font cent.
       */
      const distance = Math.max(camera.position.distanceTo(position), 1e-3);
      const pixels = (radiusOf(node) / (distance * halfPlane)) * (height / 2);

      const x = Math.round((projected.x * 0.5 + 0.5) * width);
      const y = Math.round((-projected.y * 0.5 + 0.5) * height + pixels + 8);

      element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      element.style.opacity = isDimmed(node) ? '0.25' : '1';
    });
  }

  /* ---------------------------------------------------------------- boucle */

  /*
   * Demande une image, sauf si une est déjà demandée ou si personne ne
   * regarde. C'est ici que se joue le « rendu à la demande » promis : lire du
   * code sur une page de composant fait sortir le canevas du cadre, et la
   * scène s'arrête d'elle-même, sans que la galerie ait à le lui dire.
   */
  function invalidate(): void {
    if (disposed || frame !== 0 || !onScreen) return;
    if (document.visibilityState === 'hidden') return;
    frame = requestAnimationFrame(tick);
  }

  function tick(now: number): void {
    frame = 0;
    if (disposed) return;

    const dt = last === 0 ? 1 / 60 : Math.min((now - last) / 1000, 0.1);
    last = now;

    if (settings.drift && focused === null) drift += dt * 0.012;

    const unfolded = unfoldProgress === unfoldTarget;
    if (!unfolded) {
      const step = dt / UNFOLD_SECONDS;
      unfoldProgress =
        unfoldTarget > unfoldProgress
          ? Math.min(unfoldTarget, unfoldProgress + step)
          : Math.max(unfoldTarget, unfoldProgress - step);

      animateStrata();
      paint();

      // Pile refermée : on peut lâcher les strates et rendre les deux appels
      // de dessin qu'elles occupaient.
      if (unfoldProgress === 0 && unfoldTarget === 0 && unfolding !== null) {
        unfolding = null;
        buildStrata();
      }
    }

    const target = targetPose();
    const arrived = settled(pose, target);
    if (!arrived) pose = approach(pose, target, 3.6, dt);
    applyPose(pose);

    placeLabels();
    renderer.render(scene, camera);

    /*
     * On ne redemande une image que si quelque chose bouge encore : c'est tout
     * le rendu à la demande. Au repos, la boucle s'éteint d'elle-même, et
     * `last` est remis à zéro pour que le prochain réveil ne croie pas qu'une
     * minute s'est écoulée en une image.
     */
    const moving =
      !arrived || unfoldProgress !== unfoldTarget || (settings.drift && focused === null);
    if (moving) invalidate();
    else last = 0;
  }

  /* ------------------------------------------------------------ dimensions */

  function resize(): void {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) return;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.maxPixelRatio));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    invalidate();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  /*
   * La scène ne rend rien quand personne ne la regarde : canevas sorti du
   * cadre parce qu'on a fait défiler, ou onglet passé en arrière-plan.
   */
  const intersectionObserver = new IntersectionObserver((entries) => {
    const entry = entries[0];
    onScreen = entry?.isIntersecting ?? true;
    if (onScreen) invalidate();
  });
  intersectionObserver.observe(canvas);

  function onVisibility(): void {
    if (document.visibilityState !== 'hidden') invalidate();
  }
  document.addEventListener('visibilitychange', onVisibility);

  /* ------------------------------------------------------------ interaction */

  let dragging = false;
  let dragged = false;
  let lastX = 0;
  let lastY = 0;

  /**
   * Désignation en espace écran plutôt qu'au lancer de rayon.
   *
   * Les noeuds sont des points lumineux de quelques pixels : viser leur
   * géométrie exacte serait pénible à la souris et impossible au doigt. Un
   * rayon d'accroche en pixels donne la même cible à toutes les distances, et
   * la scène économise le `Raycaster` — quelques kilo-octets de moins.
   */
  function pick(clientX: number, clientY: number): number | null {
    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;

    let best: number | null = null;
    let bestDistance = PICK_RADIUS;
    let bestDepth = Infinity;

    positions.forEach((position, index) => {
      projected.copy(position).project(camera);
      if (projected.z > 1) return;

      const x = (projected.x * 0.5 + 0.5) * rect.width;
      const y = (-projected.y * 0.5 + 0.5) * rect.height;
      const distance = Math.hypot(x - px, y - py);
      if (distance > PICK_RADIUS) return;

      // À portée égale, le noeud le plus proche de la caméra l'emporte.
      if (distance < bestDistance || (distance <= bestDistance && projected.z < bestDepth)) {
        best = index;
        bestDistance = distance;
        bestDepth = projected.z;
      }
    });

    return best;
  }

  function onPointerMove(event: PointerEvent): void {
    if (dragging) {
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 2) dragged = true;

      azimuth -= dx * 0.005;
      elevation = clampElevation(elevation + dy * 0.005);
      invalidate();
      return;
    }

    const found = pick(event.clientX, event.clientY);
    if (found === hovered) return;

    hovered = found;
    canvas.style.cursor =
      found !== null && graph.nodes[found]?.reachable === true ? 'pointer' : 'default';
    options.onHover(found === null ? null : (graph.nodes[found] ?? null));
    paint();
    invalidate();
  }

  function onPointerDown(event: PointerEvent): void {
    dragging = true;
    dragged = false;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  }

  function onPointerUp(event: PointerEvent): void {
    dragging = false;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    // Une rotation n'est pas un clic : sans ça, toute manipulation naviguerait.
    if (dragged) return;

    const found = pick(event.clientX, event.clientY);
    const node = found === null ? null : graph.nodes[found];
    if (node?.kind === 'component' && node.reachable) options.onSelect(node.ref);
  }

  function onPointerLeave(): void {
    if (hovered === null) return;
    hovered = null;
    canvas.style.cursor = 'default';
    options.onHover(null);
    paint();
    invalidate();
  }

  function onWheel(event: WheelEvent): void {
    event.preventDefault();
    zoom = clampZoom(zoom * (1 + Math.sign(event.deltaY) * 0.12));
    invalidate();
  }

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  function onContextLost(event: Event): void {
    // Sans ça, le navigateur ne tentera jamais de restaurer, et surtout la
    // galerie ne saurait pas qu'elle affiche une image morte.
    event.preventDefault();
    options.onLost();
  }
  canvas.addEventListener('webglcontextlost', onContextLost);

  /* ----------------------------------------------------------------- départ */

  resize();
  paint();
  applyPose(pose);
  invalidate();

  return {
    focus(ref) {
      if (ref === focused) return;
      focused = ref;
      unfoldTarget = ref === null ? 0 : 1;

      if (ref !== null && ref !== unfolding) {
        unfolding = ref;
        buildStrata();
      }

      animateStrata();
      paint();
      invalidate();
    },

    highlight(tech) {
      if (tech === highlighted) return;
      highlighted = tech;
      paint();
      invalidate();
    },

    setLabels(elements) {
      labels = elements;
      placeLabels();
    },

    dispose() {
      disposed = true;
      if (frame !== 0) cancelAnimationFrame(frame);
      frame = 0;

      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('webglcontextlost', onContextLost);

      nodeGeometry.dispose();
      nodeMaterial.dispose();
      edgeGeometry.dispose();
      edgeMaterial.dispose();
      plateGeometry.dispose();
      plateMaterial.dispose();
      strataGeometry.dispose();
      strataMaterial.dispose();
      haloGeometry?.dispose();
      haloMaterial?.dispose();
      texture?.dispose();
      dustGeometry?.dispose();
      dustMaterial?.dispose();
      nodes.dispose();
      plates.dispose();

      scene.clear();
      renderer.dispose();
      /*
       * Rendre le contexte tout de suite plutôt que d'attendre le ramasse-
       * miettes : un navigateur n'en garde qu'une poignée, et la galerie peut
       * basculer en 2D puis revenir plusieurs fois dans la même visite.
       */
      renderer.forceContextLoss();
    },
  };
}
