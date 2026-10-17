import type { AdminGalleryAlbum } from "@/types/admin-gallery-album";
import type { GalleryAlbumWriteInput } from "@/types/gallery-album-write-input";

// 相册后台仓储接口
export interface AdminGalleryRepository {
  listAll(): Promise<AdminGalleryAlbum[]>;
  findById(id: number): Promise<AdminGalleryAlbum | null>;
  findBySlug(slug: string): Promise<{ id: number } | null>;
  create(input: GalleryAlbumWriteInput): Promise<{ id: number }>;
  update(id: number, input: GalleryAlbumWriteInput): Promise<void>;
  remove(id: number): Promise<void>;
}
