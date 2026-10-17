import type { BookmarkItem } from "./bookmark-item";

// 前台书签分组
export interface BookmarkGroup {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
  weight: number;
  items: BookmarkItem[];
}
