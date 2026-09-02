import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const papersRoot = path.join(root, 'papers');
const distRoot = path.join(root, 'dist');
const config = JSON.parse(await readFile(path.join(root, 'site.config.json'), 'utf8'));

const repoFromEnv = process.env.GITHUB_REPOSITORY?.split('/')[1];
const repo = repoFromEnv || config.repository;
const owner = process.env.GITHUB_REPOSITORY?.split('/')[0] || config.githubOwner;
const base = process.env.SITE_BASE_PATH ?? (repo.endsWith('.github.io') ? '' : `/${repo}`);
const siteOrigin = process.env.SITE_ORIGIN || `https://${owner.toLowerCase()}.github.io`;

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const url = (value = '') => `${base}/${value}`.replace(/\/{2,}/g, '/');
const absoluteUrl = (value = '') => `${siteOrigin}${url(value)}`;

await rm(distRoot, { recursive: true, force: true });
await mkdir(distRoot, { recursive: true });
await cp(path.join(root, 'site', 'assets'), path.join(distRoot, 'assets'), { recursive: true });

const entries = await readdir(papersRoot, { withFileTypes: true });
const papers = [];

for (const entry of entries.filter((item) => item.isDirectory())) {
  const paperRoot = path.join(papersRoot, entry.name);
  const metadata = JSON.parse(await readFile(path.join(paperRoot, 'paper.json'), 'utf8'));
  const analysis = await readFile(path.join(paperRoot, 'analysis', 'analysis.zh.md'), 'utf8');
  if (metadata.slug !== entry.name) {
    throw new Error(`paper.json slug mismatch: ${entry.name}`);
  }
  papers.push({ ...metadata, analysis, paperRoot });
}

papers.sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));

const layout = ({ title, description, body, canonical, extraHead = '' }) => `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="stylesheet" href="${url('assets/styles.css')}">
  <title>${escapeHtml(title)}</title>
  ${extraHead}
</head>
<body>
  <header class="site-header">
    <div class="shell nav">
      <a class="brand" href="${url('')}">Scholar<span>Analysis</span></a>
      <nav class="nav-links" aria-label="主导航">
        <a href="${url('')}">论文汇总</a>
        <a href="https://github.com/${owner}/${repo}/issues">提问与讨论</a>
      </nav>
    </div>
  </header>
  ${body}
  <footer class="site-footer">
    <div class="shell">论文原文与补充材料的权利归各自权利人所有；本站分析用于学习、研究与工程讨论。</div>
  </footer>
  <script src="${url('assets/app.js')}" defer></script>
</body>
</html>`;

const cards = papers.map((paper) => `
  <a class="paper-card" href="${url(`papers/${paper.slug}/`)}">
    <div>
      <h3>${escapeHtml(paper.titleZh)}</h3>
      <p>${escapeHtml(paper.summary)}</p>
    </div>
    <div class="paper-meta">${escapeHtml(paper.year)} · ${escapeHtml(paper.venue)}</div>
  </a>`).join('');

const home = layout({
  title: `${config.titleZh} · ${config.title}`,
  description: config.description,
  canonical: absoluteUrl(''),
  body: `
  <main>
    <section class="hero">
      <div class="shell hero-grid">
        <div>
          <h1>把论文读成可以动手验证的工程知识</h1>
          <p>${escapeHtml(config.description)} 每篇论文都有独立材料目录、中文技术拆解、经授权的材料和视频入口，以及 GitHub Issue 讨论入口。</p>
          <a class="button" href="#papers">浏览论文</a>
        </div>
        <figure class="hero-visual">
          <img src="${url('assets/hero-liquid-metal-eye.webp')}" alt="仿生人工视网膜、液态金属瞳孔和相机组成的科研概念装置">
          <figcaption>GPT Image 2 科研概念示意图</figcaption>
        </figure>
      </div>
    </section>
    <section class="section" id="papers">
      <div class="shell">
        <div class="section-head">
          <h2>论文汇总</h2>
          <span>${papers.length} 篇</span>
        </div>
        <div class="paper-list">${cards}</div>
      </div>
    </section>
  </main>`,
});
await writeFile(path.join(distRoot, 'index.html'), home, 'utf8');

