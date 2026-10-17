import type { NavLinkChild } from "./nav-link-child";

// 站点导航链接配置项：children 非空时渲染为下拉分组
export interface NavLink {
  label: string;
  href: string;
  children?: NavLinkChild[];
}
