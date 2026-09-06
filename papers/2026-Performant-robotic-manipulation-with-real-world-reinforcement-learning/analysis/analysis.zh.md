# 以真实世界强化学习实现高性能机器人操作

RL-100 研究的不是“机器人能否偶尔完成一个演示动作”，而是更接近部署的问题：在物体位置、接触动力学和外部干扰变化时，策略能否连续成功，是否足够快，以及训练过程能否在真实硬件上控制风险。作者给出的路线是：先从人类示范取得安全而多模态的动作先验，再用机器人自己产生的轨迹做迭代离线强化学习，最后用少量在线强化学习补掉罕见失败，并把多步扩散控制器蒸馏成一步策略。

这篇论文的强项是实验规模和工程链条完整；阅读时也必须守住两个口径边界。第一，标题式数字 `1000/1000` 是两套部署控制器、不同任务和不同样本量的合计，不是一套固定策略在统一分布下的一千次独立重复。第二，补充 Table S3 已加入 Box Folding，但正文关于数据预算的段落仍沿用了加入该任务之前的七任务总数。

## 为什么模仿学习还不够？

扩散策略擅长从示范中保留多种可行动作模式，但监督目标只要求“像示范”，不直接奖励更快完成、更强恢复或消除尾部失败。遥操作本身还有感知与控制延迟，操作者往往选择保守轨迹；示范数据昂贵，状态—动作覆盖也有限。于是策略会继承人类的速度、偏差和偶发错误，形成论文所说的 **imitation ceiling**。

从零开始在真机上做强化学习又过于危险和低效。RL-100 的折中是把模仿策略当作安全动作流形：探索从已经会做任务的策略附近开始，绝大多数性能增益先在固定数据上完成，最后才进入短暂的在线阶段。

<figure class="analysis-figure">
  <img src="files/figures/rl100-github-overview-apache-2.0.webp" alt="RL-100 官方代码仓库总览图，从统一训练接口依次展示策略能力、模仿学习与离线在线强化学习、真实机器人数据飞轮、一步部署和系统代码栈">
  <figcaption><span class="figure-source source-authorized">已获开放许可材料</span><strong>图 1｜RL-100 从示范到部署的官方仓库总览。</strong> 来源：Lei-Kun/RL-100 的 <code>media/overview.jpg</code>，Apache License 2.0；本站仅转码为 WebP 并缩放，没有改变科学内容。该图是代码仓库的系统总览，不是 Science 论文原图。</figcaption>
</figure>

## 器件在哪里，信号怎样进入策略？

真实实验使用 UR5、xArm 和 Franka Emika Panda，末端执行器包括 LeapHand 灵巧手、Robotiq 2F-85 夹爪和定制的 3D 打印被动工具。Intel RealSense L515 采集 RGB-D；相机先用 Charuco 标定内参，再通过桌面 AprilTag 把相机坐标变换到机器人根坐标。深度图反投影为点云后，系统裁掉桌面外区域，并用最远点采样压缩为 512 或 1024 个三维点。

点云特征与关节、夹爪等本体状态拼接后送入扩散动作策略。高层动作一般以 30 Hz 发出：UR5 经 RTDE 插值到 125 Hz，xArm 插值到 200 Hz，Franka 的底层控制器运行到 1000 Hz。相机读取和机械臂控制都采用异步线程，点云更新可超过 25 Hz。这里的“高频”不是单一网络推理数字，而是相机、策略和底层伺服共同构成的闭环。

八个任务覆盖不同的具身和控制模式：

