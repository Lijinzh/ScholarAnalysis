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
      `## 论文`,
      `${paperTitle}`,
      ``,
      `- slug: \`${slug}\``,
      `- 页面: ${window.location.href}`,
      ``,
      `## 问题或建议`,
      question,
    ].join('\n');

    const url = new URL(`https://github.com/${owner}/${repo}/issues/new`);
    url.searchParams.set('title', title);
    url.searchParams.set('body', body);
    url.searchParams.set('labels', 'paper-feedback');
    window.open(url, '_blank', 'noopener,noreferrer');
  });
}
