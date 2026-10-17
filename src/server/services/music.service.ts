import type { MusicTrackRepository } from "@/server/repositories/music-track.repository.interface";
import type { AdminMusicTrackItem } from "@/types/admin-music-track-item";
import type { MusicTrack } from "@/types/music-track";
import type { MusicTrackUpsertInput } from "@/types/music-track-upsert-input";
import type { MusicService } from "./music.service.interface";
import { ServiceError } from "./service-error";

// 音乐服务默认实现：前台只暴露播放所需字段，后台提供增删改查
export class DefaultMusicService implements MusicService {
  constructor(private readonly tracks: MusicTrackRepository) {}

  async listPublic(): Promise<MusicTrack[]> {
    const rows = await this.tracks.listAll();
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      artist: row.artist,
      audioUrl: row.audioUrl,
      coverUrl: row.coverUrl,
    }));
  }

  async listForAdmin(): Promise<AdminMusicTrackItem[]> {
    return this.tracks.listAll();
  }

  async create(input: MusicTrackUpsertInput): Promise<{ id: number }> {
    return this.tracks.create(input);
  }

  async update(id: number, input: MusicTrackUpsertInput): Promise<void> {
    const existing = await this.tracks.findById(id);
    if (!existing) {
      throw new ServiceError("music_not_found", "曲目不存在或已被删除");
    }
    await this.tracks.update(id, input);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.tracks.findById(id);
    if (!existing) {
      throw new ServiceError("music_not_found", "曲目不存在或已被删除");
    }
    await this.tracks.remove(id);
  }
}
