# ScholarAnalysis Feedback Worker

这个 Worker 接收论文页的结构化问题，完成来源、字段、Turnstile 和频率校验，然后使用服务端密钥创建带 `paper-feedback` 标签的 GitHub Issue。网页不会保存 GitHub Token，也不会把用户跳转到 Issue 创建页。

## 一次性部署

1. 登录 Cloudflare：`npx wrangler login`。
2. 在 Cloudflare Turnstile 创建一个允许 `lijinzh.github.io` 的 Managed widget，记录公开 sitekey 和保密 secret key。
3. 为 `Lijinzh/ScholarAnalysis` 创建只允许该仓库、只具有 Issues Read and write 权限的 fine-grained GitHub Token。
4. 写入 Worker secrets，输入值时不要放在命令行参数中：

   ```powershell
   npx wrangler secret put GITHUB_TOKEN --config services/feedback-worker/wrangler.jsonc
   npx wrangler secret put TURNSTILE_SECRET --config services/feedback-worker/wrangler.jsonc
   ```

5. 部署并取得 `https://<worker>.workers.dev/api/feedback` 地址：

   ```powershell
   npx wrangler deploy --config services/feedback-worker/wrangler.jsonc
   ```

6. 把公开配置写入 GitHub Actions repository variables：

   ```powershell
   gh variable set FEEDBACK_API_URL --repo Lijinzh/ScholarAnalysis --body "https://<worker>.workers.dev/api/feedback"
   gh variable set TURNSTILE_SITE_KEY --repo Lijinzh/ScholarAnalysis --body "<public-sitekey>"
   ```

这些变量是公开构建配置；GitHub Token 和 Turnstile secret 只能保存在 Worker secrets 中。
