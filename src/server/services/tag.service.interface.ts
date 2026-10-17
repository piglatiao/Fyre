import type { TagItem } from "@/types/tag-item";

// 标签服务接口
export interface TagService {
  // 标签云：全部标签及其已发布文章数量
  listAll(): Promise<TagItem[]>;
  // 按 slug 获取标签
  getBySlug(slug: string): Promise<{ id: number; name: string; slug: string } | null>;
}
