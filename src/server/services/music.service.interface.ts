import type { AdminMusicTrackItem } from "@/types/admin-music-track-item";
import type { MusicTrack } from "@/types/music-track";
import type { MusicTrackUpsertInput } from "@/types/music-track-upsert-input";

// 音乐服务接口：前台播放列表 + 后台曲目管理
export interface MusicService {
  // 前台播放列表（仅公开字段，按排序返回）
  listPublic(): Promise<MusicTrack[]>;
  // 后台曲目列表（含排序与创建时间）
  listForAdmin(): Promise<AdminMusicTrackItem[]>;
  // 新建曲目
  create(input: MusicTrackUpsertInput): Promise<{ id: number }>;
  // 更新曲目
  update(id: number, input: MusicTrackUpsertInput): Promise<void>;
  // 删除曲目
  remove(id: number): Promise<void>;
}
