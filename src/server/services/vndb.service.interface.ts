import type { MediaShelfResult } from "@/types/media-shelf-result";
import type { MediaNsfwMode } from "@/types/media-nsfw-mode";

// VNDB 收藏服务：公开列表无需令牌，私有列表可使用后台配置的 API Token
export interface VndbService {
  getCollection(
    userId: string,
    apiToken: string,
    apiUrl: string,
    vnBaseUrl: string,
    cacheMinutes: number,
    nsfwMode: MediaNsfwMode,
  ): Promise<MediaShelfResult>;
}
