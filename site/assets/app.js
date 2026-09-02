function openPrefilledIssue({ owner, repo, title, body }) {
  const url = new URL(`https://github.com/${owner}/${repo}/issues/new`);
  url.searchParams.set('title', title);
  url.searchParams.set('body', body);
  url.searchParams.set('labels', 'paper-feedback');
  window.open(url, '_blank', 'noopener,noreferrer');
}

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

function quoteMarkdown(value, limit = 900) {
  const text = value.length > limit ? `${value.slice(0, limit)}…` : value;
  return text.split('\n').map((line) => `> ${line}`).join('\n');
}

for (const form of document.querySelectorAll('[data-issue-form]')) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const textarea = form.querySelector('textarea');
    const question = textarea?.value.trim();
    if (!question) {
      textarea?.focus();
      return;
    }

    const owner = form.dataset.owner;
    const repo = form.dataset.repo;
    const slug = form.dataset.paper;
    const paperTitle = form.dataset.title;
    const title = `[Paper: ${slug}] ${question.slice(0, 60)}`;
    const body = [
      '## 论文',
      paperTitle,
      '',
      `- slug: \`${slug}\``,
      `- 页面: ${window.location.href}`,
      '',
      '## 整篇论文的问题或建议',
      question,
    ].join('\n');

    openPrefilledIssue({ owner, repo, title, body });
  });
}

const article = document.querySelector('[data-paragraph-comments]');

if (article) {
  const owner = article.dataset.owner;
  const repo = article.dataset.repo;
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
        ? 'Issue 会同时记录选中句子、完整段落和页面锚点。'
        : '想精确到某一句时，可以先选中文字，再点击段落右侧的 +。';

      const textarea = document.createElement('textarea');
      textarea.className = 'paragraph-comment-textarea';
      textarea.setAttribute('aria-label', `第 ${paragraphNumber} 段的问题或建议`);
      textarea.placeholder = '这段哪里没理解？有什么疑问、补充或反对意见？';
      textarea.required = true;

      const actions = document.createElement('div');
      actions.className = 'paragraph-comment-actions';

      const submit = document.createElement('button');
      submit.type = 'submit';
      submit.className = 'button paragraph-comment-submit';
      submit.textContent = '在 GitHub Issue 中继续';

      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'paragraph-comment-cancel';
      cancel.textContent = '取消';

      actions.append(submit, cancel);
      panel.append(contextLabel, context, hint, textarea, actions);
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

      panel.addEventListener('submit', (event) => {
        event.preventDefault();
        const question = textarea.value.trim();
        if (!question) {
          textarea.focus();
          return;
        }

        const anchorUrl = `${window.location.origin}${window.location.pathname}#${paragraphId}`;
        const issueTitle = `[Paragraph ${paragraphNumber}: ${slug}] ${question.slice(0, 52)}`;
        const body = [
          '## 论文',
          paperTitle,
          '',
          `- slug: \`${slug}\``,
          `- 段落: 第 ${paragraphNumber} 段`,
          `- 精确链接: ${anchorUrl}`,
          '',
          selectedText ? '## 选中的句子' : '## 针对内容',
          quoteMarkdown(quotedText, 500),
          '',
          ...(selectedText ? ['## 所在完整段落', quoteMarkdown(paragraphText), ''] : []),
          '## 问题或建议',
          question,
        ].join('\n');

        openPrefilledIssue({ owner, repo, title: issueTitle, body });
      });
    });
  });
}
