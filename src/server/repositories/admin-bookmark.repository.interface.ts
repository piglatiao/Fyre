import type { AdminBookmarkGroup } from "@/types/admin-bookmark-group";
import type { AdminBookmarkItem } from "@/types/admin-bookmark-item";
import type { BookmarkGroupInput } from "@/types/bookmark-group-input";
import type { BookmarkItemInput } from "@/types/bookmark-item-input";

// 书签后台仓储接口：分组与条目分别维护
export interface AdminBookmarkRepository {
  listGroups(): Promise<AdminBookmarkGroup[]>;
  findGroupById(id: number): Promise<AdminBookmarkGroup | null>;
  findGroupBySlug(slug: string): Promise<{ id: number } | null>;
  createGroup(input: BookmarkGroupInput): Promise<{ id: number }>;
  updateGroup(id: number, input: BookmarkGroupInput): Promise<void>;
  removeGroup(id: number): Promise<void>;
  findItemById(id: number): Promise<AdminBookmarkItem | null>;
  createItem(input: BookmarkItemInput): Promise<{ id: number }>;
  updateItem(id: number, input: BookmarkItemInput): Promise<void>;
  removeItem(id: number): Promise<void>;
}
