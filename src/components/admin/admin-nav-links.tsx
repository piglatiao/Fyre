"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "@/lib/admin-navigation";

// 后台导航链接：按当前路径高亮，可复用于侧栏与移动抽屉
export default function AdminNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {ADMIN_NAV_ITEMS.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "admin-nav-active flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--primary)"
                : "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-600 transition hover:bg-(--btn-plain-bg-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--primary) dark:text-zinc-300"
            }
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
