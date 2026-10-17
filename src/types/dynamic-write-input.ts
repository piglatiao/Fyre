import type { DynamicImage } from "./dynamic-image";

// 动态写入入参（已通过校验并把发布时间规范化为 Date 后交给仓储层）
export interface DynamicWriteInput {
  content: string;
  images: DynamicImage[];
  location: string;
  pinned: boolean;
  publishedAt: Date;
}