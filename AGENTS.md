# ScholarAnalysis 项目规则

## 论文与补充材料的公开判定

1. 下载权限与再分发权限必须分开判断。浏览器能下载、页面显示 `Full access`、通过学校/机构代理访问、登录订阅账号后可读，均不能单独证明论文是 OA。
2. 只有当期刊、作者存档或可信仓储明确标注开放获取，并给出允许再分发的许可（例如 CC BY、CC BY-SA、CC BY-NC、CC0）时，才可把论文正文、补充 PDF、视频或数据副本放入 `publish/`。必须记录许可名称、来源 URL 和必要署名，并遵守非商业、相同方式共享等附加条件。
3. 如果材料只能通过机构权限、个人订阅或登录后取得，或者许可不明确，则原文件只能保存在 Git 忽略的 `inbox/`。公开网页仅提供期刊官方入口、DOI、原创分析、原创图解，以及被单独确认可再分发的材料。
4. “免费阅读”或“无需登录即可下载”不自动等于允许再分发；若页面仍使用出版社默认版权、提供 `Request permissions`，或没有明确开放许可，按受限材料处理。
5. 同一篇论文的正文、补充材料、代码和数据可能使用不同许可，必须逐项判断。公开代码仓储或数据仓储的材料只有在其独立许可允许时才能进入 `publish/`。
6. OA 许可可能排除第三方图片、地图、商标或另行署名的素材；这些排除项不得随正文一起再分发。
7. 每篇论文的 `paper.json` 中应通过 `status` 与 `rightsNote` 写明当前判定、证据和公开边界。证据不足时保守处理并标注待核实，不得猜测许可。

## Science.org 临时下载限制

1. 如果 Science.org 论文页已打开较长时间，随后出现下载无响应、临时拒绝或类似权限不足的表现，先刷新当前论文页并从页面上的原下载按钮重新尝试一次。
2. 这种临时限制可能来自站点的会话或反自动化判断，不能直接据此判定用户没有机构权限，也不能据此改变 OA 或再分发许可结论。
3. 刷新后仍失败时，记录具体缺失文件并保留官方入口，不循环重试，也不使用绕过登录、付费墙或安全检查的方式下载。

## 论文页面的图片与视频

1. 论文分析页需要新增概念图、场景图或视觉解释图时，最终网页图片必须通过项目指定的 GPT Image CLI、使用 GPT Image 2 生成；不得用手工绘制的 SVG 代替最终视觉素材。
2. GPT Image 2 生成图必须明确标注为“生成式科研示意图，不是论文原图”，不得伪装成实验照片、论文图表或作者提供的结果。
3. 使用 GPT Image CLI 前必须先 dry-run。正式请求发生超时后不得自动重试，因为请求可能已经计费；应记录状态并等待用户决定是否再次生成。
4. 论文存在补充视频时，对应网页必须提供视频区域。已经确认允许公开再分发的视频应转为网页兼容格式、放入 `publish/media/`、登记到 `paper.json` 并使用 HTML5 播放器实际验证。
5. 机构权限或许可不明确的视频仍受“论文与补充材料的公开判定”约束，不得仅为满足播放器要求而复制到公开 `publish/`。需要在线播放时，必须先取得该视频的独立公开许可或用户对权利来源的明确确认；确认前网页提供官方入口并保留本地 `inbox/` 副本。
6. 论文原图不是一律禁用。若单张图片明确包含在允许再分发的开放许可中、作者或其他权利人已授权，或者用户明确确认自己具备该图片的授权来源，则可优先使用原图；必须在 `paper.json` 或本地权利记录中写明图号、许可或授权来源、来源 URL、必要署名和任何第三方素材排除项。仅表达“可以用”“没关系”而没有可核验权利来源时，不足以把受限论文原图放入 `publish/`。

## 论文解析必须图文并茂

