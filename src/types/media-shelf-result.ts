import type { MediaShelfItem } from "./media-shelf-item";

// 媒体收藏聚合结果：统一表达正常、空列表、未配置与可恢复错误
export interface MediaShelfResult {
  status: "ready" | "empty" | "not-configured" | "error";
  items: MediaShelfItem[];
  fetchedAt: string;
  message: string;
  warning: string;
}