| 任务 | 主要机器人/末端 | 控制模式 | 核心困难 |
| --- | --- | --- | --- |
| Push-T | UR5 + 被动推杆 | 单步 | 高速纠偏、摩擦变化、3 mm 级槽口余量 |
| Bowling | UR5 + 半圆推具 | 单步 | 释放时机与高速轨迹精度 |
| Pouring | Franka + LeapHand | 单步 | 颗粒/液体动力学与洒落控制 |
| Unscrewing | Franka + LeapHand | 动作块 | 微小姿态判断、旋拧与抓取切换 |
| Soft-towel Folding | xArm + Franka 双臂 | 动作块 | 大变形、双臂接触协同 |
| Juicing Placing/Removal | xArm + Robotiq | 动作块 | 狭窄空间、果实差异、可变形残渣 |
| Box Folding | 双 UR5 | 动作块 | 长时序、折痕对齐和不连续接触 |

单步控制用于需要快速闭环反应的任务；动作块一次预测 8–16 步，适合高精度或双臂协调，能减小抖动，但也可能累积开环误差。

## 三阶段训练到底怎样衔接？

第一阶段是行为克隆。策略输入最近约两帧视觉和本体状态，输出单个动作或动作块。作者主要采用噪声预测形式的扩散模型，并在三维编码器上加入点云重建损失和变分信息瓶颈，防止强化学习微调时视觉表示漂移。

第二阶段是迭代离线强化学习。每轮先在当前数据集上训练 IQL 的价值函数和一个转移模型，再把扩散的 `K` 次去噪视为嵌套在每个环境步内部的子 MDP。环境层只产生一次任务优势，但同一个优势被分配给全部去噪步骤，使 PPO 比率能够逐步更新扩散采样器，而不是只在最终动作处得到稀疏信用。

离线更新并非全部接受。近似 model-Q 的离线策略评估门会比较候选策略与当前行为策略；只有预测提升超过自适应阈值，候选才成为下一次行为策略。然后机器人用改进策略采集新轨迹，合并回数据集，再做一次模仿学习重训。这个“更新—筛选—实机采集—合并—重训”循环既扩大覆盖，也用监督学习重新锚定高密度动作区域。

第三阶段只针对离线阶段剩下的稀有失败做真机在线 PPO。它仍使用相同的裁剪目标，只把离线 IQL 优势换成在线 GAE，因此不会在阶段切换时突然改变优化规则。除 Push-T 使用连续塑形奖励外，其余任务主要由人类在成功时给终止奖励 `+1`，超时或安全提前终止为 `0`；所以系统并没有实现完全自动的奖励判定。

最后，一致性模型同时学习把多步 DDIM 教师压缩为一次前向推理。论文举例称推理延迟可从约 100 ms 降到 10 ms；实际墙钟收益还取决于相机和机器人控制上限，而不是简单等于十倍任务速度。

## 成功率如何从模仿基线提高到 100%？

二维扩散策略的八任务非加权平均成功率为 45.3%，三维 DP3 为 67.8%，迭代离线 RL 提升到 91.8%。增益最大的两个任务也是最容易累积接触误差的任务：Pouring 从 DP3 的 48% 升到 92%，Box Folding 从 48% 升到 96%。短暂在线训练随后把各项已评估成功率推到 100%。

<figure class="analysis-figure">
  <img src="files/figures/success-progression-source-data.webp" alt="八行五列热力表展示 Push-T、保龄、倾倒、毛巾折叠、旋拧、榨汁放置与移除、纸盒折叠在二维扩散策略、DP3、离线强化学习、在线 DDIM 和在线一致性策略下的成功率">
  <figcaption><span class="figure-source source-data">来源数据可视化</span><strong>图 2｜八任务的成功率提升链。</strong> 根据正式论文 Table 1 重绘。灰色格不是失败，而是 Juicing-Removal 的一致性策略因逆运动学姿态不连续和噪声敏感性被作者出于安全原因取消评估。</figcaption>
</figure>

`1000/1000` 的精确构成是：DDIM 在八项任务上合计 `450/450`；CM 在七项任务上合计 `550/550`，其中 Soft-towel Folding 单独占 `250/250`。因此它证明的是“在作者预先定义的这些任务、初始范围、成功判据和控制器选择下没有观察到失败”，不能外推为任意家庭或工厂任务的通用 100% 可靠性，也不能把 1000 次当作同一策略的同分布伯努利试验。

