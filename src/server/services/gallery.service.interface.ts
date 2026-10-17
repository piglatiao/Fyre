import type { GalleryAlbum } from "@/types/gallery-album";
import type { GalleryAlbumAccess } from "@/types/gallery-album-access";
import type { GalleryAlbumDetail } from "@/types/gallery-album-detail";

// 相册前台服务接口
export interface GalleryService {
  listAlbums(): Promise<GalleryAlbum[]>;
  getAlbumAccess(slug: string): Promise<GalleryAlbumAccess | null>;
  getAlbum(slug: string, includePhotos: boolean): Promise<GalleryAlbumDetail | null>;
  verifyAlbumPassword(id: number, password: string): Promise<{ slug: string; passwordHash: string } | null>;
}
