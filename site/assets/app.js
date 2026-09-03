const feedbackEndpoint = document.body.dataset.feedbackEndpoint?.trim() || '';
const turnstileSiteKey = document.body.dataset.turnstileSiteKey?.trim() || '';

function normalizedText(value = '') {
  return value.replace(/\s+/g, ' ').trim();
}

function shortHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function createSubmissionId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `feedback-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function setFeedbackStatus(status, message, state = '') {
  if (!status) return;
  status.textContent = message;
  if (state) status.dataset.state = state;
  else delete status.dataset.state;
}

async function waitForTurnstile() {
  if (!turnstileSiteKey) return undefined;
  const startedAt = Date.now();
  while (!globalThis.turnstile) {
    if (Date.now() - startedAt > 12000) throw new Error('安全验证组件加载失败，请稍后重试。');
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return globalThis.turnstile;
}

async function getTurnstileProof(form) {
  const turnstile = await waitForTurnstile();
  if (!turnstile) return { token: '', cleanup() {} };

  const container = document.createElement('div');
  container.className = 'feedback-turnstile';
  form.append(container);

  let widgetId;
  let timer;
  const token = await new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(new Error('安全验证超时，请重试。')), 30000);
    widgetId = turnstile.render(container, {
      sitekey: turnstileSiteKey,
      action: 'paper-feedback',
      execution: 'execute',
      appearance: 'interaction-only',
      callback(value) {
        clearTimeout(timer);
        resolve(value);
      },
      'error-callback'() {
        clearTimeout(timer);
        reject(new Error('安全验证失败，请重试。'));
      },
      'expired-callback'() {
        clearTimeout(timer);
        reject(new Error('安全验证已过期，请重新提交。'));
      },
    });
    turnstile.execute(widgetId);
  });

  return {
    token,
    cleanup() {
      clearTimeout(timer);
      if (widgetId !== undefined) turnstile.remove(widgetId);
      else container.remove();
    },
  };
}

async function submitFeedback({ form, button, status, payload }) {
  if (!feedbackEndpoint) {
    setFeedbackStatus(status, '自动提交服务尚未完成线上配置，本次内容没有保存。', 'error');
    return false;
  }

  const honeypot = form.querySelector('[name="website"]');
  if (honeypot?.value) {
    setFeedbackStatus(status, '问题已保存。', 'success');
    return true;
  }

  const originalLabel = button.textContent;
  button.disabled = true;
  button.textContent = '正在自动保存…';
  setFeedbackStatus(status, '正在验证并写入 GitHub Issue…');

  let proof = { token: '', cleanup() {} };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    proof = await getTurnstileProof(form);
    const response = await fetch(feedbackEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        turnstileToken: proof.token,
        clientSubmissionId: createSubmissionId(),
      }),
      signal: controller.signal,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || '自动保存失败，请稍后重试。');

    const issueText = result.number ? ` GitHub Issue #${result.number}` : ' GitHub Issue';
    setFeedbackStatus(status, `已自动保存为${issueText}，无需离开当前页面。`, 'success');
    return true;
  } catch (error) {
    const message = error.name === 'AbortError'
      ? '自动保存超时，当前页面没有跳转。请稍后重试。'
      : error.message;
    setFeedbackStatus(status, message, 'error');
    return false;
  } finally {
    clearTimeout(timeout);
    proof.cleanup();
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

for (const form of document.querySelectorAll('[data-issue-form]')) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const textarea = form.querySelector('textarea');
    const question = textarea?.value.trim();
    if (!question) {
      textarea?.focus();
      return;
    }

    const saved = await submitFeedback({
      form,
      button: form.querySelector('button[type="submit"]'),
      status: form.querySelector('.feedback-status'),
      payload: {
        kind: 'paper',
        slug: form.dataset.paper,
        paperTitle: form.dataset.title,
        pageUrl: window.location.href,
        question,
      },
    });
    if (saved) textarea.value = '';
  });
}

const article = document.querySelector('[data-paragraph-comments]');

