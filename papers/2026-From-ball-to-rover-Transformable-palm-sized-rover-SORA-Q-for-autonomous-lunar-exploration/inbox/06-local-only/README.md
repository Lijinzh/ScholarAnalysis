仅本地保存的生成源、提示词、处理记录、废弃草图和其他不公开材料目录。GPT-Image 无损原图建议放在 `generated-source/` 子目录；本目录内容默认不进入 Git。

## 2026-09-04 GPT-Image 记录

- CLI：`gpt-image 0.2.2`；检查到 0.2.6 可用，但本任务没有修改或更新本机 CLI。
- Provider：`CodexNubot`，来源为 CC-Switch；模型：`gpt-image-2`。
- `01-transform-deploy.txt`、`02-onboard-autonomy.txt`、`03-mission-evidence-limits.txt` 均完成不计费 dry-run，目标画布为 1536×1024。
- 首张正式请求已经提交一次；上游返回 1693×929，CLI 因画布与请求不一致而拒绝写出最终文件，并报告该请求可能已计费、未自动重试。
- 后两张没有发起正式请求。除非用户明确授权，不使用 `--fit-output-size` 重提首张，也不继续其他付费生成。
- 提示词和 JSONL/文本日志位于 Git 忽略的 `generated-source/prompts/` 与 `generated-source/logs/`。
