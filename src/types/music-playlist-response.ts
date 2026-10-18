import type { MusicSourceMode } from "./music-source-mode";
import type { MusicTrack } from "./music-track";

// 在线歌单接口响应：source 表示最终实际使用的来源（在线失败时回落 local）
export interface MusicPlaylistResponse {
  source: MusicSourceMode;
  tracks: MusicTrack[];
}
