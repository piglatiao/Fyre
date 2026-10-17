import type { AdminBookmarkRepository } from "@/server/repositories/admin-bookmark.repository.interface";
import type { AdminBookmarkGroup } from "@/types/admin-bookmark-group";
import type { BookmarkGroupInput } from "@/types/bookmark-group-input";
import type { BookmarkItemInput } from "@/types/bookmark-item-input";
import type { AdminBookmarkService } from "./admin-bookmark.service.interface";
import { ServiceError } from "./service-error";

// 书签后台服务默认实现：校验分组 slug 唯一与记录存在性
export class DefaultAdminBookmarkService implements AdminBookmarkService {
  constructor(private readonly bookmarks: AdminBookmarkRepository) {}

  // 校验分组 slug 是否被其他分组占用
  private async assertSlugAvailable(slug: string, currentId?: number): Promise<void> {
    const existed = await this.bookmarks.findGroupBySlug(slug);
    if (existed && existed.id !== currentId) {
      throw new ServiceError("bookmark_group_slug_exists", "分组标识已存在，请换一个");
    }
  }

  async listGroups(): Promise<AdminBookmarkGroup[]> {
    return this.bookmarks.listGroups();
  }

  async createGroup(input: BookmarkGroupInput): Promise<{ id: number }> {
    await this.assertSlugAvailable(input.slug);
    return this.bookmarks.createGroup(input);
  }

  async updateGroup(id: number, input: BookmarkGroupInput): Promise<void> {
    const existing = await this.bookmarks.findGroupById(id);
    if (!existing) {
      throw new ServiceError("bookmark_group_not_found", "书签分组不存在或已被删除");
    }
    await this.assertSlugAvailable(input.slug, id);
    await this.bookmarks.updateGroup(id, input);
  }

  async removeGroup(id: number): Promise<void> {
    const existing = await this.bookmarks.findGroupById(id);
    if (!existing) {
      throw new ServiceError("bookmark_group_not_found", "书签分组不存在或已被删除");
    }
    await this.bookmarks.removeGroup(id);
  }

  async createItem(input: BookmarkItemInput): Promise<{ id: number }> {
    const group = await this.bookmarks.findGroupById(input.groupId);
    if (!group) {
      throw new ServiceError("bookmark_group_not_found", "书签分组不存在或已被删除");
    }
    return this.bookmarks.createItem(input);
  }

  async updateItem(id: number, input: BookmarkItemInput): Promise<void> {
    const [existing, group] = await Promise.all([
      this.bookmarks.findItemById(id),
      this.bookmarks.findGroupById(input.groupId),
    ]);
    if (!existing) {
      throw new ServiceError("bookmark_not_found", "书签不存在或已被删除");
    }
    if (!group) {
      throw new ServiceError("bookmark_group_not_found", "书签分组不存在或已被删除");
    }
    await this.bookmarks.updateItem(id, input);
  }

  async removeItem(id: number): Promise<void> {
    const existing = await this.bookmarks.findItemById(id);
    if (!existing) {
      throw new ServiceError("bookmark_not_found", "书签不存在或已被删除");
    }
    await this.bookmarks.removeItem(id);
  }
}
