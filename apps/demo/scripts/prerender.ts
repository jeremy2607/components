import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { catalog } from '../src/catalog.ts';
import type { ComponentMeta } from '../src/types.ts';

/*
 * Un vrai fichier HTML par composant, écrit après le build.
 *
 * Sur un hébergement statique, /components/status-map/ est alors un dossier
 * qui existe : pas de réécriture, pas de 404 au rechargement, et un titre, une
 * description et des balises Open Graph justes pour les robots comme pour les
 * aperçus de lien, sans exécuter une ligne de JavaScript.
 *
 * Le corps pré-rendu est volontairement minimal : React le remplace au
 * montage. Il sert à ce qui ne monte jamais React, c'est-à-dire aux robots qui
 * n'exécutent rien, et au premier affichage.
 */

const dist = fileURLToPath(new URL('../dist/', import.meta.url));

/** Renseigner SITE_URL au build pour émettre les URL canoniques. */
const origin = process.env['SITE_URL']?.replace(/\/$/, '') ?? '';

function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function replaceTag(html: string, pattern: RegExp, replacement: string): string {
  if (!pattern.test(html))
    throw new Error(`balise introuvable dans index.html : ${pattern.source}`);
  return html.replace(pattern, replacement);
}

/** Le contenu que voit un client sans JavaScript. */
function body(meta: ComponentMeta): string {
  const decisions = meta.decisions
    .map(
      (decision) =>
        `<li><h3 style="font-size:1rem;margin:1.5rem 0 .4rem">${escape(decision.title)}</h3><p style="margin:0">${escape(decision.body)}</p></li>`,
    )
    .join('');

  const layers = meta.layers
    .map(
      (layer) =>
        `<li><strong>${escape(layer.label)}</strong> — ${escape(layer.summary)}${
          layer.tech.length > 0 ? ` (${layer.tech.map(escape).join(', ')})` : ''
        }</li>`,
    )
    .join('');

  const props = meta.props
    .map(
      (prop) =>
        `<tr><td><code>${escape(prop.name)}</code></td><td><code>${escape(prop.type)}</code></td><td>${escape(prop.summary)}</td></tr>`,
    )
    .join('');

  return [
    '<article style="max-width:46rem;margin:0 auto;padding:4rem 1.5rem;font-family:system-ui,sans-serif;line-height:1.6">',
    `<p style="margin:0 0 2rem"><a href="/" style="color:#3df5c5">← tous les composants</a></p>`,
    `<h1 style="font-size:2.5rem;margin:0">${escape(meta.title)}</h1>`,
    `<p style="color:#9aa9bd;font-size:1.1rem">${escape(meta.tagline)}</p>`,
    `<h2>Le problème</h2><p>${escape(meta.problem)}</p>`,
    decisions ? `<h2>Les décisions</h2><ol>${decisions}</ol>` : '',
    layers ? `<h2>La pile</h2><ul>${layers}</ul>` : '',
    props ? `<h2>L'API</h2><table><tbody>${props}</tbody></table>` : '',
    '</article>',
  ].join('');
}

function page(shell: string, meta: ComponentMeta): string {
  let html = shell;

  html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${escape(meta.seo.title)}</title>`);
  html = replaceTag(
    html,
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${escape(meta.seo.description)}" />`,
  );
  html = replaceTag(
    html,
    /<meta property="og:title"[\s\S]*?\/>/,
    `<meta property="og:title" content="${escape(meta.seo.title)}" />`,
  );
  html = replaceTag(
    html,
    /<meta\s+property="og:description"[\s\S]*?\/>/,
    `<meta property="og:description" content="${escape(meta.seo.description)}" />`,
  );

  if (origin !== '') {
    const url = `${origin}/components/${meta.id}/`;
    html = html.replace(
      '</head>',
      `  <link rel="canonical" href="${url}" />\n    <meta property="og:url" content="${url}" />\n  </head>`,
    );
  }

  html = html.replace('</head>', `  ${structuredData(meta)}\n  </head>`);

  return html.replace('<div id="root"></div>', `<div id="root">${body(meta)}</div>`);
}

/**
 * Données structurées : le composant est un logiciel, pas un article.
 *
 * `SoftwareSourceCode` est le type qui décrit ce qu'il est vraiment — du code
 * publiable, dans un langage, sous une licence. Les moteurs s'en servent pour
 * classer la page ailleurs que dans les billets de blog, et le champ
 * `programmingLanguage` est ce qui la rattache à une recherche technique.
 *
 * Écrit seulement quand `SITE_URL` est renseignée : une donnée structurée sans
 * URL absolue ne vaut rien, et en mettre une fausse est pire que rien.
 */
function structuredData(meta: ComponentMeta): string {
  if (origin === '') return '';

  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: meta.title,
    description: meta.seo.description,
    url: `${origin}/components/${meta.id}/`,
    programmingLanguage: 'TypeScript',
    runtimePlatform: 'React',
    codeRepository: 'https://github.com/jeremy2607/components',
    license: 'https://opensource.org/licenses/MIT',
    author: { '@type': 'Person', name: 'Jeremy Prat' },
    ...(meta.packageName ? { alternateName: meta.packageName } : {}),
  };

  /*
   * `<` échappé en unicode : un `</script>` qui apparaîtrait dans une
   * description fermerait la balise et le reste du JSON deviendrait du HTML.
   */
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

const shell = await readFile(join(dist, 'index.html'), 'utf8');
const written: string[] = [];

for (const meta of catalog) {
  if (meta.status === 'planned') continue;

  const directory = join(dist, 'components', meta.id);
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'index.html'), page(shell, meta));
  written.push(`components/${meta.id}/`);
}

if (origin !== '') {
  const home = shell.replace(
    '</head>',
    `  <link rel="canonical" href="${origin}/" />\n    <meta property="og:url" content="${origin}/" />\n  </head>`,
  );
  await writeFile(join(dist, 'index.html'), home);
}

/*
 * Le plan du site et le fichier des robots sont écrits ici plutôt que posés
 * dans `public/` : ils listent les composants, donc ils se déduisent du
 * catalogue. Un fichier commité à la main se serait désynchronisé au premier
 * composant ajouté — c'est le même raisonnement que pour le layout de la scène.
 */
if (origin !== '') {
  const jour = new Date().toISOString().slice(0, 10);
  const urls = ['', ...written.map((chemin) => chemin)];

  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((chemin) =>
      [
        '  <url>',
        `    <loc>${origin}/${chemin}</loc>`,
        `    <lastmod>${jour}</lastmod>`,
        // La page d'accueil est la porte d'entrée ; les composants valent le détour.
        `    <priority>${chemin === '' ? '1.0' : '0.8'}</priority>`,
        '  </url>',
      ].join('\n'),
    ),
    '</urlset>',
    '',
  ].join('\n');

  await writeFile(join(dist, 'sitemap.xml'), sitemap);
  await writeFile(
    join(dist, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
  );
  console.log(`plan du site : ${urls.length} URL`);
} else {
  // Sans URL absolue, les deux fichiers seraient faux : mieux vaut pas de plan
  // du site qu'un plan qui pointe ailleurs.
  console.log('SITE_URL absente : ni sitemap.xml, ni robots.txt, ni données structurées');
}

console.log(`pré-rendu : ${written.join(', ')}`);
