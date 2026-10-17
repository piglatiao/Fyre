import type { AdminBookmarkGroup } from "@/types/admin-bookmark-group";
import type { BookmarkGroupInput } from "@/types/bookmark-group-input";
import type { BookmarkItemInput } from "@/types/bookmark-item-input";

// 书签后台服务接口
export interface AdminBookmarkService {
  listGroups(): Promise<AdminBookmarkGroup[]>;
  createGroup(input: BookmarkGroupInput): Promise<{ id: number }>;
  updateGroup(id: number, input: BookmarkGroupInput): Promise<void>;
  removeGroup(id: number): Promise<void>;
  createItem(input: BookmarkItemInput): Promise<{ id: number }>;
  updateItem(id: number, input: BookmarkItemInput): Promise<void>;
  removeItem(id: number): Promise<void>;
}