if (article) {
  const slug = article.dataset.paper;
  const paperTitle = article.dataset.title;
  const paragraphs = [...article.querySelectorAll(':scope > p, :scope > blockquote > p')]
    .filter((paragraph) => !paragraph.querySelector('img') && normalizedText(paragraph.textContent).length >= 8);
  let activePanel;

  paragraphs.forEach((paragraph, index) => {
    const paragraphText = normalizedText(paragraph.textContent);
    const paragraphNumber = index + 1;
    const paragraphId = `paragraph-${String(paragraphNumber).padStart(2, '0')}-${shortHash(paragraphText)}`;
    paragraph.id = paragraphId;
    paragraph.classList.add('commentable-block');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'paragraph-comment-trigger';
    trigger.setAttribute('aria-label', `评论第 ${paragraphNumber} 段`);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.title = '评论这一段；可先选中具体句子';
    trigger.textContent = '+';
    paragraph.append(trigger);

    trigger.addEventListener('click', () => {
      if (activePanel?.dataset.forParagraph === paragraphId) {
        activePanel.remove();
        activePanel = undefined;
        trigger.setAttribute('aria-expanded', 'false');
        return;
      }

      if (activePanel) {
        const previousTrigger = document.querySelector(`[aria-controls="${activePanel.id}"]`);
        previousTrigger?.setAttribute('aria-expanded', 'false');
        activePanel.remove();
      }

      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : undefined;
      const selectedText = range && paragraph.contains(range.commonAncestorContainer)
        ? normalizedText(selection.toString())
        : '';
      const quotedText = selectedText || paragraphText;

      const panel = document.createElement('form');
      panel.className = 'paragraph-comment-form';
      panel.id = `comment-form-${paragraphId}`;
      panel.dataset.forParagraph = paragraphId;

      const contextLabel = document.createElement('div');
      contextLabel.className = 'paragraph-comment-label';
      contextLabel.textContent = selectedText
        ? `针对选中的句子 · 第 ${paragraphNumber} 段`
        : `针对第 ${paragraphNumber} 段`;

      const context = document.createElement('blockquote');
      context.className = 'paragraph-comment-context';
      context.textContent = quotedText;

      const hint = document.createElement('p');
      hint.className = 'paragraph-comment-hint';
      hint.textContent = selectedText
        ? '后台会同时记录选中句子、完整段落和页面锚点。'
        : '想精确到某一句时，可以先选中文字，再点击段落右侧的 +。';

      const textarea = document.createElement('textarea');
      textarea.className = 'paragraph-comment-textarea';
      textarea.setAttribute('aria-label', `第 ${paragraphNumber} 段的问题或建议`);
      textarea.placeholder = '这段哪里没理解？有什么疑问、补充或反对意见？';
      textarea.required = true;

      const honeypot = document.createElement('input');
      honeypot.type = 'text';
      honeypot.name = 'website';
      honeypot.tabIndex = -1;
      honeypot.autocomplete = 'off';
      honeypot.className = 'feedback-honeypot';
      honeypot.setAttribute('aria-hidden', 'true');

      const actions = document.createElement('div');
      actions.className = 'paragraph-comment-actions';

      const submit = document.createElement('button');
      submit.type = 'submit';
      submit.className = 'button paragraph-comment-submit';
      submit.textContent = '自动保存问题';

      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'paragraph-comment-cancel';
      cancel.textContent = '取消';

      const status = document.createElement('div');
      status.className = 'feedback-status';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');

      actions.append(submit, cancel, status);
      panel.append(contextLabel, context, hint, textarea, honeypot, actions);
      paragraph.insertAdjacentElement('afterend', panel);
      activePanel = panel;
      trigger.setAttribute('aria-expanded', 'true');
      trigger.setAttribute('aria-controls', panel.id);
      textarea.focus();

      cancel.addEventListener('click', () => {
        panel.remove();
        activePanel = undefined;
        trigger.setAttribute('aria-expanded', 'false');
        trigger.focus();
      });

      panel.addEventListener('submit', async (event) => {
        event.preventDefault();
        const question = textarea.value.trim();
        if (!question) {
          textarea.focus();
          return;
        }

        const anchorUrl = `${window.location.origin}${window.location.pathname}#${paragraphId}`;
        const saved = await submitFeedback({
          form: panel,
          button: submit,
          status,
          payload: {
            kind: 'paragraph',
            slug,
            paperTitle,
            pageUrl: anchorUrl,
            paragraphNumber,
            paragraphId,
            selectedText,
            quotedText,
            paragraphText,
            question,
          },
        });
        if (saved) textarea.value = '';
      });
    });
  });
}
