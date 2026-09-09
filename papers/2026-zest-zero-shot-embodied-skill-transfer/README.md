# 2026-zest-zero-shot-embodied-skill-transfer

DOI: 10.1126/scirobotics.aec7695。公开解析；本地图文与界面检查已完成，原始材料按 paper.json 的逐项许可边界处理。

- 正文、23页补充PDF、期刊Data S1及作者开放数据/软件包在忽略的inbox/，原始下载保留。
- 中文分析覆盖零样本边界、三类参考、实机观测、残差PD、自适应RSI、虚拟辅助、PLA/Spot建模、实机指标及复现缺口。
- 三张最终科研图通过GPT-Image CLI 0.2.2、gpt-image-2生成，均先dry-run，逐张检查后转WebP；提示词、无损PNG和日志保存在inbox/06-local-only/generated-source/。residual-control首版IMU引线指向错误，未发布；使用修订v2。
- 从CC BY 4.0的Zenodo 21135719独立来源提取Data_S1_G1.xlsx，未经修改，附署名。下载ZIP与仓储MD5相符、CRC通过；工作簿与期刊Data S1的XLSX哈希一致。G1六动作三项平均误差重算一致，记录在inbox/05-notes/data-audit.json。
- Zenodo 21729371软件包及内置LICENSE为MIT；仅核读，没有构建或运行，也未连接机器人。发布包不含训练流水线。
- 论文列出Movie 1及Movies S1–S8。当前视频包未取得、再分发许可未确认；页面提供说明与官方入口，S8内容待核实。原论文和补充PDF不公开。
- pnpm verify通过：11项测试、23篇论文构建、24个HTML链接与登记媒体检查；git diff --check通过。限定目标文本的凭据扫描未发现命中。
- 内置浏览器检查1280×900和390×844：标题、三张图及图注、来源标识、表格容器滚动、视频入口、段落意见展开/取消与整篇意见输入正常，无页面横向溢出。未向GitHub提交测试意见，此项为此前本地验收记录。

本地入口：http://127.0.0.1:4173/ScholarAnalysis/papers/2026-zest-zero-shot-embodied-skill-transfer/ （pnpm build、pnpm dev）。
