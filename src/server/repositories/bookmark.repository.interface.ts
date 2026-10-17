import type { BookmarkGroup } from "@/types/bookmark-group";

// 书签前台仓储接口
export interface BookmarkRepository {
  // 已启用分组及其已启用条目，均按权重降序
  listEnabledGroups(): Promise<BookmarkGroup[]>;
}
