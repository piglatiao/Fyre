import type { MediaShelfResult } from "@/types/media-shelf-result";
import type { MediaNsfwMode } from "@/types/media-nsfw-mode";

// MyAnimeList 收藏服务：同时读取动画与漫画公开列表，并使用后台配置的 Client ID
export interface MalService {
  getCollection(
    username: string,
    clientId: string,
    apiUrl: string,
    animeBaseUrl: string,
    mangaBaseUrl: string,
    cacheMinutes: number,
    nsfwMode: MediaNsfwMode,
  ): Promise<MediaShelfResult>;
}
