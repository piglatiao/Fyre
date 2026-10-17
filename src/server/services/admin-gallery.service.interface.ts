import type { AdminGalleryAlbum } from "@/types/admin-gallery-album";
import type { GalleryAlbumInput } from "@/types/gallery-album-input";

// 相册后台服务接口：负责相册与照片的增删改查和密码处理
export interface AdminGalleryService {
  listAll(): Promise<AdminGalleryAlbum[]>;
  create(input: GalleryAlbumInput): Promise<{ id: number }>;
  update(id: number, input: GalleryAlbumInput): Promise<void>;
  remove(id: number): Promise<void>;
}
