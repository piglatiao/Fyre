"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AdminNavLinks from "./admin-nav-links";

// 后台移动导航：左侧抽屉，支持遮罩、Esc、路由切换关闭并恢复触发按钮焦点
export default function AdminMobileNav() {
  const pathname = usePathname();
  const [openPathname, setOpenPathname] = useState<string | null>(null);
  const open = openPathname === pathname;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // 打开时锁定滚动、监听 Esc，并把焦点移入抽屉
  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpenPathname(null);
        triggerRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // 关闭抽屉并恢复菜单按钮焦点
  function closeDrawer(): void {
    setOpenPathname(null);
    triggerRef.current?.focus();
  }

  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-label="打开后台菜单"
        aria-expanded={open}
        aria-controls="admin-mobile-navigation"
        onClick={() => setOpenPathname(pathname)}
        className="inline-flex size-11 items-center justify-center rounded-xl text-zinc-600 transition hover:bg-(--btn-plain-bg-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--primary) dark:text-zinc-300"
      >
        <Menu aria-hidden className="size-5" />
      </button>

      {open
        ? createPortal(
            <div className="fixed inset-0 z-[100]">
              <button
                type="button"
                aria-label="关闭后台菜单"
                className="absolute inset-0 cursor-default bg-black/20 backdrop-blur-[2px] dark:bg-black/40"
                onClick={closeDrawer}
              />
              <aside
                id="admin-mobile-navigation"
                role="dialog"
                aria-modal="true"
                aria-label="后台导航"
                className="admin-sidebar absolute inset-y-0 left-0 flex w-[17.5rem] max-w-[85vw] flex-col rounded-r-2xl border-r p-3 shadow-2xl"
              >
                <div className="mb-3 flex h-12 items-center gap-2 border-b border-(--line-color) px-2">
                  <span aria-hidden className="admin-brand-dot size-5 shrink-0 rounded-full shadow-[0_0_12px_var(--primary)]" />
                  <span className="text-base font-bold tracking-tight">流萤</span>
                  <span className="rounded-md bg-(--btn-regular-bg) px-1.5 py-0.5 text-xs font-medium text-(--btn-content)">
                    后台
                  </span>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    aria-label="关闭后台菜单"
                    onClick={closeDrawer}
                    className="ml-auto inline-flex size-11 items-center justify-center rounded-xl transition hover:bg-(--btn-plain-bg-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--primary)"
                  >
                    <X aria-hidden className="size-5" />
                  </button>
                </div>
                <nav aria-label="后台移动导航" className="flex-1 space-y-1 overflow-y-auto">
                  <AdminNavLinks onNavigate={closeDrawer} />
                </nav>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