1. 以后新增或重做的每篇论文解析页都必须采用图文并茂的方式组织，不得只发布连续大段文字。图片必须参与解释论文的关键技术链，而不是仅作首页装饰。
2. 每篇完整解析原则上至少覆盖以下视觉类别中的三类，并根据论文内容增加：硬件或传感器安装位置、物理工作原理、信号/波形/量程、数据处理流程、算法架构、控制闭环、实验场景、结果对比和已知失败模式。
3. 对核心创新链，应让读者能够沿着“器件在哪里 → 信号如何产生 → 噪声或误差如何处理 → 算法如何计算 → 系统如何输出动作或结果”的顺序阅读对应图片和正文。不得把所有图堆在页面开头或结尾而与解释脱节。
4. 每张图必须紧邻相关段落，并提供清楚的中文图注、可访问的 `alt` 文本，以及“论文原图 / 已获授权材料 / GPT-Image 生成式科研示意图 / 来源数据可视化”等来源类型标识。GPT-Image 图必须明确说明不是论文原图或实验照片。
5. 当论文原图或补充材料没有明确再分发许可时，不得复制到公开网页。应使用 GPT Image CLI 生成原创解释图，或者对允许公开的数据制作明确标注的统计图；不得以截图、临摹或重新描边的方式绕过版权边界。
6. 当论文原图已经逐图确认可再分发时，应优先保留原图的科学信息，不为了形式统一强制改成生成图；图注必须标注为“论文原图”或“已获授权材料”，给出论文图号、来源和许可/授权依据。若同一张复合图包含许可排除的第三方内容，只能使用明确获准的部分，并说明裁切范围。
7. 网页发布前必须实际检查每张图片已经生成、路径有效、清晰可读、没有错乱文字、没有遮挡正文，并在桌面和移动端确认尺寸、裁切、加载和图注布局。图片缺失、仅有占位符或图片与正文无关时，不得把页面标记为完成。
8. 对包含视频的论文，视频应与静态解释图互补：静态图负责解释结构、信号和算法，视频负责展示动态实验。不能因为已有视频就省略必要的安装图、原理图、波形图或算法图。

## 网页科研绘图规则

1. ScholarAnalysis 论文解析页需要新增或重绘科研概念图、原理图、结构图、流程图、封面图或解释性插图时，必须使用项目已安装的 `cc-switch-gpt-image-2` / GPT-Image CLI 工具生成，不得直接用 SVG、Canvas、手写矢量路径、程序化绘图或堆叠方框的方式代替最终成图。
2. 生成前必须运行 GPT-Image CLI 的 `--dry-run`，确认当前 CC-Switch provider、模型和输出路径可用；真实生成默认使用 `gpt-image-2`，提示词和输出路径应保存为可审计的本地输入。
3. GPT-Image 请求可能计费。真实请求超时且没有输出文件时，不得自动重试；必须先报告该次结果，只有获得用户明确授权后才能再次发起可能重复计费的请求。
4. 生成后必须逐张检查实际图像，并在网页中明确标注为 GPT-Image 生成的原创科研概念图，不得冒充论文原图或实验照片。
5. GPT-Image 生成的无损原图应保存在每篇论文 Git 忽略的 `inbox/06-local-only/generated-source/`，网页只发布经过尺寸和体积优化的 WebP/AVIF 副本到 `publish/figures/`；不得为了减小体积覆盖唯一的生成原图。
6. 图内应优先使用清晰的器件造型、空间关系、编号和箭头，避免让模型生成大段中文或密集小字；详细中文解释放在网页正文和图注中，防止文字错乱、图形交错或阅读层级不清。
7. 只有来源数据的统计曲线、坐标图、表格可视化，以及网页 UI 图标和装饰元素可以用代码生成；这类内容不得伪装成 GPT-Image 插图，也不得替代需要真实感科研图解的主体视觉。
8. GPT-Image 生成异常必须区分两类记录：请求/代理/超时/下载等传输故障，以及请求成功但器件数量、空间关系、物理量或算法含义错误的内容保真问题。记录应包含可脱敏复现命令、CLI 版本、状态事件、耗时、是否已经提交及是否可能计费，但不得写入 API key、Authorization header 或其他凭据。
9. 当前 Windows 长请求远端断开问题及修复验收项见 `docs/GPT_IMAGE_CLI_REMOTE_DISCONNECT_HANDOFF.md`。后续 Codex 修复该问题时必须保留“已提交后不自动重试”、Windows 系统代理一致性、长响应 heartbeat、损坏响应校验和原子输出等安全性质。

## adz9609 补充视频公开规则

