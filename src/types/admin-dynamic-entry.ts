import type { DynamicImage } from "./dynamic-image";

// 后台动态条目（编辑器回填用，正文为 Markdown 原文，不回传 HTML）
export interface AdminDynamicEntry {
  id: number;
  content: string;
  images: DynamicImage[];
  location: string;
  pinned: boolean;
  publishedAt: Date;
  createdAt: Date;
}