import type { MusicPlayMode } from "./music-play-mode";
import type { MusicTrack } from "./music-track";
import type { LyricLine } from "./lyric-line";

// 音乐播放器对外状态与操作：导航栏浮动面板与左侧栏「音乐」卡片共用
export interface MusicPlayerState {
  // 播放列表与当前曲目
  tracks: MusicTrack[];
  current: MusicTrack | null;
  currentIndex: number;
  // 播放状态：playing 由音频事件驱动，loading 为切歌缓冲
  playing: boolean;
  loading: boolean;
  // 播放进度与总时长（秒）
  progress: number;
  duration: number;
  // 当前曲目解析后的歌词与高亮行下标（无歌词时为 -1）
  lyrics: LyricLine[];
  activeLyricIndex: number;
  // 音量（0-1）与静音状态
  volume: number;
  muted: boolean;
  // 播放模式与播放列表抽屉开合
  mode: MusicPlayMode;
  playlistOpen: boolean;
  lyricsOpen: boolean;
  // 播放指定下标的曲目
  playTrack(index: number): void;
  // 播放/暂停当前曲目
  toggle(): void;
  // 手动切换上一首 / 下一首
  previous(): void;
  next(): void;
  // 按比例跳转播放进度（0-1）
  seekRatio(ratio: number): void;
  // 按秒跳转播放进度（歌词行点击使用）
  seekTo(seconds: number): void;
  // 设置音量（0-1）与静音开关
  setVolume(value: number): void;
  toggleMute(): void;
  // 切换播放模式：列表循环 → 单曲循环 → 随机
  cycleMode(): void;
  // 展开/收起播放列表
  togglePlaylist(): void;
  // 展开/收起歌词（与播放列表互斥）
  toggleLyrics(): void;
}
