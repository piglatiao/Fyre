import type { NavLink } from "@/types/nav-link";

// 判断导航地址是否命中当前路由：首页精确匹配，其余按路径段匹配
export function isNavHrefActive(pathname: string, href: string): boolean {
  const path = href.split(/[?#]/, 1)[0];
  if (!path || !path.startsWith("/")) {
    return false;
  }
  return path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);
}

// 判断导航项是否激活：下拉分组命中任一子项即视为激活
export function isNavItemActive(pathname: string, item: NavLink): boolean {
  if (item.children?.some((child) => isNavHrefActive(pathname, child.href))) {
    return true;
  }
  return isNavHrefActive(pathname, item.href);
}

// 计算唯一激活的导航项：多个分组包含同一路由时只高亮最靠前的一项
export function findActiveNavIndex(pathname: string, items: NavLink[]): number {
  return items.findIndex((item) => isNavItemActive(pathname, item));
}

// 判断是否为浏览器外部协议链接：外链、邮件与电话均交由浏览器处理
export function isExternalNavHref(href: string): boolean {
  return /^(https?:|mailto:|tel:)/i.test(href);
}
