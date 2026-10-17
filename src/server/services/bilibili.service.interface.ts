import type { BilibiliCollection } from "@/types/bilibili-collection";

// 哔哩哔哩收藏数据服务接口
export interface BilibiliService {
  // 按 UID 读取追番与追剧；缓存分钟数为 0 时不缓存，失败时优先回退上次缓存
  getCollection(uid: string, cacheMinutes: number): Promise<BilibiliCollection>;
}
