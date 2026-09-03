# 论文分析项目规范

## 1. 一篇论文一个目录

每篇重要论文使用“年份 + 论文题目”的稳定目录名，例如 `2026-Bioinspired-adaptive-pupil-reflex-based-on-liquid-metal-shape-shifters-for-machine-vision`。作者姓可以放在年份后，但目录名必须包含足以辨认的论文题目。目录内同时保存元数据、分析稿、原始材料投递箱和经审核的网页公开资源。

```text
papers/<slug>/
├─ paper.json                 # 标题、DOI、作者、状态、下载项、视频项
├─ README.md                  # 本篇材料投递说明
├─ analysis/
│  └─ analysis.zh.md         # 中文分析主稿，网页由它生成
├─ inbox/                     # 本地原始材料，不进 Git
│  ├─ 01-main-paper/
│  ├─ 02-supplementary/
│  ├─ 03-videos/
│  ├─ 04-data/
│  └─ 05-notes/
└─ publish/                   # 明确允许公开后才进入此处
   ├─ documents/
   ├─ media/
   ├─ data/
   └─ figures/
```

## 2. 内容写作标准

每篇中文分析至少包含：

1. 一句话结论与研究问题。
2. 系统结构图和信号/能量流。
3. 核心材料、器件、制造工艺和关键参数。
4. 论文真正证明了什么，以及没有证明什么。
5. 关键图表逐图解释。
6. 可复现性评估：设备、材料、安全、成本、难点。
7. 工程替代路线与最小可行原型。
8. 局限、风险、待核实问题和补充材料依赖。
9. 用户提问的逐条回答。
10. 原文、补充材料、数据和视频入口。

事实、作者结论和我们的工程推断必须明确区分。技术示意图优先使用可校核 SVG；生成式图片用于概念解释时必须标注“示意图，不是论文原图”。

## 3. 原始材料与公开材料分离

- `inbox/` 是用户投递区，默认被 `.gitignore` 排除。
- `publish/` 是网页公开区，进入前检查授权、隐私、文件体积和内容完整性。
- 受版权限制的 PDF 优先链接期刊官方页面；除非确认拥有再分发权，不把机构权限下载的全文直接提交到公开仓库。
- 网站构建只读取 `analysis/`、`paper.json` 和 `publish/`，绝不会自动发布 `inbox/`。

## 4. 视频标准

- 网页使用原生 `<video controls playsinline preload="metadata">` 播放。
- 首选 MP4 容器、H.264 视频、AAC 音频、`yuv420p` 像素格式，并启用 fast-start。
- 单文件必须低于 GitHub 的 100 MiB 推送硬限制；本项目把 95 MiB 设为失败线，预留余量。
- 不使用 Git LFS 作为 GitHub Pages 视频源，因为页面可能拿到 LFS 指针而不是可播放媒体。
- 发布后必须在真实 github.io 页面验证开始播放、拖动进度、音量、全屏和移动端内嵌播放。

## 5. GitHub Issue 联动

每篇论文页提供整篇和段落级提问框。网页把论文 slug、页面地址、段落锚点、选中句子和问题内容提交给独立的反馈 API；API 在服务端使用受保护的 GitHub 凭据自动创建带 `paper-feedback` 标签的 Issue。提交成功后用户留在原页面，不需要跳转到 GitHub，也不需要再次点击 Create。

GitHub Pages 是静态站点，禁止把任何 Issue 写入 Token、GitHub App 私钥或 Turnstile secret 放入前端代码、构建产物或仓库变量。服务端密钥必须保存为 Worker secret；公开表单必须执行服务端 Turnstile 校验、来源校验、字段长度限制和速率限制。

处理流程：

1. 阅读带有 `paper-feedback` 标签的 Issue。
2. 在对应论文目录更新 `analysis.zh.md`、图解或媒体说明。
3. 构建并验证本地网页。
4. 提交、推送并验证 GitHub Pages。
5. 在 Issue 中留下更新链接后关闭 Issue。

用户需要集中处理问题时，可以直接在 Codex/ChatGPT 任务中要求“读取 ScholarAnalysis 的 `paper-feedback` Issues”。处理代理通过 GitHub API/CLI 读取上下文、更新正文、发布网页并关闭 Issue；网页提交阶段不负责跳转到 AI 软件或自动触发模型运行。

## 6. 发布门槛

发布前运行 `pnpm verify`，并完成：

- 元数据和本地链接检查；
- 下载文件是否存在；
- 视频编码、体积和元数据检查；
- 桌面与移动端页面检查；
- 视频实际点击播放检查；
- GitHub Pages 工作流成功；
- github.io 实际页面和远端提交一致。