1. 对论文 `10.1126/scirobotics.adz9609`，用户已明确确认 Supplementary Movie S1 与 Movie S2 允许公开分发。
2. 这两段视频必须从用户下载的 `scirobotics.adz9609_movies_s1_and_s2.zip` 中解压，放入该论文目录的 `publish/media/`，并在对应网页提供 HTML5 在线播放和原视频下载。
3. `paper.json` 的 `videos`、`status` 与 `rightsNote` 必须同步记录该授权边界：视频可以公开，论文正文、补充 PDF、Data S1 和 ICU-30201 数据手册仍分别按各自证据判断，不因视频授权而自动变为可公开材料。

## 稳定项目架构

1. 每篇论文必须使用一个稳定目录，名称采用 `年份-可辨识的英文论文题目`，并保证目录名与 `paper.json.slug` 完全一致。不要用日期流水号、仅作者名或无法辨识论文的缩写作为目录名。
2. 新论文统一使用 `pnpm new-paper <slug>` 从 `templates/paper/` 创建，不手工复制旧论文目录。标准结构如下：

   ```text
   papers/<slug>/
   ├─ paper.json
   ├─ README.md
   ├─ analysis/
   │  └─ analysis.zh.md
   ├─ inbox/                    # Git 忽略，本地原始材料和生成源
   │  ├─ 01-main-paper/
   │  ├─ 02-supplementary/
   │  ├─ 03-videos/
   │  ├─ 04-data/
   │  ├─ 05-notes/
   │  └─ 06-local-only/
   │     └─ generated-source/   # GPT-Image 无损原图、提示词和生成记录
   └─ publish/                  # 会复制到 GitHub Pages，进入前必须审核
      ├─ documents/
      ├─ media/
      ├─ data/
      └─ figures/
   ```
3. `dist/` 是 `tools/build-site.mjs` 生成的临时产物，不直接编辑、不提交。公共页面只读取 `paper.json`、`analysis/`、`publish/` 和 `site/assets/`；`inbox/` 永远不得被构建器复制。
4. `paper.json` 是单篇论文的发布清单：
   - `cardImage`、`cardImageAlt`、`cardImageCaption` 管理论文汇总卡片；
   - `downloads` 只登记 `publish/` 中允许公开的文件；
   - `videos` 只登记允许本站托管播放的 MP4，可配置 `poster`、`caption` 和 `download`；
   - `restrictedVideos` 用于许可不明确的视频，只展示内容说明、科研示意海报和期刊官方入口；
   - `status` 与 `rightsNote` 必须与上述清单同步，不能出现“文字说受限、文件却已进入 publish”或相反的状态。
5. 共用功能必须在 `tools/build-site.mjs`、`site/assets/`、`templates/paper/` 或服务端统一实现。不得为某一篇论文复制一套私有页面脚本，否则后续反馈、移动端和安全修复无法自动覆盖全部论文。

## 新论文标准工作流

1. 运行 `pnpm new-paper <slug>` 创建目录，把原论文、补充材料、视频、数据和笔记分别放入 `inbox/`。
2. 逐文件完成许可判断，在 `paper.json` 写明证据和边界；未确认前不把原文件移入 `publish/`。
3. 编写 `analysis/analysis.zh.md`，按“研究问题 → 器件/系统 → 信号与算法 → 输出与反馈 → 实验结果 → 局限与复现”组织，并把用户问答直接整合到相关正文段落。
4. 需要科研概念图时先执行 GPT-Image CLI dry-run，再生成无损源到 `inbox/06-local-only/generated-source/`，人工检查后把优化的 WebP/AVIF 发布副本放入 `publish/figures/`。
5. 获准公开视频时，转换或无损重封装为 H.264/AAC MP4、启用 fast-start，放入 `publish/media/` 并登记到 `paper.json.videos`；未获准时使用 `restrictedVideos`。
6. 运行 `pnpm verify`，确认测试、构建、链接、媒体存在性、编码和 95 MiB 限制全部通过后才允许提交。

## 段落意见与 GitHub Issue 稳定架构

