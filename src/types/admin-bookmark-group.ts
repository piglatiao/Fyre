import type { AdminBookmarkItem } from "./admin-bookmark-item";

// 后台书签分组：包含全部条目
export interface AdminBookmarkGroup {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
  weight: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  items: AdminBookmarkItem[];
}