## 快度、泛化和受扰恢复

奖励优化不仅减少失败，还缩短成功轨迹。Soft-towel Folding 从 DP-2D 的 390 步降到 CM 的 312 步，Unscrewing 从 361 步降到 DDIM 的 280 步，Box Folding 从 1266 步降到 CM 的 832 步。Box Folding 的端到端时间从 DP-2D 的 65.1 秒降到 DDIM 的 45.6 秒和 CM 的 41.4 秒。Push-T 在相同时间窗内完成 20 次，超过专家遥操作的 17 次和初学者的 13 次。

零样本变化包括把倾倒材料从坚果换成水、改变推台或保龄表面、加入干扰物、替换毛巾形状，以及给纸盒极端朝向；六项平均为 90%。更大变化经过 1–3 小时微调后平均 86.7%，但新容器倾倒只有 60%，说明几何改变仍是明显瓶颈。人类在折叠、旋拧、Push-T 和纸盒折叠中施加拉扯、反向旋转、推动或敲击，五项平均为 96%。

<figure class="analysis-figure">
  <img src="files/figures/adaptation-robustness-source-data.webp" alt="三组柱状图分别展示六项零样本环境变化、三项一到三小时少样本适应和五项人类物理扰动下的成功率">
  <figcaption><span class="figure-source source-data">来源数据可视化</span><strong>图 3｜零样本、少样本和外力扰动不能混成一个泛化分数。</strong> 根据正式论文 Table 2 重绘。每根柱子的任务定义和试验条件不同，平均值适合概览，不等于统一分布上的总体成功概率。</figcaption>
</figure>

商场演示中，榨汁机器人在新环境里连续约七小时无失败，是很有价值的长期运行证据；但论文没有报告服务杯数、顾客到达分布、人工补料与清洁频率、潜在中断日志或置信区间。它更准确地说明系统能在一次受控公共部署中持续工作，而不是已经完成商业可靠性认证。

## 数据成本并不只是“少量人类示范”

补充 Table S3 显示八项任务共使用 1004 条人工示范、4573 条迭代离线 rollout 和 3223 条在线 rollout，记录时间分别约 15.5、54.6 和 42.5 小时。人工示范确实只占 episode 数的约 11.4%，但机器人自主采集仍需要复位、奖励确认、安全监控和硬件占用；论文自己也把 reset 与 recovery 列为实践瓶颈。

<figure class="analysis-figure">
  <img src="files/figures/data-collection-budget-source-data.webp" alt="八项任务的堆叠柱状图比较人工示范、迭代离线轨迹和在线轨迹数量，右侧列出三阶段的总 episode 与小时数，并标出正文七任务旧统计与补充八任务表不一致">
  <figcaption><span class="figure-source source-data">来源数据可视化</span><strong>图 4｜真实训练预算与版本口径检查。</strong> 根据正式 Supplementary Table S3 重绘。正文仍写“八任务平均 115 条示范、总计 804 条和 12.5 小时”，但这些数字恰好等于排除 Box Folding 的旧七任务合计；含 Box Folding 的正式表为 1004 条、15.5 小时。</figcaption>
</figure>

## 代码、数据与最小复现

