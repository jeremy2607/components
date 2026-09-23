import { useEffect, useRef, useState } from 'react';
import layout from 'virtual:layout';
import { catalog } from '../catalog';
import { hrefFor, navigate } from '../router';
import { useGallery } from '../store/useGallery';
import type { StackLayer } from '../types';
import { graph, type GraphNode } from './graph';
import { createScene, type SceneHandle } from './renderer';
import type { Tier, TierSettings } from './tiers';

/*
 * Ce module est la frontière du morceau paresseux : c'est lui qui tire
 * three.js, et rien au-dessus ne le connaît. La page d'accueil se charge et
 * s'affiche sans avoir téléchargé un octet de 3D.
 */

const LAYERS: Readonly<Record<string, readonly StackLayer[]>> = Object.fromEntries(
  catalog.map((meta) => [meta.id, meta.layers]),
);

const USAGE = new Map(
  graph.nodes.filter((node) => node.kind === 'tech').map((node) => [node.id, node.degree]),
);

interface SceneProps {
  /** Le composant de la route courante, ou rien en vue d'ensemble. */
  focus: string | null;
  settings: TierSettings;
  tier: Tier;
}

/*
 * L'aide dépend du palier, parce qu'elle dépend de l'appareil : promettre une
 * molette à qui tient un téléphone, c'est indiquer une commande qui n'existe
 * pas. Le palier mobile est justement celui du pointeur grossier.
 */
function hintFor(node: GraphNode | null, tier: Tier): string {
  if (!node) {
    return tier === 'mobile'
      ? 'Glisser pour tourner · toucher pour ouvrir'
      : 'Glisser pour tourner · molette pour approcher';
  }
  if (node.kind === 'tech') {
    const count = USAGE.get(node.id) ?? 0;
    return `${node.label} — ${count} composant${count > 1 ? 's' : ''}`;
  }
  if (!node.reachable) return `${node.label} — à venir`;
  return tier === 'mobile'
    ? `${node.label} — toucher pour ouvrir`
    : `${node.label} — cliquer pour ouvrir`;
}

export default function Scene({ focus, settings, tier }: SceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelsRef = useRef(new Map<string, HTMLElement>());
  const handleRef = useRef<SceneHandle | null>(null);
  const [hint, setHint] = useState(() => hintFor(null, tier));

  const techFilter = useGallery((state) => state.techFilter);
  const demote = useGallery((state) => state.demote);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const labels = labelsRef.current;
    const handle = createScene({
      canvas,
      graph,
      layout,
      settings,
      layers: LAYERS,
      onSelect: (ref) => {
        navigate(hrefFor(ref));
      },
      onHover: (node) => {
        setHint(hintFor(node, tier));
      },
      // Contexte perdu : la galerie repasse en 2D plutôt que d'afficher une
      // image morte que rien ne rafraîchira.
      onLost: demote,
    });

    handleRef.current = handle;
    handle.setLabels(labels);

    return () => {
      handleRef.current = null;
      handle.dispose();
    };
  }, [settings, tier, demote]);

  useEffect(() => {
    handleRef.current?.focus(focus);
  }, [focus]);

  useEffect(() => {
    handleRef.current?.highlight(techFilter);
  }, [techFilter]);

  return (
    <div className="relative h-full w-full">
      {/*
       * La scène est un spectacle, pas une navigation : elle est masquée aux
       * technologies d'assistance, et la grille de la page en dessous reste la
       * vraie liste des composants, dans le DOM, au clavier, et pour les robots.
       */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="block h-full w-full"
        // Le glissement horizontal tourne la scène, le vertical fait défiler
        // la page : sur un téléphone, on ne se retrouve jamais piégé dedans.
        style={{ touchAction: 'pan-y' }}
      />

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {graph.nodes.map((node) => (
          <span
            key={node.id}
            ref={(element) => {
              if (element) labelsRef.current.set(node.id, element);
              else labelsRef.current.delete(node.id);
            }}
            hidden
            className="absolute left-0 top-0 will-change-transform"
          >
            {/* Le décalage vertical vient de la scène, qui connaît le rayon du
                noeud à l'écran ; ici, seul le centrage horizontal. */}
            <span
              className={`block -translate-x-1/2 whitespace-nowrap font-mono text-[11px] ${
                node.kind === 'component' ? 'text-text-1' : 'text-text-2'
              }`}
            >
              {node.label}
            </span>
          </span>
        ))}
      </div>

      <p
        aria-hidden="true"
        className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-[11px] text-text-2"
      >
        {hint}
      </p>
    </div>
  );
}
