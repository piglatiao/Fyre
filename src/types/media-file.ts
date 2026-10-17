import type { MediaType } from "@/generated/prisma/client";

// 媒体文件（客户端视角：时间为 ISO 字符串）
export interface MediaFile {
  id: number;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  type: MediaType;
  createdAt: string;
}
