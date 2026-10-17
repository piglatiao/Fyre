import {
  Bookmark,
  File,
  FileText,
  Folder,
  HeartHandshake,
  Image,
  Images,
  LayoutDashboard,
  Link2,
  MessageSquare,
  MessagesSquare,
  Music,
  Rocket,
  Settings,
  Tag,
} from "lucide-react";
import type { AdminNavItem } from "@/types/admin-nav-item";

// 后台管理入口：桌面侧栏与移动抽屉共用同一顺序
export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  { href: "/admin", label: "仪表盘", icon: LayoutDashboard },
  { href: "/admin/posts", label: "文章", icon: FileText },
  { href: "/admin/comments", label: "评论", icon: MessagesSquare },
  { href: "/admin/dynamics", label: "动态", icon: MessageSquare },
  { href: "/admin/projects", label: "项目", icon: Rocket },
  { href: "/admin/gallery", label: "相册", icon: Images },
  { href: "/admin/friends", label: "友链", icon: Link2 },
  { href: "/admin/bookmarks", label: "书签", icon: Bookmark },
  { href: "/admin/sponsors", label: "打赏", icon: HeartHandshake },
  { href: "/admin/categories", label: "分类", icon: Folder },
  { href: "/admin/tags", label: "标签", icon: Tag },
  { href: "/admin/pages", label: "页面", icon: File },
  { href: "/admin/music", label: "音乐", icon: Music },
  { href: "/admin/media", label: "媒体", icon: Image },
  { href: "/admin/settings", label: "设置", icon: Settings },
];
