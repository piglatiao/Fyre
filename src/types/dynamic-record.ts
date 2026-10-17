import type { DynamicImage } from "./dynamic-image";

// 动态原始记录（仓储层返回，正文为 Markdown 原文，渲染在服务层完成）
export interface DynamicRecord {
  id: number;
  content: string;
  images: DynamicImage[];
  location: string;
  pinned: boolean;
  publishedAt: Date;
}