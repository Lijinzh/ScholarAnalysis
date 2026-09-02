# ScholarAnalysis

一个面向长期维护的论文解析与 GitHub Pages 发布项目。每篇重要论文都有独立目录，原论文、补充材料、视频、数据、分析稿和公开网页资源彼此分区。

## 当前论文投递目录

请把这篇液态金属自适应瞳孔论文的材料拖入：

`papers/2026-Bioinspired-adaptive-pupil-reflex-based-on-liquid-metal-shape-shifters-for-machine-vision/inbox/`

- `01-main-paper/`：论文正文 PDF
- `02-supplementary/`：补充 PDF、附录、说明文档
- `03-videos/`：Movie S1、Movie S2 等原始视频或压缩包
- `04-data/`：数据文件、代码、表格、压缩包
- `05-notes/`：你的问题、截图、想法和其他线索

`inbox/` 默认不会被 Git 提交。待完成版权、隐私、体积和视频编码检查后，适合公开的副本才会进入 `publish/`，供 github.io 页面读取。

## 常用命令

```powershell
pnpm install
pnpm build
pnpm verify
pnpm dev
```

新建下一篇论文：

```powershell
pnpm new-paper -- 2026-Full-paper-title
```

完整规范见 [docs/PROJECT_STANDARD.md](docs/PROJECT_STANDARD.md)，视频要求见 [docs/VIDEO_PLAYBACK.md](docs/VIDEO_PLAYBACK.md)。
