// Assembles the deployable static site into ./site (index.html, styles.css, dist/).
import { cp, mkdir, rm } from 'node:fs/promises';

const OUT = 'site';

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await Promise.all([
  cp('index.html', `${OUT}/index.html`),
  cp('styles.css', `${OUT}/styles.css`),
  cp('dist', `${OUT}/dist`, { recursive: true }),
]);

console.warn(`Static site is ready in ./${OUT}`);
