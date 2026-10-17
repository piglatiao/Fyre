"use client";

import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { findActiveNavIndex, isExternalNavHref, isNavHrefActive } from "@/lib/nav-active";
import type { NavLink } from "@/types/nav-link";
import NavIcon from "./nav-icon";

// 移动端抽屉菜单：从右侧滑出，点击链接、遮罩或按 Esc 关闭
export default function MobileNav({
  items,
  siteName,
  siteLogo,
}: {
  items: NavLink[];
  siteName: string;
  siteLogo: string;
}) {
  const [open, setOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<number[]>([]);
  const pathname = usePathname();
  const activeIndex = findActiveNavIndex(pathname, items);

  // 浏览器前进/后退时收起菜单；普通站内链接由点击处理器关闭
  useEffect(() => {
    function closeMenu(): void {
      setOpen(false);
      setExpandedGroups([]);
    }
    window.addEventListener("popstate", closeMenu);
    return () => window.removeEventListener("popstate", closeMenu);
  }, []);

  // 展开或收起移动端下拉分组
  function toggleGroup(index: number): void {
    setExpandedGroups((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index],
    );
  }

  // 打开时锁定页面滚动
  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="打开菜单"
        title="菜单"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="btn-plain h-11 w-11 rounded-lg"
      >
        <Menu aria-hidden className="size-5" />
      </button>

      {open
        ? createPortal(
        <div className="fixed inset-0 z-[90]">
          <button
            type="button"
            aria-label="关闭菜单"
            className="absolute inset-0 cursor-default bg-black/50 dark:bg-black/[0.62]"
            onClick={() => setOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="导航菜单"
            className="absolute inset-y-0 right-0 flex w-[70vw] max-w-[340px] flex-col overflow-hidden rounded-l-2xl border border-(--line-color) bg-white/55 shadow-2xl backdrop-blur-xl dark:bg-[#1e1e1e]/70"
          >
            <div className="flex shrink-0 items-center justify-between gap-[16px] pb-[12px] pl-[24px] pr-[16px] pt-[20px]">
              <span className="flex min-w-0 items-center gap-[16px] overflow-hidden text-[1.125rem] font-semibold">
                {siteLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- 站点标识由后台配置任意地址
                  <img src={siteLogo} alt="" className="size-6 shrink-0 object-contain" />
                ) : null}
                <span className="truncate">{siteName}</span>
              </span>
              <button
                type="button"
                aria-label="关闭菜单"
                onClick={() => setOpen(false)}
                className="btn-plain h-[40px] w-[40px] shrink-0 rounded-lg"
              >
                <X aria-hidden className="size-6" />
              </button>
            </div>
            <nav
              aria-label="移动端导航"
              className="flex flex-1 flex-col gap-[6px] overflow-y-auto overscroll-contain px-[12px] pb-[16px] pt-[8px]"
            >
              {items.map((item, index) => {
                const group = item.children && item.children.length > 0;
                const active = index === activeIndex;
                const expanded = expandedGroups.includes(index);
                const itemClass =
                  "flex h-[56px] w-full items-center justify-start gap-[16px] rounded-[14px] px-[16px] text-base font-medium leading-[1.25] transition-colors hover:bg-(--btn-plain-bg-hover) " +
                  (active ? "bg-(--btn-plain-bg-hover) text-(--primary)" : "");
                if (!group) {
                  return (
                    <Link
                      key={`${item.label}-${item.href}`}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={isNavHrefActive(pathname, item.href) ? "page" : undefined}
                      className={itemClass}
                    >
                      <NavIcon label={item.label} href={item.href} className="size-6 shrink-0" />
                      <span className="flex-1 truncate text-left">{item.label}</span>
                      <ChevronRight aria-hidden className="size-5 shrink-0" />
                    </Link>
                  );
                }
                return (
                  <div key={`${item.label}-${index}`}>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={`mobile-nav-group-${index}`}
                      onClick={() => toggleGroup(index)}
                      className={itemClass}
                    >
                      <NavIcon label={item.label} href={item.href} className="size-6 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown
                        aria-hidden
                        className={`size-5 shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                      />
                    </button>
                    <div
                      id={`mobile-nav-group-${index}`}
                      inert={!expanded}
                      aria-hidden={!expanded}
                      className={`mobile-nav-submenu grid transition-[grid-template-rows,opacity] duration-200 ${
                        expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <div className={`flex flex-col gap-[4px] ${expanded ? "mt-[4px]" : ""}`}>
                          {item.children?.map((child) => {
                            const childActive = isNavHrefActive(pathname, child.href);
                            const external = isExternalNavHref(child.href);
                            const className =
                              "flex h-[56px] items-center gap-[16px] rounded-[14px] pl-[52px] pr-[16px] text-base font-medium leading-[1.25] transition-colors hover:bg-(--btn-plain-bg-hover) " +
                              (childActive ? "bg-(--btn-plain-bg-hover) text-(--primary)" : "text-75");
                            const content = (
                              <>
                                <NavIcon label={child.label} href={child.href} className="size-6 shrink-0" />
                                <span className="truncate">{child.label}</span>
                              </>
                            );
                            return external ? (
                              <a
                                key={`${child.label}-${child.href}`}
                                href={child.href}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => setOpen(false)}
                                className={className}
                              >
                                {content}
                              </a>
                            ) : (
                              <Link
                                key={`${child.label}-${child.href}`}
                                href={child.href}
                                onClick={() => setOpen(false)}
                                aria-current={childActive ? "page" : undefined}
                                className={className}
                              >
                                {content}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>
          </aside>
        </div>,
        document.body,
      )
        : null}
    </div>
  );
}
