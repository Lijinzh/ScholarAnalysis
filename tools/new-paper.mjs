import { cp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slug = process.argv[2];
if (!slug || !/^[A-Za-z0-9][A-Za-z0-9-]+$/.test(slug)) {
  console.error('Usage: pnpm new-paper 2026-Full-or-recognizable-paper-title');
  process.exit(1);
}

const template = path.join(root, 'templates', 'paper');
const target = path.join(root, 'papers', slug);
await cp(template, target, { recursive: true, errorOnExist: true, force: false });

for (const relative of ['paper.json', 'README.md']) {
  const file = path.join(target, relative);
  const content = await readFile(file, 'utf8');
  await writeFile(file, content.replaceAll('__SLUG__', slug), 'utf8');
}
console.log(`Created paper workspace: ${target}`);
