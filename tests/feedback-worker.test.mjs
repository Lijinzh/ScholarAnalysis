import assert from 'node:assert/strict';
import test from 'node:test';
import { buildIssue, handleRequest } from '../services/feedback-worker/src/index.js';

const basePayload = {
  kind: 'paragraph',
  slug: '2026-example-paper',
  paperTitle: '示例论文',
  pageUrl: 'https://lijinzh.github.io/ScholarAnalysis/papers/2026-example-paper/#paragraph-01-demo',
  paragraphNumber: 1,
  paragraphId: 'paragraph-01-demo',
  selectedText: '液态金属脉冲逻辑',
  quotedText: '液态金属脉冲逻辑',
  paragraphText: '这是一段用于测试的完整段落。',
  question: '这里为什么会产生脉冲？',
  clientSubmissionId: '00000000-0000-4000-8000-000000000001',
};

const env = {
  ALLOW_UNVERIFIED: 'true',
  ALLOWED_ORIGINS: 'https://lijinzh.github.io',
  ALLOWED_PAGE_HOSTS: 'lijinzh.github.io',
  GITHUB_OWNER: 'Lijinzh',
  GITHUB_REPO: 'ScholarAnalysis',
  GITHUB_LABEL: 'paper-feedback',
  GITHUB_TOKEN: 'test-token',
};

test('buildIssue preserves paragraph context and submission id', () => {
  const issue = buildIssue(basePayload, env);
  assert.match(issue.title, /^\[Paragraph 1: 2026-example-paper\]/);
  assert.match(issue.body, /液态金属脉冲逻辑/);
  assert.match(issue.body, /scholar-feedback-id/);
  assert.deepEqual(issue.labels, ['paper-feedback']);
});

test('handleRequest creates an issue without redirecting the browser', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return Response.json({ number: 42, title: 'Created', html_url: 'https://github.com/Lijinzh/ScholarAnalysis/issues/42' }, { status: 201 });
  };
  const request = new Request('https://feedback.example/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'https://lijinzh.github.io' },
    body: JSON.stringify(basePayload),
  });
  const response = await handleRequest(request, env, { fetchImpl });
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://lijinzh.github.io');
  assert.equal((await response.json()).number, 42);
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /repos\/Lijinzh\/ScholarAnalysis\/issues$/);
});

test('handleRequest rejects untrusted origins before GitHub is called', async () => {
  const request = new Request('https://feedback.example/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'https://attacker.example' },
    body: JSON.stringify(basePayload),
  });
  const response = await handleRequest(request, env, { fetchImpl: () => assert.fail('fetch must not be called') });
  assert.equal(response.status, 403);
});

test('handleRequest validates Turnstile action and hostname before creating an issue', async () => {
  const calls = [];
  const verifiedEnv = {
    ...env,
    ALLOW_UNVERIFIED: 'false',
    TURNSTILE_SECRET: 'turnstile-secret',
    TURNSTILE_HOSTNAMES: 'lijinzh.github.io',
  };
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (String(url).includes('/siteverify')) {
      return Response.json({ success: true, action: 'paper-feedback', hostname: 'lijinzh.github.io' });
    }
    return Response.json({ number: 43, title: 'Created', html_url: 'https://github.com/Lijinzh/ScholarAnalysis/issues/43' }, { status: 201 });
  };
  const request = new Request('https://feedback.example/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'https://lijinzh.github.io' },
    body: JSON.stringify({ ...basePayload, turnstileToken: 'valid-token' }),
  });
  const response = await handleRequest(request, verifiedEnv, { fetchImpl });
  assert.equal(response.status, 201);
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /siteverify$/);
  assert.equal(calls[0].options.signal instanceof AbortSignal, true);
  assert.match(calls[1].url, /repos\/Lijinzh\/ScholarAnalysis\/issues$/);
});

for (const [name, turnstileResult] of [
  ['wrong action', { success: true, action: 'other-action', hostname: 'lijinzh.github.io' }],
  ['wrong hostname', { success: true, action: 'paper-feedback', hostname: 'attacker.example' }],
  ['replayed token', { success: false, 'error-codes': ['timeout-or-duplicate'] }],
]) {
  test(`handleRequest rejects ${name} without calling GitHub`, async () => {
    const verifiedEnv = {
      ...env,
      ALLOW_UNVERIFIED: 'false',
      TURNSTILE_SECRET: 'turnstile-secret',
      TURNSTILE_HOSTNAMES: 'lijinzh.github.io',
    };
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return Response.json(turnstileResult);
    };
    const request = new Request('https://feedback.example/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'https://lijinzh.github.io' },
      body: JSON.stringify({ ...basePayload, turnstileToken: 'invalid-token' }),
    });
    const response = await handleRequest(request, verifiedEnv, { fetchImpl });
    assert.equal(response.status, 400);
    assert.equal(calls, 1);
    assert.match((await response.json()).message, /安全验证失败/);
  });
}

test('handleRequest rejects missing Turnstile proof', async () => {
  const verifiedEnv = {
    ...env,
    ALLOW_UNVERIFIED: 'false',
    TURNSTILE_SECRET: 'turnstile-secret',
    TURNSTILE_HOSTNAMES: 'lijinzh.github.io',
  };
  const request = new Request('https://feedback.example/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'https://lijinzh.github.io' },
    body: JSON.stringify(basePayload),
  });
  const response = await handleRequest(request, verifiedEnv, { fetchImpl: () => assert.fail('fetch must not be called') });
  assert.equal(response.status, 400);
});

test('handleRequest rejects oversized request bodies', async () => {
  const request = new Request('https://feedback.example/api/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': String(33 * 1024),
      'Origin': 'https://lijinzh.github.io',
    },
    body: JSON.stringify(basePayload),
  });
  const response = await handleRequest(request, env, { fetchImpl: () => assert.fail('fetch must not be called') });
  assert.equal(response.status, 413);
});

test('handleRequest reports GitHub API failures without redirecting', async () => {
  const request = new Request('https://feedback.example/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'https://lijinzh.github.io' },
    body: JSON.stringify(basePayload),
  });
  const response = await handleRequest(request, env, {
    fetchImpl: async () => Response.json({ message: 'failed' }, { status: 500 }),
  });
  assert.equal(response.status, 502);
  assert.match((await response.json()).message, /GitHub/);
});

test('handleRequest applies the configured rate limiter', async () => {
  const limitedEnv = {
    ...env,
    FEEDBACK_RATE_LIMITER: { limit: async () => ({ success: false }) },
  };
  const request = new Request('https://feedback.example/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': 'https://lijinzh.github.io' },
    body: JSON.stringify(basePayload),
  });
  const response = await handleRequest(request, limitedEnv, { fetchImpl: () => assert.fail('fetch must not be called') });
  assert.equal(response.status, 429);
});