for (const paper of papers) {
  const paperOutput = path.join(distRoot, 'papers', paper.slug);
  await mkdir(paperOutput, { recursive: true });
  const publishRoot = path.join(paper.paperRoot, 'publish');
  await cp(publishRoot, path.join(paperOutput, 'files'), {
    recursive: true,
    filter: (source) => path.basename(source).toLowerCase() !== 'readme.md',
  });

  const downloads = paper.downloads.length
    ? `<ul>${paper.downloads.map((item) => `<li><a href="${url(`papers/${paper.slug}/files/${item.src}`)}" download>${escapeHtml(item.title)}</a></li>`).join('')}</ul>`
    : '<p>原文无完整公开再分发许可，本站不提供下载；请使用期刊官方入口。</p>';

  const videos = paper.videos.length
    ? `<div class="media-grid">${paper.videos.map((item) => `
      <figure class="media-item">
        <video controls playsinline preload="metadata" ${item.poster ? `poster="${url(`papers/${paper.slug}/files/${item.poster}`)}"` : ''}>
          <source src="${url(`papers/${paper.slug}/files/${item.src}`)}" type="video/mp4">
          你的浏览器不支持 HTML5 视频。<a href="${url(`papers/${paper.slug}/files/${item.src}`)}">下载视频</a>
        </video>
        <figcaption class="media-caption"><strong>${escapeHtml(item.title)}</strong>${escapeHtml(item.caption || '')}${item.download !== false ? ` · <a href="${url(`papers/${paper.slug}/files/${item.src}`)}" download>下载原视频</a>` : ''}</figcaption>
      </figure>`).join('')}</div>`
    : '<div class="empty-state">论文补充视频没有完整公开再分发许可，因此本站不托管或播放。后续获得授权或官方可嵌入地址后，可直接接入 HTML5 播放器。</div>';

  const topics = paper.topics.map((topic) => `<li>${escapeHtml(topic)}</li>`).join('');
  const analysisBody = paper.analysis.replace(/^#\s+.*(?:\r?\n)+/, '');
  const page = layout({
    title: `${paper.titleZh} · ${config.title}`,
    description: paper.summary,
    canonical: absoluteUrl(`papers/${paper.slug}/`),
    body: `
    <main>
      <section class="paper-hero">
        <div class="shell">
          <div class="paper-kicker">${escapeHtml(paper.venue)} · ${escapeHtml(paper.publishedAt)}</div>
          <h1>${escapeHtml(paper.titleZh)}</h1>
          <p class="paper-summary">${escapeHtml(paper.summary)}</p>
          <div class="meta-row">
            <span>DOI：<a href="https://doi.org/${escapeHtml(paper.doi)}">${escapeHtml(paper.doi)}</a></span>
            <span>状态：${escapeHtml(paper.status)}</span>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="shell paper-layout">
          <article class="prose" data-paragraph-comments data-owner="${escapeHtml(owner)}" data-repo="${escapeHtml(repo)}" data-paper="${escapeHtml(paper.slug)}" data-title="${escapeHtml(paper.titleZh)}">
            <div class="paragraph-comment-guide"><span aria-hidden="true">+</span><div>悬停在自然段上可直接提问；如果想精确到某一句，请先选中文字，再点击段落右侧的 +。</div></div>
            ${marked.parse(analysisBody)}
          </article>
          <aside class="side-panel">
            <h2>主题</h2>
            <ul>${topics}</ul>
            <h2 style="margin-top:24px">材料下载</h2>
            ${downloads}
            <p class="rights-note">${escapeHtml(paper.rightsNote)}</p>
            <a class="button secondary" href="${escapeHtml(paper.officialUrl)}">期刊官方页</a>
          </aside>
        </div>
      </section>
      <section class="section" id="videos">
        <div class="shell">
          <div class="section-head"><h2>补充视频</h2></div>
          ${videos}
        </div>
      </section>
      <section class="section">
        <div class="shell question-box">
          <h2>对整篇论文有综合意见？</h2>
          <p>这里适合不针对某个自然段的整体问题。段落级问题可以直接点击正文右侧的 +。</p>
          <form data-issue-form data-owner="${escapeHtml(owner)}" data-repo="${escapeHtml(repo)}" data-paper="${escapeHtml(paper.slug)}" data-title="${escapeHtml(paper.titleZh)}">
            <textarea aria-label="问题或建议" placeholder="例如：这里的液态金属为什么会随光强变化？控制回路的阈值在哪里？"></textarea>
            <button class="button" type="submit">在 GitHub Issue 中继续</button>
          </form>
        </div>
      </section>
    </main>`,
  });
  await writeFile(path.join(paperOutput, 'index.html'), page, 'utf8');
}

await writeFile(path.join(distRoot, 'build-meta.json'), JSON.stringify({ owner, repo, base, paperCount: papers.length }, null, 2), 'utf8');
console.log(`Built ${papers.length} paper page(s) at ${distRoot} with base ${base || '/'}`);