[官方代码仓库](https://github.com/Lei-Kun/RL-100) 已以 Apache-2.0 发布，覆盖扩散/流策略、二维/三维观察、单步/动作块、离线与在线训练、数据合并工具和可视化器。仓库同时提供一个约 405 MB 的 [Adroit Door Medium 烟雾测试数据集](https://huggingface.co/datasets/leokk/RL-100-adroit-door-medium)，但其 Hugging Face 元数据为 `license: other`，README 仍称正式数据许可将与公开仓库许可一起最终确定；在许可文字没有同步澄清前，本站不镜像该数据。

最小复现应先避开真实榨汁和双臂折盒：

1. 用 Adroit Door 或 Meta-World 复现行为克隆、IQL critic、去噪步 PPO 比率和 OPE 接受门。
2. 固定视觉编码器与动作维度，比较一次离线更新、迭代数据扩充和直接在线训练，记录每次候选被接受或拒绝的 AM-Q 差值。
3. 分别跑 DDIM 与 CM，确认一致性蒸馏在相同成功率下减少推理时间，而不是只比较理论网络步数。
4. 上真机前检查观察归一化、相机—机器人外参、动作限幅、复位行为和急停；仓库 README 也明确警告不要在这些检查前部署 checkpoint。
5. 真机实验应保存每次试验的初始条件、控制器版本、成功判据、人工奖励、提前终止原因和复位耗时，避免只保留最终成功率。

## 论文没有解决什么？

- **奖励仍依赖人**：除 Push-T 外，成功终止主要由操作者给出；自动视觉奖励、错误分类和延迟尚未系统评估。
- **任务均为封闭技能**：每个任务有固定硬件、工作区和成功判据，论文没有展示一个策略跨八任务切换，也没有验证开放词汇任务组合。
- **“100%”没有给出统计不确定性**：不同格子的样本量从 50 到 250 不等，零失败不等于真实失败率为零。
- **CM 并非无条件可替换 DDIM**：Juicing-Removal 因 IK 姿态跳变和一步策略噪声被取消 CM 评估，说明部署加速会与动作表示及低层控制耦合。
- **长期运行证据仍有限**：七小时商场演示重要，但缺少维护、补料、清洁、吞吐和故障日志，不能直接换算成工业 MTBF。
- **数据统计存在版本残留**：正文的七任务旧合计与补充表的八任务数据不一致，复现者应以逐任务 Table S3 为准。

## 当前材料与版权状态

Science 页面显示本机通过 **National University of Defense Technology** 获得 `Full access`，但同时没有 Creative Commons 许可，页脚为 AAAS `All rights reserved`。这只能证明读取权限，不能证明 OA 或允许再分发。正式 Supplementary Materials PDF 已保存在本地 Git 忽略的 `inbox/`；Movies S1-S18 的 547.06 MiB ZIP 在首次点击无下载后，已按规则刷新论文页并从原按钮重试一次，仍未产生下载事件，因此没有继续尝试。

为了让视频能够在本站直接播放，同时不越过 Science ZIP 的再分发边界，本页使用作者 [RL-100 项目网站](https://lei-kun.github.io/RL-100/) 已经公开的远程 MP4 和作者 RL-100 官方 YouTube 嵌入地址，为 Movies S1-S18 的主题逐项建立播放器。视频数据仍由作者站点或 YouTube 提供，本站不保存这些受限视频的副本。作者项目页把部分正式复合影片拆成多个片段或重新剪辑，因此播放器图注明确区分“作者官方公开版本或主题覆盖片段”和“Science ZIP 原文件”，不把二者伪装成逐帧相同的材料。

arXiv v4 采用 non-exclusive distribution license，同样不足以把 PDF 放进 `publish/`。公开页面提供原创中文分析、依据公开数值重绘的图、Apache-2.0 官方仓库总览图的转码副本，以及不落地复制的作者官方视频播放器。

官方入口：

- [Science 正式论文](https://www.science.org/doi/10.1126/scirobotics.aed6267)
- [Science Supplementary Materials PDF](https://www.science.org/doi/suppl/10.1126/scirobotics.aed6267/suppl_file/scirobotics.aed6267_sm.pdf)
- [Science Movies S1-S18 ZIP](https://www.science.org/doi/suppl/10.1126/scirobotics.aed6267/suppl_file/scirobotics.aed6267_movies_s1_to_s18.zip)
- [arXiv 2510.14830v4](https://arxiv.org/abs/2510.14830)
- [RL-100 项目网站](https://lei-kun.github.io/RL-100/)
- [Apache-2.0 官方代码仓库](https://github.com/Lei-Kun/RL-100)
- [Hugging Face 烟雾测试数据集](https://huggingface.co/datasets/leokk/RL-100-adroit-door-medium)