1. 所有论文页面都由同一构建模板自动获得两种入口：每个自然段右侧的 `+`，以及页面末尾的整篇论文意见框。提交必须留在原页面，并原地显示创建的 Issue 编号。
2. GitHub Pages 前端只读取公开构建变量 `FEEDBACK_API_URL` 和 `TURNSTILE_SITE_KEY`。GitHub 写入凭据与 Turnstile secret 只能保存为 Cloudflare Worker secrets：`GITHUB_TOKEN`、`TURNSTILE_SECRET`。
3. 稳定服务端为 `services/feedback-worker/`。`POST /api/feedback` 必须保留以下安全性质：
   - 只接受受信任 Origin 和页面 hostname；
   - 服务端验证 Turnstile `success`、`action=paper-feedback`、生产 hostname 和一次性 token；
   - 限制 32 KiB 请求体、字段长度、token 长度、10 秒验证超时和每 IP 每分钟 6 次；
   - GitHub PAT 仅授权 `Lijinzh/ScholarAnalysis` 的 Issues read/write，不授予代码、工作流或仓库管理权限；
   - Issue 包含论文 slug、页面链接、段落编号、锚点、选句/段落、问题正文和 `paper-feedback` 标签。
4. 修改反馈链路时必须运行 `node --test tests/feedback-worker.test.mjs`，覆盖正确创建、错误来源、错误 action/hostname、缺失或重复 token、超限、GitHub 失败和限流。不得为了本地调试在生产配置中开启 `ALLOW_UNVERIFIED`。
5. 线上验收至少对一篇新增/修改论文分别提交一条段落意见和一条整篇意见，确认 URL 不变、Issue 上下文正确、标签正确；测试 Issue 添加验收说明后关闭。所有论文共享模板，但新增特殊页面结构时仍需单独回归段落按钮。

## 提交、发布与线上验收

1. 提交前先检查 `git status --short` 和完整差异。并发出现的未知改动默认属于用户或其他任务，不覆盖、不回退；先判断是否属于本次发布以及是否满足版权边界。
2. 发布门槛至少包括：
   - `pnpm verify`；
   - Worker 修改时执行 Wrangler dry-run；
   - `git diff --check`；
   - PAT、API key、Bearer token 和 `.dev.vars` 泄漏扫描；
   - 桌面端和 390×844 移动端实际页面检查；
   - 每张公开图片的清晰度、图注、alt、来源类型和正文邻接关系检查；
   - 每段公开视频实际点击播放，确认 `readyState`、时长和时间轴前进；
   - 页面控制台没有站点自身的未处理错误。
3. 提交到 `main` 后正常推送，禁止强推。等待 GitHub Pages 工作流成功，再核对本地 HEAD、GitHub `main`、Pages 工作流 `headSha` 三者完全一致。
4. 绿色 CI 不能代替线上验收。必须访问真实 `https://lijinzh.github.io/ScholarAnalysis/` 页面检查构建配置、段落意见、媒体加载和移动端表现。
5. 测试 Issue 必须留下验收说明并关闭；真实用户 Issue 不得作为测试数据关闭。最终报告应列出提交 SHA、Pages 工作流链接、线上页面链接、验证项目和仍保留在本地 `inbox/` 的受限材料。

## 已验证的稳定经验

1. 论文汇总页、三篇论文详情页、段落级意见、整篇意见和 HTML5 视频均应由公共生成器驱动；当前三篇论文已经验证能自动创建带上下文的 GitHub Issue，且不跳转到 GitHub 创建页。
2. Cloudflare Turnstile 使用 Managed widget；公开 widget 可允许 `lijinzh.github.io`、`localhost` 和 `127.0.0.1` 便于开发，但生产 Worker 的 `TURNSTILE_HOSTNAMES` 只接受 `lijinzh.github.io`。
3. 静态 Pages 绝不能持有 GitHub Issue 写入 Token。已经成功验证的模式是“Pages 公开配置 → Turnstile → Cloudflare Worker → fine-grained PAT → GitHub Issue”。
4. 补充视频使用仓库直出 MP4 时，应避免 Git LFS，单文件保持低于 95 MiB，并在 GitHub Pages 实际播放；仅检查文件存在或 `ffprobe` 通过不足以证明网页可播放。
5. 手写 SVG、方块流程图和生成式图片的用途必须分开：统计曲线、表格与 UI 装饰可以代码生成；主体科研概念图必须使用 GPT-Image 2。废弃的手绘主体图保留在 `inbox/06-local-only/`，不得留在 `publish/` 等待误提交。
