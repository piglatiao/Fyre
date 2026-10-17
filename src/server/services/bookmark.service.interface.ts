import type { BookmarkGroup } from "@/types/bookmark-group";

// 书签前台服务接口
export interface BookmarkService {
  // 获取启用的分组与条目
  listGroups(): Promise<BookmarkGroup[]>;
}
