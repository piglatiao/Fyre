import type { BilibiliApiItem } from "./bilibili-api-item";

// 哔哩哔哩追番接口分页响应
export interface BilibiliApiPage {
  code?: number;
  message?: string;
  data?: {
    total?: number;
    list?: BilibiliApiItem[];
  };
}
