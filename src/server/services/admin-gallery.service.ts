import { hash } from "bcryptjs";
import { parseOptionalDate } from "@/lib/parse-date";
import type { AdminGalleryRepository } from "@/server/repositories/admin-gallery.repository.interface";
import type { AdminGalleryAlbum } from "@/types/admin-gallery-album";
import type { GalleryAlbumInput } from "@/types/gallery-album-input";
import type { GalleryAlbumWriteInput } from "@/types/gallery-album-write-input";
import type { AdminGalleryService } from "./admin-gallery.service.interface";
import { ServiceError } from "./service-error";

// 密码哈希轮次：与管理员账号保持一致
const PASSWORD_HASH_ROUNDS = 10;

// 整理标签：去空白、去重，并限制最多 12 个
function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0))].slice(0, 12);
}

// 相册后台服务默认实现：校验 slug 唯一性、转换日期并安全处理密码
export class DefaultAdminGalleryService implements AdminGalleryService {
  constructor(private readonly albums: AdminGalleryRepository) {}

  // 把表单入参转换为仓储写入数据；passwordHash 为 undefined 表示保留原密码
  private async toWriteInput(input: GalleryAlbumInput, keepPassword: boolean): Promise<GalleryAlbumWriteInput> {
    const eventDate = parseOptionalDate(input.eventDate);
    if (input.eventDate && !eventDate) {
      throw new ServiceError("invalid_event_date", "相册日期格式不正确");
    }

    let passwordHash: string | null | undefined;
    if (input.password.trim().length > 0) {
      passwordHash = await hash(input.password, PASSWORD_HASH_ROUNDS);
    } else if (input.clearPassword) {
      passwordHash = null;
    } else if (!keepPassword) {
      passwordHash = null;
    }

    return {
      title: input.title.trim(),
      slug: input.slug.trim(),
      description: input.description.trim(),
      coverUrl: input.coverUrl.trim(),
      eventDate,
      location: input.location.trim(),
      tags: normalizeTags(input.tags),
      passwordHash,
      passwordHint: input.passwordHint.trim(),
      sortOrder: input.sortOrder,
      enabled: input.enabled,
      photos: input.photos.map((photo) => ({
        imageUrl: photo.imageUrl.trim(),
        caption: photo.caption.trim(),
        sortOrder: photo.sortOrder,
      })),
    };
  }

  async listAll(): Promise<AdminGalleryAlbum[]> {
    return this.albums.listAll();
  }

  async create(input: GalleryAlbumInput): Promise<{ id: number }> {
    const existing = await this.albums.findBySlug(input.slug.trim());
    if (existing) {
      throw new ServiceError("gallery_slug_exists", "相册标识已被使用，请换一个 slug");
    }
    return this.albums.create(await this.toWriteInput(input, false));
  }

  async update(id: number, input: GalleryAlbumInput): Promise<void> {
    const current = await this.albums.findById(id);
    if (!current) {
      throw new ServiceError("gallery_not_found", "相册不存在或已被删除");
    }
    const sameSlug = await this.albums.findBySlug(input.slug.trim());
    if (sameSlug && sameSlug.id !== id) {
      throw new ServiceError("gallery_slug_exists", "相册标识已被使用，请换一个 slug");
    }
    await this.albums.update(id, await this.toWriteInput(input, true));
  }

  async remove(id: number): Promise<void> {
    const current = await this.albums.findById(id);
    if (!current) {
      throw new ServiceError("gallery_not_found", "相册不存在或已被删除");
    }
    await this.albums.remove(id);
  }
}
