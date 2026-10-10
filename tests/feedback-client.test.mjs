import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../site/assets/app.js', import.meta.url), 'utf8');

function fixture() {
  let now = 0;
  let nextTimer = 0;
  const timers = new Map();
  const widgets = new Set();
  const form = { children: [], append(node) { this.children.push(node); }, querySelector() { return null; } };
  const button = { disabled: false, textContent: '自动保存问题' };
  const status = { textContent: '', dataset: {} };
  const calls = [];
  let callbacks;
  const context = vm.createContext({
    AbortController,
    crypto: { randomUUID: () => '00000000-0000-4000-8000-000000000001' },
    document: {
      body: { dataset: { feedbackEndpoint: 'https://feedback.example/api/feedback', turnstileSiteKey: 'public-test-key' } },
      querySelectorAll: () => [],
      querySelector: () => null,
      createElement: () => ({ remove() { form.children = form.children.filter(node => node !== this); } }),
    },
    setTimeout(callback, delay) {
      const id = ++nextTimer;
      timers.set(id, { callback, at: now + delay });
      return id;
    },
    clearTimeout: id => timers.delete(id),
    turnstile: {
      render(container, options) { callbacks = options; widgets.add('widget'); return 'widget'; },
      execute() {},
      remove: id => widgets.delete(id),
    },
    fetch: async (url, options) => {
      calls.push({ url, options });
      assert.equal(options.signal.aborted, false, 'the request must start with a fresh timeout');
      return { ok: true, json: async () => ({ number: 42 }) };
    },
  });
  vm.runInContext(source, context);
  async function flush() { for (let index = 0; index < 12; index += 1) await Promise.resolve(); }
  return {
    context, form, button, status, calls, widgets, timers,
    callbacks: () => callbacks,
    submit: () => context.submitFeedback({ form, button, status, payload: { question: '测试问题' } }),
    flush,
    async advance(milliseconds) {
      now += milliseconds;
      for (const [id, timer] of [...timers]) {
        if (timer.at <= now) { timers.delete(id); timer.callback(); }
      }
      await flush();
    },
  };
}

test('slow human verification does not consume the request timeout', async () => {
  const f = fixture();
  const result = f.submit();
  await f.flush();
  await f.advance(60000);
  assert.equal(f.calls.length, 0);
  assert.equal(f.button.disabled, true);
  f.callbacks().callback('verified-token');
  assert.equal(await result, true);
  assert.equal(f.calls.length, 1);
  assert.equal(JSON.parse(f.calls[0].options.body).turnstileToken, 'verified-token');
  assert.match(f.status.textContent, /Issue #42/);
  assert.equal(f.form.children.length, 0);
  assert.equal(f.widgets.size, 0);
  assert.equal(f.timers.size, 0);
  assert.equal(f.button.disabled, false);
});

test('verification timeout removes its widget and allows an explicit retry', async () => {
  const f = fixture();
  const result = f.submit();
  await f.flush();
  await f.advance(120000);
  assert.equal(await result, false);
  assert.equal(f.calls.length, 0);
  assert.match(f.status.textContent, /安全验证超时/);
  assert.equal(f.form.children.length, 0);
  assert.equal(f.widgets.size, 0);
  const retry = f.submit();
  await f.flush();
  f.callbacks().callback('new-token');
  assert.equal(await retry, true);
});

for (const callback of ['error-callback', 'expired-callback']) {
  test(`${callback} releases verification resources without submitting`, async () => {
    const f = fixture();
    const result = f.submit();
    await f.flush();
    f.callbacks()[callback]();
    assert.equal(await result, false);
    assert.equal(f.calls.length, 0);
    assert.equal(f.form.children.length, 0);
    assert.equal(f.widgets.size, 0);
    assert.equal(f.timers.size, 0);
    assert.equal(f.button.disabled, false);
  });
}

test('render failure still removes the container and verification timer', async () => {
  const f = fixture();
  f.context.turnstile.render = () => { throw new Error('render failed'); };
  assert.equal(await f.submit(), false);
  assert.equal(f.form.children.length, 0);
  assert.equal(f.timers.size, 0);
  assert.equal(f.button.disabled, false);
});

test('duplicate submit while verification is pending cannot create a second request', async () => {
  const f = fixture();
  const result = f.submit();
  await f.flush();
  assert.equal(await f.submit(), false);
  f.callbacks().callback('verified-token');
  assert.equal(await result, true);
  assert.equal(f.calls.length, 1);
});

test('the request has a bounded timeout after verification and is not retried automatically', async () => {
  const f = fixture();
  let requests = 0;
  f.context.fetch = async (url, options) => {
    requests += 1;
    return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => {
      const error = new Error('aborted');
      error.name = 'AbortError';
      reject(error);
    }, { once: true }));
  };
  const result = f.submit();
  await f.flush();
  f.callbacks().callback('verified-token');
  await f.flush();
  await f.advance(24000);
  assert.equal(f.button.disabled, true);
  await f.advance(1000);
  assert.equal(await result, false);
  assert.match(f.status.textContent, /自动保存超时/);
  assert.equal(requests, 1);
  assert.equal(f.widgets.size, 0);
  assert.equal(f.form.children.length, 0);
  assert.equal(f.timers.size, 0);
  assert.equal(f.button.disabled, false);
});
