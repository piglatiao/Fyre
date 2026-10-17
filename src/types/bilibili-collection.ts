import type { BilibiliAnime } from "./bilibili-anime";

// 哔哩哔哩收藏聚合结果：页面根据状态展示数据、空状态或可恢复的错误提示
export interface BilibiliCollection {
  status: "ready" | "empty" | "not-configured" | "error";
  items: BilibiliAnime[];
  averageRating: number;
  fetchedAt: string;
  warning: string;
  message: string;
}
