import type { MediaType } from "@/generated/prisma/client";
import { buildPageResult } from "@/lib/build-page-result";
import type { AdminMediaRepository } from "@/server/repositories/admin-media.repository.interface";
import type { MediaStorage } from "@/server/storage/media-storage.interface";
import type { RemoteMediaFetcher } from "@/server/storage/remote-media-fetcher.interface";
import type { MediaItem } from "@/types/media-item";
import type { PageResult } from "@/types/page-result";
import type { MediaService } from "./media.service.interface";
import { ServiceError } from "./service-error";

// 媒体服务默认实现
export class DefaultMediaService implements MediaService {
  constructor(
    private readonly media: AdminMediaRepository,
    private readonly storage: MediaStorage,
    private readonly remoteFetcher: RemoteMediaFetcher,
  ) {}

  async list(params: { page: number; pageSize: number; type?: MediaType }): Promise<PageResult<MediaItem>> {
    const result = await this.media.findPage(params);
    return buildPageResult(result.items, result.total, params.page, params.pageSize);
  }

  async upload(file: { buffer: Buffer; originalName: string; mimeType: string }): Promise<MediaItem> {
    const stored = await this.storage.save(file);
    return this.media.create({ ...stored, originalName: file.originalName });
  }

  async importFromUrl(url: string): Promise<MediaItem> {
    const fetched = await this.remoteFetcher.fetch(url);
    return this.upload(fetched);
  }

  async remove(id: number): Promise<void> {
    const item = await this.media.findById(id);
    if (!item) {
      throw new ServiceError("media_not_found", "媒体不存在或已被删除");
    }
    await this.storage.removeByUrl(item.url);
    await this.media.remove(id);
  }
}
