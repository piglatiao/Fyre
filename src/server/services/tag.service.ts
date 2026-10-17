import type { TagRepository } from "@/server/repositories/tag.repository.interface";
import type { TagItem } from "@/types/tag-item";
import type { TagService } from "./tag.service.interface";

// 标签服务默认实现
export class DefaultTagService implements TagService {
  constructor(private readonly tags: TagRepository) {}

  async listAll(): Promise<TagItem[]> {
    return this.tags.listAllWithCounts();
  }

  async getBySlug(slug: string): Promise<{ id: number; name: string; slug: string } | null> {
    return this.tags.findBySlug(slug);
  }
}
