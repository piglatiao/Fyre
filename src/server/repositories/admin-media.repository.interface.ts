import type { MediaType } from "@/generated/prisma/client";
import type { MediaCreateInput } from "@/types/media-create-input";
import type { MediaItem } from "@/types/media-item";

// 后台媒体仓储接口
export interface AdminMediaRepository {
  // 分页查询（可按类型过滤）
  findPage(params: {
    page: number;
    pageSize: number;
    type?: MediaType;
  }): Promise<{ items: MediaItem[]; total: number }>;
  // 新增媒体记录
  create(input: MediaCreateInput): Promise<MediaItem>;
  // 按 id 查询
  findById(id: number): Promise<MediaItem | null>;
  // 删除媒体记录
  remove(id: number): Promise<void>;
  // 媒体总数
  countAll(): Promise<number>;
}
