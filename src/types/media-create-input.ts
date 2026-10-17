import type { MediaType } from "@/generated/prisma/client";

// 媒体入库入参（存储层校验并落盘后写入数据库）
export interface MediaCreateInput {
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  type: MediaType;
}
