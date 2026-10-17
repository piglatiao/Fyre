import type { MediaShelfResult } from "@/types/media-shelf-result";
import type { MediaNsfwMode } from "@/types/media-nsfw-mode";

// Bangumi 收藏服务：用户名、API 根地址、条目详情地址与缓存时长均由后台配置
export interface BangumiService {
  getCollection(
    username: string,
    apiUrl: string,
    subjectBaseUrl: string,
    cacheMinutes: number,
    nsfwMode: MediaNsfwMode,
  ): Promise<MediaShelfResult>;
}
