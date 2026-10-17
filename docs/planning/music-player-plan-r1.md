# 音乐播放器模块实施方案 · R1

> 状态：待用户审核批准后实施
> 日期：2026-10-17
> 依据：官网 https://firefly.cuteleaf.cn 首页快照（docs/research/firefly.cuteleaf.cn-site/root-page/index.html）

## 一、背景与目标

官网导航栏有「音乐」按钮（`#music-player-switch`，aria-controls=`music-nav-panel`），点击展开悬浮播放器面板；我们目前没有这项能力。本方案实现自托管「本地曲库」版播放器：曲目、封面、音频全部在后台维护（复用现有媒体库上传），前台导航栏一键展开，支持进度/音量/循环模式/播放列表，切换页面不中断播放。

官网用 Meting API 从第三方音乐平台取歌单（`meting/?server=:server&type=:type&id=:id`），依赖外部接口且版权不可控；本项目改用本地曲库，媒体层已验证可直接复用：

- 音频上传已就绪：`src/server/storage/local-media-storage.ts` 白名单已含 mp3/m4a/wav/ogg/flac（50MB 上限），octet-stream 兜底扩展名也已包含；
- 播放已就绪：`src/app/uploads/[...path]/route.ts` 已为音频输出正确 MIME 并支持 Range 请求（浏览器可拖动进度、边下边播）；
- 上传入口已就绪：后台媒体库可直接上传音频并获得 `/uploads/年/月/xxx.mp3` 地址（MediaUrlField 选择器亦可复用）。

## 二、官网实测证据（面板结构，用于视觉对齐）

面板 `#music-nav-panel`：`float-panel absolute right-16 w-80 p-2 pt-4.5 z-50`，由导航栏音乐按钮开合。面板内自上而下：

1. 顶部行：圆形封面（w-14 h-14，播放时缓慢旋转 `animate-spin-slow`，暂停时 `animation-play-state: paused`）+ 曲名（粗体截断，未播放显示「音乐」）+ 歌手（未播放显示「暂未播放」）+ 歌词开关按钮（无歌词时隐藏）+ 时间（当前/总时长，等宽小字）+ 音量（静音按钮 + 0-100 滑块，默认 70）。
2. 细进度条：h-1 圆角，可点击跳转，悬停显示主色滑块。
3. 控制行：循环模式（列表/单曲/随机三态）、上一首、播放/暂停（w-12 h-12 圆形主色）、下一首、播放列表开合箭头。
4. 歌词抽屉（可折叠，滚动居中，占位「暂无歌词」）+ 播放列表抽屉（可折叠，高 48 滚动）。
5. 加载遮罩（切歌缓冲时显示）。

## 三、数据模型（Prisma / MySQL，新增迁移 add_music_track）

```prisma
// 音乐曲目：本地曲库条目，音频与封面复用媒体库地址
model MusicTrack {
  id        Int      @id @default(autoincrement())
  title     String   @db.VarChar(200)   // 曲名
  artist    String   @db.VarChar(200)   // 歌手，可空串
  audioUrl  String   @db.VarChar(500)   // 音频地址（/uploads/… 或外链）
  coverUrl  String   @db.VarChar(500)   // 封面地址，可空串（空则显示音符占位）
  sortOrder Int      @default(0)        // 排序（升序）
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([sortOrder, id])
}
```

## 四、文件清单

### 新增

| 文件 | 职责 |
| --- | --- |
| `src/types/music-track.ts` | 前台曲目类型（id/title/artist/audioUrl/coverUrl） |
| `src/server/repositories/music-track.repository.interface.ts` / `.ts` | 列表（公开）+ 后台 CRUD |
| `src/server/services/music.service.interface.ts` / `music.service.ts` | 业务封装（排序、计数） |
| `src/server/validators/music-track.schema.ts` | zod 校验（曲名/音频地址必填，长度上限） |
| `src/app/api/music/route.ts` | GET 公开列表；POST 新增（鉴权） |
| `src/app/api/music/[id]/route.ts` | PUT 更新 / DELETE 删除（鉴权） |
| `src/lib/use-music-player.ts` | HTMLAudioElement 封装（播放/暂停/上一首/下一首/跳转/音量/循环三态） |
| `src/components/site/music-player.tsx` | 导航栏按钮 + 面板容器；音频实例常驻（客户端路由切换不中断） |
| `src/components/site/music-player-panel.tsx` | 面板 UI（封面、信息、进度、控制行、播放列表） |
| `src/app/admin/(protected)/music/page.tsx` | 后台音乐管理页 |
| `src/components/admin/music-manager.tsx` | 后台列表/新增/编辑/删除（音频与封面用 MediaUrlField） |

### 修改

| 文件 | 改动 |
| --- | --- |
| `prisma/schema.prisma` | 新增 MusicTrack 模型 |
| `src/components/site/site-header.tsx` | 搜索与背景视频开关之间插入音乐按钮 |
| 后台侧栏导航组件 | 新增「音乐」入口 |

说明：媒体上传白名单、`/uploads` 音频 MIME 与 Range 播放、MediaUrlField 均无需改动，直接复用。

## 五、验收标准

- 后台新增曲目（上传 mp3 + 封面）→ 前台导航栏出现音乐按钮 → 面板可打开，播放/暂停/上一首/下一首/进度跳转/音量/静音/循环三态全部可用；封面播放时旋转、暂停时停止。
- 客户端路由切换（首页 → 文章 → 归档）播放不中断。
- 未配置曲目时按钮不渲染；音频地址失效时自动跳到下一首并保持面板可用。
- 移动端（<768px）同样可打开面板（官网该按钮移动端也显示）。
- 工程质量：`tsc --noEmit` 0、`eslint` 0；CDP 实测（播放、切歌、进度跳转、路由切换续播）截图取证。

## 六、待用户确认

1. 按「本地曲库」实现（不使用 Meting 第三方接口）——是否同意。
2. 歌词（LRC）一期不做（不渲染歌词开关），二期补 —— 是否同意。
3. 后台入口命名「音乐」。
