import { prisma } from "@/lib/prisma";
import type { AdminMusicTrackItem } from "@/types/admin-music-track-item";
import type { MusicTrackUpsertInput } from "@/types/music-track-upsert-input";
import type { MusicTrackRepository } from "./music-track.repository.interface";

// 曲目查询字段：前后台共用同一份数据形状（避免多查正文类字段）
const trackSelect = {
  id: true,
  title: true,
  artist: true,
  audioUrl: true,
  coverUrl: true,
  sortOrder: true,
  createdAt: true,
} as const;

// 基于 Prisma 的音乐曲目仓储实现
export class PrismaMusicTrackRepository implements MusicTrackRepository {
  async listAll(): Promise<AdminMusicTrackItem[]> {
    return prisma.musicTrack.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: trackSelect,
    });
  }

  async findById(id: number): Promise<AdminMusicTrackItem | null> {
    return prisma.musicTrack.findUnique({ where: { id }, select: trackSelect });
  }

  async create(input: MusicTrackUpsertInput): Promise<{ id: number }> {
    const row = await prisma.musicTrack.create({ data: input, select: { id: true } });
    return { id: row.id };
  }

  async update(id: number, input: MusicTrackUpsertInput): Promise<void> {
    await prisma.musicTrack.update({ where: { id }, data: input });
  }

  async remove(id: number): Promise<void> {
    await prisma.musicTrack.delete({ where: { id } });
  }
}
