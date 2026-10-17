import {
  Archive,
  BookOpen,
  Compass,
  FileText,
  Film,
  FolderOpen,
  Heart,
  Home,
  Info,
  Layers,
  LibraryBig,
  Link2,
  Map,
  MessageCircle,
  Images,
  Rss,
  Search,
  Tags,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ComponentType } from "react";
import BilibiliIcon from "./bilibili-icon";

// 导航文字对应的 Lucide 图标
const labelIcons: Record<string, LucideIcon | ComponentType<{ className?: string }>> = {
  主页: Home,
  首页: Home,
  文章: FileText,
  社交: Users,
  我的: UserRound,
  关于: Info,
  链接: Link2,
  归档: Archive,
  分类: FolderOpen,
  标签: Tags,
  系列: Layers,
  动态: MessageCircle,
  友链: Link2,
  留言: MessageCircle,
  搜索: Search,
  关于我: UserRound,
  关于本站: Info,
  RSS: Rss,
  Atom: Rss,
  Sitemap: Map,
  书签导航: BookOpen,
  项目: Compass,
  相册: Images,
  打赏: Heart,
  哔哩哔哩: BilibiliIcon,
  番组计划: Film,
  VNDB: LibraryBig,
  MyAnimeList: BookOpen,
  AnimeList: BookOpen,
  GitHub: Link2,
  Gitee: Link2,
  Firefly文档: BookOpen,
};

// 导航地址对应的图标：后台自定义名称时仍能按常用地址匹配
const hrefIcons: Record<string, LucideIcon | ComponentType<{ className?: string }>> = {
  "/": Home,
  "/archives": Archive,
  "/archive": Archive,
  "/categories": FolderOpen,
  "/tags": Tags,
  "/series": Layers,
  "/dynamic": MessageCircle,
  "/friends": Link2,
  "/guestbook": MessageCircle,
  "/booknav": BookOpen,
  "/projects": Compass,
  "/gallery": Images,
  "/sponsor": Heart,
  "/bilibili": BilibiliIcon,
  "/bangumi": Film,
  "/vndb": LibraryBig,
  "/myanimelist": BookOpen,
  "/search": Search,
  "/page/about": UserRound,
  "/about": UserRound,
  "/rss.xml": Rss,
  "/atom.xml": Rss,
  "/sitemap.xml": Map,
};

// 导航图标：优先按名称匹配，其次按地址匹配；未知项不渲染图标
export default function NavIcon({
  label,
  href,
  className,
}: {
  label: string;
  href: string;
  className?: string;
}) {
  const Icon = labelIcons[label] ?? hrefIcons[href];
  return Icon ? <Icon aria-hidden className={className} /> : null;
}
