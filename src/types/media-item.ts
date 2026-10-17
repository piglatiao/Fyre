import type { MediaType } from "@/generated/prisma/client";

// 媒体资源项
export interface MediaItem {
  id: number;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  type: MediaType;
  createdAt: Date;
}
