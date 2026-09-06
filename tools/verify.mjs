import { access, open, readFile, readdir, stat } from 'node:fs/promises';
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

const escapeHtmlAttribute = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const directVideoType = (value = '') => {
  const pathname = String(value).split(/[?#]/, 1)[0].toLowerCase();
  if (pathname.endsWith('.mp4')) return 'video/mp4';
  if (pathname.endsWith('.webm')) return 'video/webm';
  return '';
};

const isSupportedVideoEmbed = (value = '') => {
  try {
    const target = new URL(value);
    const hostname = target.hostname.toLowerCase();
    if (['www.youtube-nocookie.com', 'youtube-nocookie.com', 'www.youtube.com', 'youtube.com'].includes(hostname)) {
      return target.pathname.startsWith('/embed/');
    }
    return hostname === 'player.vimeo.com' && target.pathname.startsWith('/video/');
  } catch {
    return false;
  }
};

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

async function hasFastStart(file) {
  const handle = await open(file, 'r');
  try {
    const header = Buffer.alloc(16);
    let offset = 0;
    while (true) {
      const { bytesRead } = await handle.read(header, 0, header.length, offset);
      if (bytesRead < 8) return false;
      let boxSize = BigInt(header.readUInt32BE(0));
      const boxType = header.toString('ascii', 4, 8);
      let headerSize = 8n;
      if (boxSize === 1n) {
        if (bytesRead < 16) return false;
        boxSize = header.readBigUInt64BE(8);
        headerSize = 16n;
      }
      if (boxType === 'moov') return true;
      if (boxType === 'mdat') return false;
      if (boxSize === 0n || boxSize < headerSize || boxSize > BigInt(Number.MAX_SAFE_INTEGER)) return false;
      offset += Number(boxSize);
    }
  } finally {
    await handle.close();
  }
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
  const paperHtml = await readFile(path.join(dist, 'papers', dir.name, 'index.html'), 'utf8');
  for (const item of [...paper.downloads, ...paper.videos]) {
    const target = path.join(paperDir, 'publish', item.src);
    try { await access(target); } catch { errors.push(`${dir.name}: metadata references missing file ${item.src}`); }
  }
  for (const video of paper.videos) {
    const target = path.join(paperDir, 'publish', video.src);
    const publicSrc = `${meta.base || ''}/papers/${dir.name}/files/${video.src}`.replace(/\/{2,}/g, '/');
    const escapedSrc = escapeHtmlAttribute(publicSrc);
    if (!paperHtml.includes(`<source src="${escapedSrc}" type="video/mp4">`)) {
      errors.push(`${dir.name}: hosted video ${video.src} is not rendered with an HTML5 video player`);
    }
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
    if (!await hasFastStart(target)) errors.push(`${dir.name}: ${video.src} is not fast-start optimized (moov must precede mdat)`);
  }
  for (const video of paper.externalVideos || []) {
    if (!video.embedUrl) {
      errors.push(`${dir.name}: external video ${video.title || '(untitled)'} is missing embedUrl`);
      continue;
    }
    const escapedUrl = escapeHtmlAttribute(video.embedUrl);
    const mediaType = directVideoType(video.embedUrl);
    if (mediaType) {
      if (!paperHtml.includes(`<source src="${escapedUrl}" type="${mediaType}">`)) {
        errors.push(`${dir.name}: direct external video ${video.embedUrl} is not rendered with an HTML5 video player`);
      }
      if (paperHtml.includes(`<iframe src="${escapedUrl}"`)) {
        errors.push(`${dir.name}: direct external video ${video.embedUrl} must not be rendered as an iframe`);
      }
    } else {
      if (!isSupportedVideoEmbed(video.embedUrl)) {
        errors.push(`${dir.name}: external video ${video.embedUrl} is not a supported embeddable player URL`);
      }
      if (!paperHtml.includes(`<iframe src="${escapedUrl}"`)) {
        errors.push(`${dir.name}: external embed ${video.embedUrl} is not rendered as an iframe`);
      }
    }
  }
  for (const video of paper.restrictedVideos || []) {
    const escapedUrl = escapeHtmlAttribute(video.officialUrl || '');
    if (escapedUrl && (paperHtml.includes(`<source src="${escapedUrl}"`) || paperHtml.includes(`<iframe src="${escapedUrl}"`))) {
      errors.push(`${dir.name}: restricted video ${video.title || video.officialUrl} must not be rendered as a player`);
    }
  }
  const expectedVideoPlayers = paper.videos.length
    + (paper.externalVideos || []).filter((video) => directVideoType(video.embedUrl)).length;
  const expectedIframePlayers = (paper.externalVideos || []).filter((video) => !directVideoType(video.embedUrl)).length;
  const actualVideoPlayers = (paperHtml.match(/<video\b/g) || []).length;
  const actualIframePlayers = (paperHtml.match(/<iframe\b/g) || []).length;
  if (actualVideoPlayers !== expectedVideoPlayers) {
    errors.push(`${dir.name}: rendered ${actualVideoPlayers} HTML5 video player(s); expected ${expectedVideoPlayers}`);
  }
  if (actualIframePlayers !== expectedIframePlayers) {
    errors.push(`${dir.name}: rendered ${actualIframePlayers} external iframe player(s); expected ${expectedIframePlayers}`);
  }
}

if (!htmlFiles.length) errors.push('No HTML pages were generated');
if (!meta.paperCount) warnings.push('No papers are registered');
for (const warning of warnings) console.warn(`WARN ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);
if (errors.length) process.exit(1);
console.log(`Verified ${htmlFiles.length} HTML page(s); local links and registered media are valid.`);
