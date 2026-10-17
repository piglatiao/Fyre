import type { GalleryAlbum } from "@/types/gallery-album";
import type { GalleryAlbumAccess } from "@/types/gallery-album-access";
import type { GalleryAlbumDetail } from "@/types/gallery-album-detail";

// 相册前台仓储接口：仅读取已启用相册
export interface GalleryRepository {
  listEnabled(): Promise<GalleryAlbum[]>;
  findEnabledAccessBySlug(slug: string): Promise<GalleryAlbumAccess | null>;
  findEnabledBySlug(slug: string): Promise<GalleryAlbumDetail | null>;
  findEnabledPasswordHash(id: number): Promise<{ slug: string; passwordHash: string } | null>;
}
