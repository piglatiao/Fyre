"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { findActiveNavIndex } from "@/lib/nav-active";
import type { NavLink } from "@/types/nav-link";
import NavIcon from "./nav-icon";
import SiteNavDropdown from "./site-nav-dropdown";

// 前台主导航（桌面端按钮式导航项；导航项由后台设置驱动）
export default function SiteNav({ items }: { items: NavLink[] }) {
  const pathname = usePathname();
  const activeIndex = findActiveNavIndex(pathname, items);

  return (
    <nav aria-label="主导航" className="hidden items-center gap-1 lg:flex lg:justify-center">
      {items.map((item, index) => {
        if (item.children && item.children.length > 0) {
          return (
            <SiteNavDropdown
              key={`${item.label}-${item.href}`}
              item={item}
              active={index === activeIndex}
            />
          );
        }
        const active = index === activeIndex;
        return (
          <Link
            key={`${item.label}-${item.href}`}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              "btn-plain h-10 gap-1.5 rounded-lg px-4 font-bold active:scale-95 " +
              (active ? "bg-(--btn-plain-bg-hover) text-(--primary)" : "")
            }
          >
            <NavIcon
              label={item.label}
              href={item.href}
              className="mr-1.5 hidden size-4 shrink-0 xl:block"
            />
            <span className="whitespace-nowrap">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
