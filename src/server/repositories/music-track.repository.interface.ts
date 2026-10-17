import type { AdminMusicTrackItem } from "@/types/admin-music-track-item";
import type { MusicTrackUpsertInput } from "@/types/music-track-upsert-input";

// 音乐曲目仓储接口：仅负责数据存取，业务规则由 MusicService 处理
export interface MusicTrackRepository {
  // 全部曲目（按 sortOrder、id 升序）
  listAll(): Promise<AdminMusicTrackItem[]>;
  // 按 id 查询
  findById(id: number): Promise<AdminMusicTrackItem | null>;
  // 新建曲目
  create(input: MusicTrackUpsertInput): Promise<{ id: number }>;
  // 更新曲目
  update(id: number, input: MusicTrackUpsertInput): Promise<void>;
  // 删除曲目
  remove(id: number): Promise<void>;
}
