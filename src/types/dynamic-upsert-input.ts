import type { DynamicImage } from "./dynamic-image";

// 后台动态新增/编辑入参（发布时间为字符串，由服务层解析为 Date）
export interface DynamicUpsertInput {
  content: string;
  images: DynamicImage[];
  location: string;
  pinned: boolean;
  publishedAt: string | null;
}