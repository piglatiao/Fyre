"use client";

import { ArrowUpRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { isExternalNavHref, isNavHrefActive } from "@/lib/nav-active";
import type { NavLink } from "@/types/nav-link";
import NavIcon from "./nav-icon";

// 桌面端导航下拉分组：支持悬停、键盘焦点、点击与 Esc 关闭
export default function SiteNavDropdown({ item, active }: { item: NavLink; active: boolean }) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  // 路由变化后收起菜单
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // 打开时监听外部点击与 Esc
  useEffect(() => {
    if (!open) {
      return;
    }
    function handlePointerDown(event: PointerEvent): void {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onFocus={() => setOpen(true)}
        className={
          "btn-plain h-10 relative gap-1.5 rounded-lg pr-8 pl-4 font-bold active:scale-95 " +
          (active ? "bg-(--btn-plain-bg-hover) text-(--primary)" : "")
        }
      >
        <NavIcon
          label={item.label}
          href={item.href}
          className="mr-1.5 hidden size-4 shrink-0 xl:block"
        />
        <span className="whitespace-nowrap">{item.label}</span>
        <ChevronDown
          aria-hidden
          className={`absolute top-1/2 right-2.5 size-4 -translate-y-1/2 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className="nav-dropdown-menu absolute top-full left-0 z-50 pt-2"
        data-open={open}
        inert={!open}
        aria-hidden={!open}
      >
        <div className="float-panel min-w-48 rounded-(--radius-large) border border-black/5 p-2 dark:border-white/10">
          {item.children?.map((child) => {
            const childActive = isNavHrefActive(pathname, child.href);
            const external = isExternalNavHref(child.href);
            const className =
              "flex h-10 w-full items-center justify-start gap-3 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors hover:bg-(--btn-plain-bg-hover) active:scale-95 " +
              (childActive ? "bg-(--btn-plain-bg-hover) text-(--primary)" : "text-75");
            const content = (
              <>
                <NavIcon label={child.label} href={child.href} className="size-4 shrink-0" />
                <span>{child.label}</span>
                {external ? (
                  <ArrowUpRight aria-hidden className="ml-auto size-3 text-30" />
                ) : null}
              </>
            );
            return external ? (
              <a
                key={`${child.label}-${child.href}`}
                href={child.href}
                target="_blank"
                rel="noreferrer"
                tabIndex={open ? 0 : -1}
                className={className}
                onClick={() => setOpen(false)}
              >
                {content}
              </a>
            ) : (
              <Link
                key={`${child.label}-${child.href}`}
                href={child.href}
                tabIndex={open ? 0 : -1}
                aria-current={childActive ? "page" : undefined}
                className={className}
                onClick={() => setOpen(false)}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
