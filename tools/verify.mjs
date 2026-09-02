import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = spawnSync(process.execPath, [path.join(root, 'tools', 'build-site.mjs')], { cwd: root, stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status || 1);

const dist = path.join(root, 'dist');
const meta = JSON.parse(await readFile(path.join(dist, 'build-meta.json'), 'utf8'));
const errors = [];
const warnings = [];

async function walk(directory) {
  const items = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const item of items) {
    const full = path.join(directory, item.name);
    if (item.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

const htmlFiles = (await walk(dist)).filter((file) => file.endsWith('.html'));
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const ref = match[1];
    if (/^(https?:|mailto:|#)/.test(ref)) continue;
    let pathname = ref.split(/[?#]/)[0];
    let target;
    if (meta.base && pathname.startsWith(meta.base)) {
      pathname = pathname.slice(meta.base.length).replace(/^\//, '');
      target = path.join(dist, pathname);
    } else if (pathname.startsWith('/')) {
      target = path.join(dist, pathname.replace(/^\//, ''));
    } else {
      target = path.resolve(path.dirname(file), pathname);
    }
    if (ref.endsWith('/')) target = path.join(target, 'index.html');
    try { await access(target); } catch { errors.push(`${path.relative(root, file)} -> missing ${ref}`); }
  }
  if (html.includes('href="') && html.includes('.md"')) errors.push(`${path.relative(root, file)} links to Markdown`);
}

const papersDir = path.join(root, 'papers');
for (const dir of (await readdir(papersDir, { withFileTypes: true })).filter((item) => item.isDirectory())) {
  const paperDir = path.join(papersDir, dir.name);
  const paper = JSON.parse(await readFile(path.join(paperDir, 'paper.json'), 'utf8'));
  for (const item of [...paper.downloads, ...paper.videos]) {
    const target = path.join(paperDir, 'publish', item.src);
    try { await access(target); } catch { errors.push(`${dir.name}: metadata references missing file ${item.src}`); }
  }
  for (const video of paper.videos) {
    const target = path.join(paperDir, 'publish', video.src);
    let info;
    try { info = await stat(target); } catch { continue; }
    if (info.size >= 95 * 1024 * 1024) errors.push(`${dir.name}: ${video.src} is ${(info.size / 1024 / 1024).toFixed(1)} MiB; keep it below 95 MiB`);
    const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name', '-of', 'json', target], { encoding: 'utf8' });
    if (probe.status !== 0) {
      errors.push(`${dir.name}: ffprobe failed for ${video.src}`);
      continue;
    }
    const streams = JSON.parse(probe.stdout).streams || [];
    const videoCodec = streams.find((stream) => stream.codec_type === 'video')?.codec_name;
    const audioCodec = streams.find((stream) => stream.codec_type === 'audio')?.codec_name;
    if (videoCodec !== 'h264') errors.push(`${dir.name}: ${video.src} uses ${videoCodec || 'no video codec'}; expected H.264`);
    if (audioCodec && audioCodec !== 'aac') errors.push(`${dir.name}: ${video.src} uses ${audioCodec} audio; expected AAC or no audio`);
  }
}

if (!htmlFiles.length) errors.push('No HTML pages were generated');
if (!meta.paperCount) warnings.push('No papers are registered');
for (const warning of warnings) console.warn(`WARN ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);
if (errors.length) process.exit(1);
console.log(`Verified ${htmlFiles.length} HTML page(s); local links and registered media are valid.`);
