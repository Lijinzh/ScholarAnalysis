仅本地保存的生成源、提示词、处理记录、废弃草图和其他不公开材料目录。GPT-Image 无损原图放在 `generated-source/` 子目录；本目录内容默认不进入 Git。

- 2026-09-04：四个首轮提示词完成 dry-run，provider 为 CodexNubot，模型为 `gpt-image-2`。
- `01-module-to-collective.png`、`03-obstacle-flow.png`、`04-local-controller.png` 各成功提交并返回一次；只有第一张通过内容审查并生成公开 WebP。
- `02-chain-mechanics` 请求返回了非请求尺寸，CLI 未写入文件并提示可能计费；未自动重试。
- 两个 v2 重绘提示词均先完成 dry-run，但真实请求仍返回非请求尺寸，CLI 未写入文件并提示可能计费；未继续提交。
- `03-obstacle-flow.png` 的模块边界和连接方式不够可信，`04-local-controller.png` 错画为轮式圆形模块，均只保留在本地，不进入 `publish/`。
