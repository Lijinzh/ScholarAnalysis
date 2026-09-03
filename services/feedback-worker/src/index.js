const GITHUB_API_VERSION = '2022-11-28';
const MAX_PAYLOAD_BYTES = 32 * 1024;

function splitList(value = '') {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function jsonResponse(data, status, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(origin ? corsHeaders(origin) : {}),
    },
  });
}

function requiredText(value, name, maxLength) {
  if (typeof value !== 'string') throw new Error(`${name} 缺失。`);
  const text = value.trim();
  if (!text) throw new Error(`${name} 不能为空。`);
  if (text.length > maxLength) throw new Error(`${name} 超过 ${maxLength} 个字符。`);
  return text;
}

function optionalText(value, maxLength) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new Error('字段格式不正确。');
  return value.trim().slice(0, maxLength);
}

function quoteMarkdown(value, limit = 1200) {
  const text = value.length > limit ? `${value.slice(0, limit)}…` : value;
  return text.split('\n').map((line) => `> ${line}`).join('\n');
}

function validatePageUrl(value, env) {
  const pageUrl = new URL(requiredText(value, '页面链接', 1000));
  if (!['http:', 'https:'].includes(pageUrl.protocol)) throw new Error('页面链接协议不正确。');
  const allowedHosts = splitList(env.ALLOWED_PAGE_HOSTS);
  if (allowedHosts.length && !allowedHosts.includes(pageUrl.hostname)) throw new Error('页面链接来源不受信任。');
  return pageUrl.toString();
}

export function buildIssue(payload, env) {
  const kind = payload.kind === 'paragraph' ? 'paragraph' : payload.kind === 'paper' ? 'paper' : '';
  if (!kind) throw new Error('问题类型不正确。');

  const slug = requiredText(payload.slug, '论文 slug', 220);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(slug)) throw new Error('论文 slug 格式不正确。');
  const paperTitle = requiredText(payload.paperTitle, '论文标题', 500);
  const pageUrl = validatePageUrl(payload.pageUrl, env);
  const question = requiredText(payload.question, '问题或建议', 5000);
  const submissionId = requiredText(payload.clientSubmissionId, '提交标识', 100);
  if (!/^[A-Za-z0-9-]+$/.test(submissionId)) throw new Error('提交标识格式不正确。');

  const body = [
    '## 论文',
    paperTitle,
    '',
    `- slug: \`${slug}\``,
    `- 页面: ${pageUrl}`,
  ];

  let title;
  if (kind === 'paragraph') {
    const paragraphNumber = Number(payload.paragraphNumber);
    if (!Number.isInteger(paragraphNumber) || paragraphNumber < 1 || paragraphNumber > 10000) throw new Error('段落编号不正确。');
    const paragraphId = requiredText(payload.paragraphId, '段落锚点', 160);
    const quotedText = requiredText(payload.quotedText, '针对内容', 5000);
    const paragraphText = requiredText(payload.paragraphText, '完整段落', 8000);
    const selectedText = optionalText(payload.selectedText, 3000);
    title = `[Paragraph ${paragraphNumber}: ${slug}] ${question.slice(0, 52)}`;
    body.push(`- 段落: 第 ${paragraphNumber} 段`, `- 锚点: \`${paragraphId}\``, '');
    body.push(selectedText ? '## 选中的句子' : '## 针对内容', quoteMarkdown(quotedText), '');
    if (selectedText) body.push('## 所在完整段落', quoteMarkdown(paragraphText), '');
  } else {
    title = `[Paper: ${slug}] ${question.slice(0, 60)}`;
    body.push('', '## 整篇论文的问题或建议');
  }

  body.push(question, '', `<!-- scholar-feedback-id: ${submissionId} -->`);
  return { title, body: body.join('\n'), labels: [env.GITHUB_LABEL || 'paper-feedback'] };
}

async function verifyTurnstile(payload, request, env, fetchImpl) {
  if (env.ALLOW_UNVERIFIED === 'true') return;
  if (!env.TURNSTILE_SECRET) throw new Error('自动提交服务的安全验证尚未配置。');
  const expectedHostnames = splitList(env.TURNSTILE_HOSTNAMES);
  if (!expectedHostnames.length) throw new Error('自动提交服务的验证域名尚未配置。');
  const token = requiredText(payload.turnstileToken, '安全验证', 2048);
  const form = new URLSearchParams({
    secret: env.TURNSTILE_SECRET,
    response: token,
  });
  const remoteIp = request.headers.get('CF-Connecting-IP');
  if (remoteIp) form.set('remoteip', remoteIp);
  const response = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal: AbortSignal.timeout(10_000),
    body: form,
  });
  const result = await response.json();
  if (
    !response.ok
    || !result.success
    || result.action !== 'paper-feedback'
    || !expectedHostnames.includes(result.hostname)
  ) {
    throw new Error('安全验证失败，请重新提交。');
  }
}

export async function handleRequest(request, env, { fetchImpl = fetch } = {}) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = splitList(env.ALLOWED_ORIGINS);
  const originAllowed = allowedOrigins.includes(origin);

  if (request.method === 'OPTIONS') {
    if (!originAllowed) return jsonResponse({ message: '来源不受信任。' }, 403);
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  const url = new URL(request.url);
  if (url.pathname !== '/api/feedback') return jsonResponse({ message: 'Not found' }, 404);
  if (request.method !== 'POST') return jsonResponse({ message: 'Method not allowed' }, 405, originAllowed ? origin : '');
  if (!originAllowed) return jsonResponse({ message: '来源不受信任。' }, 403);

  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > MAX_PAYLOAD_BYTES) return jsonResponse({ message: '提交内容过大。' }, 413, origin);

  if (env.FEEDBACK_RATE_LIMITER) {
    const actor = request.headers.get('CF-Connecting-IP') || 'unknown';
    const { success } = await env.FEEDBACK_RATE_LIMITER.limit({ key: actor });
    if (!success) return jsonResponse({ message: '提交过于频繁，请稍后再试。' }, 429, origin);
  }

  try {
    const rawPayload = await request.text();
    if (new TextEncoder().encode(rawPayload).byteLength > MAX_PAYLOAD_BYTES) {
      return jsonResponse({ message: '提交内容过大。' }, 413, origin);
    }
    let payload;
    try {
      payload = JSON.parse(rawPayload);
    } catch {
      return jsonResponse({ message: '提交内容格式不正确。' }, 400, origin);
    }
    await verifyTurnstile(payload, request, env, fetchImpl);
    const issue = buildIssue(payload, env);
    if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPO) throw new Error('GitHub Issue 服务尚未配置。');

    const githubResponse = await fetchImpl(`https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ScholarAnalysis-Feedback-Worker',
        'X-GitHub-Api-Version': GITHUB_API_VERSION,
      },
      body: JSON.stringify(issue),
    });
    if (!githubResponse.ok) {
      console.error('GitHub issue creation failed', githubResponse.status);
      return jsonResponse({ message: 'GitHub 暂时没有接受这次提交，请稍后重试。' }, 502, origin);
    }

    const created = await githubResponse.json();
    return jsonResponse({ number: created.number, title: created.title, htmlUrl: created.html_url }, 201, origin);
  } catch (error) {
    const clientError = /缺失|不能为空|超过|格式|类型|编号|来源|协议|安全验证/.test(error.message);
    return jsonResponse({ message: error.message || '自动保存失败，请稍后重试。' }, clientError ? 400 : 503, origin);
  }
}

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  },
};
