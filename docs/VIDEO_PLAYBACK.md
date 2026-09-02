# GitHub Pages 视频播放规范

## 投递

把原始视频、MOV/MP4 文件或期刊下载的 ZIP 放入对应论文的：

`inbox/03-videos/`

不要直接把压缩包当成网页播放器资源。后续会解压、检查并生成网页兼容副本到 `publish/media/`。

## 推荐转码

```powershell
ffmpeg -i input.mov `
  -c:v libx264 -preset medium -crf 23 `
  -pix_fmt yuv420p -movflags +faststart `
  -c:a aac -b:a 160k `
  output.mp4
```

如果原视频没有音轨，可以去掉音频参数并使用 `-an`。`+faststart` 会把 MP4 元数据移到文件前部，使网页无需完整下载即可开始播放。

## paper.json 中的视频条目

```json
{
  "title": "Movie S1：液态金属逻辑模块切换",
  "src": "media/movie-s1.mp4",
  "poster": "figures/movie-s1-poster.webp",
  "caption": "论文补充视频 S1。",
  "download": true
}
```

## 验收

`pnpm verify` 会检查：

- 文件是否存在；
- 单文件是否低于 95 MiB；
- MP4 是否为 H.264；
- 音轨存在时是否为 AAC；
- 页面引用是否正确。

本地通过并不等于完成。最终还要在真实 github.io 页面点击播放并拖动进度条，确认 CDN 响应和浏览器解码均正常。
