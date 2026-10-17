import type { BookmarkRepository } from "@/server/repositories/bookmark.repository.interface";
import type { BookmarkGroup } from "@/types/bookmark-group";
import type { BookmarkService } from "./bookmark.service.interface";

// 书签前台服务默认实现
export class DefaultBookmarkService implements BookmarkService {
  constructor(private readonly bookmarks: BookmarkRepository) {}

  async listGroups(): Promise<BookmarkGroup[]> {
    return this.bookmarks.listEnabledGroups();
  }
}
