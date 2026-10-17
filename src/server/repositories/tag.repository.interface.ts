import type { TagItem } from "@/types/tag-item";

// 标签仓储接口
export interface TagRepository {
  // 标签云：全部标签及已发布文章数量
  listAllWithCounts(): Promise<TagItem[]>;
  // 按 slug 查询标签
  findBySlug(slug: string): Promise<{ id: number; name: string; slug: string } | null>;
}
