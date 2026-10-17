import { compare } from "bcryptjs";
import type { GalleryRepository } from "@/server/repositories/gallery.repository.interface";
import type { GalleryAlbum } from "@/types/gallery-album";
import type { GalleryAlbumAccess } from "@/types/gallery-album-access";
import type { GalleryAlbumDetail } from "@/types/gallery-album-detail";
import type { GalleryService } from "./gallery.service.interface";

// 相册前台服务默认实现：加密相册在解锁前不下发照片
export class DefaultGalleryService implements GalleryService {
  constructor(private readonly gallery: GalleryRepository) {}

  async listAlbums(): Promise<GalleryAlbum[]> {
    return this.gallery.listEnabled();
  }

  async getAlbumAccess(slug: string): Promise<GalleryAlbumAccess | null> {
    return this.gallery.findEnabledAccessBySlug(slug);
  }

  async getAlbum(slug: string, includePhotos: boolean): Promise<GalleryAlbumDetail | null> {
    const album = await this.gallery.findEnabledBySlug(slug);
    if (!album) {
      return null;
    }
    return includePhotos ? album : { ...album, photos: [] };
  }

  async verifyAlbumPassword(id: number, password: string): Promise<{ slug: string; passwordHash: string } | null> {
    const record = await this.gallery.findEnabledPasswordHash(id);
    if (!record) {
      return null;
    }
    return (await compare(password, record.passwordHash)) ? record : null;
  }
}
