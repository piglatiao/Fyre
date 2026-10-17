import type { NavLink } from "@/types/nav-link";

// 默认前台导航：后台未配置导航时使用
export const defaultNavLinks: NavLink[] = [
  { label: "主页", href: "/" },
  {
    label: "文章",
    href: "",
    children: [
      { label: "归档", href: "/archive" },
      { label: "分类", href: "/categories" },
      { label: "标签", href: "/tags" },
      { label: "系列", href: "/series" },
    ],
  },
  {
    label: "社交",
    href: "",
    children: [
      { label: "友链", href: "/friends" },
      { label: "留言", href: "/guestbook" },
    ],
  },
  {
    label: "我的",
    href: "",
    children: [
      { label: "动态", href: "/dynamic" },
      { label: "项目", href: "/projects" },
      { label: "相册", href: "/gallery" },
      { label: "书签导航", href: "/booknav" },
      { label: "哔哩哔哩", href: "/bilibili" },
      { label: "番组计划", href: "/bangumi" },
      { label: "VNDB", href: "/vndb" },
      { label: "AnimeList", href: "/myanimelist" },
    ],
  },
  {
    label: "关于",
    href: "",
    children: [
      { label: "打赏", href: "/sponsor" },
      { label: "关于我", href: "/about" },
    ],
  },
  {
    label: "链接",
    href: "",
    children: [
      { label: "GitHub", href: "https://github.com/CuteLeaf/Firefly" },
      { label: "Gitee", href: "https://gitee.com/CuteLeaf/Firefly" },
      { label: "Firefly文档", href: "https://docs-firefly.cuteleaf.cn" },
    ],
  },
];

// 保证「社交」分组始终存在，并插入到「文章」之后（社交图标由横幅与资料卡展示）
export function resolveSiteNavLinks(configured: NavLink[]): NavLink[] {
  const base = configured.length > 0 ? configured : defaultNavLinks;
  if (base.some((item) => item.label === "社交")) {
    return base;
  }

  const socialGroup: NavLink = {
    label: "社交",
    href: "",
    children: [
      { label: "友链", href: "/friends" },
      { label: "留言", href: "/guestbook" },
    ],
  };
  const articleIndex = base.findIndex((item) => item.label === "文章");
  const insertAt = articleIndex >= 0 ? articleIndex + 1 : Math.min(1, base.length);
  return [...base.slice(0, insertAt), socialGroup, ...base.slice(insertAt)];
}
