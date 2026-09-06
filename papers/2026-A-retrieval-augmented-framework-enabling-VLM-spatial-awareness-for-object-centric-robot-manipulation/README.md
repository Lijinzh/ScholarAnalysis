# 2026-A-retrieval-augmented-framework-enabling-VLM-spatial-awareness-for-object-centric-robot-manipulation

## 本地材料

- `inbox/01-main-paper/scirobotics.aea2092.pdf`：通过用户学校机构权限下载的正式论文，仅本地保存。
- `inbox/02-supplementary/scirobotics.aea2092_sm.pdf`：补充方法、Figs. S1-S17、Tables S1-S4 与视频图例，仅本地保存。
- `inbox/03-videos/scirobotics.aea2092_movies_s1_and_s2.zip`：Science 补充视频压缩包，仅本地保存。
- `inbox/03-videos/science-supplementary/aea2092_movie_s1.mp4`：Movie S1，H.264/AAC，1920×1080，约 5 分 44 秒，仅本地保存。
- `inbox/03-videos/science-supplementary/aea2092_movie_s2.mp4`：Movie S2，H.264/AAC，1920×1080，约 4 分 24 秒，仅本地保存。
- `inbox/05-notes/rights-audit.md`：正文、补充材料、视频、Zenodo 和 CUHK 项目页的逐项权利记录。
- `inbox/06-local-only/generated-source/`：GPT-Image 提示词、状态记录、后续无损生成源，以及来源数据图脚本。

## 公开边界

Science 页面采用默认许可并提供 Request permissions；学校机构访问只证明可以阅读和下载，不能证明允许公开再分发。因此正文、论文原图、补充 PDF 和视频均不进入 `publish/`。Zenodo `10.5281/zenodo.19325674` 的软件归档采用 CC BY 4.0，但不含 Movie S1/S2。

当前公开素材包括根据论文报告值重新绘制的 `publish/figures/ram-success-failure-data.webp`，以及经人工核验并从本地无损源优化得到的 `publish/figures/object-centric-grounding-gpt-image-2.webp`。后者使用项目指定的 GPT-Image CLI 与 `gpt-image-2` 生成，网页明确标注为生成式科研示意图，不是论文原图或实验照片。

四张提示词均已完成 dry-run。RAM 总览图的初始请求远端断开，用户授权的一次重试返回 HTTP 503；约束到轨迹图也在提交后远端断开，这些请求都可能已经计费，未自动重试。扩展与失败模式图未提交正式请求。完整状态记录见 `inbox/06-local-only/generated-source/logs/2026-09-04-image-generation-status.md`。
