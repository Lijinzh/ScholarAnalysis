# GPT-Image CLI 远端断开与科研图内容错误：Codex 修复交接

本文档把本次生成 adz9609 论文科研示意图时遇到的两类问题分开记录，供另一个 Codex 直接复现、补测试并修复。第一类是客户端传输层在约 30 秒处被远端关闭；第二类是请求成功后，图像模型仍可能生成科学关系错误的内容。两类问题不能混为同一个“生成失败”。

## 1. 环境与当前实现

- 操作系统：Windows / PowerShell。
- 图像模型：`gpt-image-2`。
- 已安装 CLI：`gpt-image 0.2.4`；`gpt-image update --check --json` 显示当前没有更新版本。
- 项目调用入口：`C:\Users\admin\.codex\skills\cc-switch-gpt-image-2\scripts\generate_image.py`。
- 当前 provider 由环境提供，连接通过 Windows 系统代理；日志只应记录 endpoint 与代理模式，不能记录 API key、Authorization header 或 CC-Switch 数据库中的密钥。
- 无损原图位于论文 Git 忽略目录 `inbox/06-local-only/generated-source/`，网页只发布压缩后的 WebP。

## 2. 旧实现如何失败

旧版 Python 实现直接使用 `urllib.request.urlopen` 等待图像生成响应。首次请求和用户明确授权后的第一次重试，都在大约 30 秒后失败，未生成输出文件，核心异常一致：

```text
generate_image.py -> request_image -> urllib.request.urlopen
http.client.RemoteDisconnected: Remote end closed connection without response
```

关键证据：

1. 同一提示词的 `--dry-run` 正常，说明参数解析、provider 解析和输出路径校验不是失败点。
2. 异常中没有 HTTP 状态码、响应体或模型级错误 JSON，说明客户端没有收到一个完整的应用层错误响应。
3. 失败发生在请求已经发出之后，因此这次调用有可能已被上游接收或计费；“没有输出文件”不能证明“没有提交”。
4. 两次都集中在约 30 秒，符合代理、客户端读取超时或中间层空闲连接限制，而不像提示词内容校验失败。

因此，当前最有证据支持的结论是：故障位于客户端—代理—上游之间的长请求传输/等待链路。现有证据还不足以断言究竟是本机代理主动断开、上游反向代理超时，还是旧 `urllib` 路径未正确处理长时间无响应；修复时应保留这三个假设并用可控 mock server 区分。

## 3. 安全复现方式

先使用不计费的 dry-run：

```powershell
python C:\Users\admin\.codex\skills\cc-switch-gpt-image-2\scripts\generate_image.py `
  --prompt-file C:\ABSOLUTE\prompt.txt `
  --output C:\ABSOLUTE\output.png `
  --dry-run
```

真实请求可能计费，只能在用户明确授权后运行：

```powershell
python C:\Users\admin\.codex\skills\cc-switch-gpt-image-2\scripts\generate_image.py `
  --prompt-file C:\ABSOLUTE\prompt.txt `
  --output C:\ABSOLUTE\output.png
```

若日志已经出现 `request_submitted=true` 或 `possibly_billed=true`，任何超时、断流或进程异常之后都不得自动再次提交。先保存日志、检查输出临时文件和最终文件，再由用户决定是否重试。

## 4. 当前实现为何成功

当前 Python 包装器不再自己用 `urllib` 实现图像 API，而是调用已安装的 `gpt-image` CLI，并输出 JSONL 状态事件：

```text
request_started -> request_submitted -> heartbeat -> completed/failed
```

在 CLI 0.2.4 下，包装器把读取等待上限扩展为 3600 秒；CLI 同时使用 Windows 系统代理，并在等待期间每 15 秒输出一次 heartbeat。本次第二轮四个真实请求分别在 52.49、36.82、51.44 和 42.61 秒完成，全部只提交一次，没有自动重试。第一轮四个成功请求也分别耗时 53.93、55.29、59.44 和 62.85 秒。这些结果说明约 30 秒的旧等待链路确实不足以承载正常生成时间。

成功不能被简化成“把 timeout 改大就一定修好”：当前 CLI 还统一了系统代理使用、状态事件、计费歧义标记、输出校验和原子写入。需要通过测试确认究竟哪些因素是必要条件。

## 5. 建议另一个 Codex 补的自动化测试

1. 建立本地 mock HTTP 服务，延迟 45–70 秒再返回合法图像 JSON，验证客户端不会在 30 秒提前断开。
2. 分开测试连接超时、响应头超时、响应体读取超时和图片下载超时，不要复用一个含义模糊的总 timeout。
3. 模拟“提交前断开”和“提交后断开”，确认只有后者标记 `possibly_billed=true`，且两种情况都不自动重试。
4. 模拟代理环境，确认 dry-run 与真实请求使用同一套 Windows 系统代理解析逻辑。
5. 模拟服务端返回 4xx/5xx JSON、空响应、截断 JSON、损坏的 base64 和非 PNG 数据，保留可诊断错误，同时不得覆盖已有正确输出。
6. 输出先写同目录临时文件，验证图像格式、尺寸和完整性后再原子替换最终文件；失败时清理临时文件。
7. 对 JSONL 事件做状态机测试，确保事件顺序和 `request_submitted`、`possibly_billed`、`automatic_retry` 字段不会自相矛盾。

## 6. 请求成功但图片仍然“乱”的原因

图像 API 返回成功只证明生成和下载完成，不证明科研内容正确。第一轮四张图都成功返回，但人工验图后全部拒绝发布：

- 传感器安装图把右侧传感器重复标成 `S_L`，并把第三颗前向传感器与机腹向下高度计合并成一个器件。
- 隔声图把挡板画在换能器与目标之间，导致有效超声路径像是穿过吸声材料。
- 波形图把连续 32 次测量错误写成“32 channels”，误导为 32 个硬件通道。
- 算法图捏造了 0–10 m 量程坐标，把同一架无人机的不同处理阶段画成三架独立无人机，并把物理隔声结构误画成网络模块外壳。

这些是生成模型的内容保真问题，不是传输 bug。第二轮通过以下方式降低风险：减少图中文字；用互斥的空间约束描述“在后方/上方、不得挡住前向声路”；明确“32 行是重复测量，不是通道”；明确“处理阶段重复出现的是同一架无人机”；并要求网页用中文图注承担精确术语。

即便如此，自动生成科研图仍必须经过人工验图。建议未来在发布流程中加入结构化检查表：器件数量、器件朝向、声路是否被遮挡、物理量与单位、时间帧与硬件通道的区别、算法输入输出、是否捏造坐标/公式、是否把示意图冒充实验照片。任何一项不确定就只保留在 Git 忽略目录，不进入 `publish/`。

## 7. 修复完成的验收标准

- 一个延迟超过 30 秒的合法响应能够稳定完成。
- 日志能明确区分未提交、已提交可能计费、成功完成和确定失败。
- 已提交后的网络异常不会触发隐式或显式自动重试。
- 代理、超时和输出写入行为在 dry-run、真实请求及测试环境中一致且可解释。
- 失败日志不泄露任何 API key、Authorization header 或本地凭据。
- 科研图片发布前仍保留独立的内容准确性审查；传输成功不能自动进入网页。
