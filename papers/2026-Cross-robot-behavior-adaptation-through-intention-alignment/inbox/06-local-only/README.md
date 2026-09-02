# GPT Image 2 本地生成记录

- 2026-09-02：`intention-vector-mapping.txt` 与 `generate-encode-rank.txt` 均完成 dry-run，provider 为 CodexSpark，模型为 `gpt-image-2`。
- `intention-vector-mapping.txt` 的正式请求最终返回 `The read operation timed out`，没有生成 PNG；该请求可能已经计费，未自动重试。
- `generate-encode-rank.txt` 只完成 dry-run，没有发起正式付费请求。
- 原始提示词保存在 Git 忽略的 `generated-source/prompts/`。获得用户新的明确授权并成功生成、检查原图之前，不向 `publish/figures/` 写入替代图片。
