import type { DynamicImage } from "./dynamic-image";

// 前台动态条目（正文已渲染为 HTML，安全过滤与文章一致）
export interface DynamicEntry {
  id: number;
  html: string;
  images: DynamicImage[];
  location: string;
  pinned: boolean;
  publishedAt: Date;
}