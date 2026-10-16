# 酒馆之 world.execute(me);

一个以时间轴驱动的同人 MV 源码项目：本地 AI 女仆“大肥鱼”、酒馆里的陪伴、被倒回去的分手，以及一次版本更新。

**本包默认运行几何占位演示。** 不附原曲、完整歌词／译文或原作插画；演示保留剧情文字、镜头时间和动画机制，但不能代表原 MV 的完整视觉和音乐效果。片中的 AI／聊天界面是虚构演出，不连接实际模型服务。

开源源码仓库：[hhjh1338-gif/world-execute-me-cc](https://github.com/hhjh1338-gif/world-execute-me-cc)。代码采用 MIT，版权署名“开车必备导航”，见 [LICENSE](LICENSE) 和 [许可范围](docs/LICENSING.md)。本仓库提供可运行源码和几何演示。

## 快速开始

需要 Node.js 20 或更新版本。在本目录运行：

```powershell
npm start
```

打开 <http://127.0.0.1:5181/>。基础几何演示不需要安装 npm 依赖，也不会联网下载素材。换端口可用 `npm start -- 5182`。

空格播放／暂停，左右方向键逐帧，Shift＋方向键逐拍；拖动进度条可以跳到任意时刻。没有音频时按本地时钟静音播放。演示仍包含闪烁、抖动和轻度心理恐怖内容，请按自身情况选择观看。

## 放入自己的素材

将有权使用的文件放在 `input/` 后刷新页面：

- 图片：`input/art/A1.png` 等，见 [28 个图片 ID](input/art/README.md)。
- 字幕：`input/lyrics.en.lrc`、`input/lyrics.zh.json`。
- 音频：`input/edited_song.wav`，应是按时间轴处理后的音轨。

缺失图片使用几何占位，缺失歌词留空，缺失音频静音播放。详细格式、原曲编辑和对齐方法见 [素材输入说明](input/README.md)。导入素材不代表它获得本项目代码许可证的授权；本地素材和生成的视频默认不入库。

## 导出视频（可选）

安装锁定版本的工具依赖：

```powershell
npm run setup:export
```

这一步通常需要联网：npm 获取依赖，ffmpeg-static 的安装脚本获取 FFmpeg 二进制。本包没有捆绑依赖目录、浏览器、字体或 FFmpeg 文件。

需要已安装 Chrome／Chromium。工具会查找常见位置，也可通过 `--chrome` 或 `CHROME_PATH` 指定。可选 `FFMPEG_PATH` 指向已有 FFmpeg；不指定时使用 ffmpeg-static。

先验证一个短的静音片段：

```powershell
npm run export -- --from 0 --to 2 --fps 30 --name demo --noaudio
```

导出整片静音演示：

```powershell
npm run film -- --noaudio
```

默认规格为 1920×1080、60 fps。也支持 4K／120 fps，例如：

```powershell
npm run film -- --scale 2 --fps 120 --jobs 2 --noaudio
```

`--scale` 接受 1–4 的整数倍率，`--fps` 和 `--jobs` 接受正整数。高分辨率整片导出耗时较长，先检查短片。输出保存在本包 `CC/样片/`；不会写入制作方原来的工程。

有声导出前先准备 `input/edited_song.wav`，并在本机 Python 环境安装 `numpy`、`soundfile`；音频重采样另需 `scipy`。工具不会自动安装 Python 包。用 `--python` 或 `PYTHON_PATH` 可选择解释器；准备好后省略 `--noaudio`。

查看已缓存分段可用 `npm run film -- --list`。不同规格使用独立分段目录；源码、输入素材或相关设置变化时，缓存需要更新。导出文件的素材状态见工具生成的记录。

## 修改项目

| 目录 | 用途 |
| --- | --- |
| `CC/script/act1.json` 至 `act4.json` | 剧情事件、台词、镜头动作 |
| `CC/script/timeline.json` | 时间轴、节拍、倒流音频安排、音画偏移 |
| `CC/script/form.json`、`colour.json`、`emotion.json` | 形态与色彩变化 |
| `CC/app/src/film/` | 分镜渲染、图像加载和占位逻辑 |
| `CC/app/film/` | 预览页面与播放控制 |
| `CC/app/tools/` | 本地服务、片段／整片／封面导出 |
| `CC/tools/` | 音频编辑和程序音效混合 |

时间数据使用成片时间；插入倒流后与原曲时间不同。修改音乐版本时需重新核对时间，不能只换文件名。

轻量检查：

```powershell
npm run check
```

这会检查 JS 语法、模块引用、JSON、依赖锁和本地 HTTP 行为，不会安装依赖或渲染视频。源码声明支持的输出规格与本次实际验收范围见 [验证说明](docs/VALIDATION.md)。

## 许可、致谢和制作说明

代码许可与素材许可分开处理，见 [NOTICE.md](NOTICE.md)。项目代码采用 MIT；音乐、角色设计、用户导入素材和第三方依赖不因此改用 MIT。`private: true` 用于避免误发 npm 包，不影响以后建立公开 GitHub 仓库。

制作协作使用 DeepSeek、Codex、Claude Code；原作角色插画使用 AI 生成并参考社区同人作品。默认几何占位图由代码绘制，不使用这些插画的像素或轮廓。

原曲为 [Mili《world.execute(me);》](https://project-mili.bandcamp.com/track/world-execute-me)。参考研究涉及：

- [yym8224961 / world.execute-me-ascii](https://github.com/yym8224961/world.execute-me-ascii)
- [MisakaZentai / world-execute-me-dsh-pv](https://github.com/MisakaZentai/world-execute-me-dsh-pv)
- [Nyankomintsu / world-execute-me-lyric-mv](https://github.com/Nyankomintsu/world-execute-me-lyric-mv)

本项目与上述作者、Mili 或 DeepSeek 没有官方从属或认可关系。
