import type { MediaType } from "@/generated/prisma/client";

// 存储层保存文件后的元信息
export interface StoredMediaFile {
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  type: MediaType;
}
