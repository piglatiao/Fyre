import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { DashboardModuleItem } from "@/types/dashboard-module-item";

// 仪表盘内容模块入口：数量、说明与跳转集中展示
export default function DashboardModuleGrid({ items }: { items: DashboardModuleItem[] }) {
  return (
    <section className="admin-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">内容模块</h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">动态、作品与站点运营数据</p>
        </div>
        <Link
          href="/admin/settings"
          className="text-xs text-sky-600 transition hover:text-sky-700 dark:text-sky-400"
        >
          管理站点
        </Link>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative overflow-hidden rounded-2xl border border-(--line-color) bg-(--card-bg)/55 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-(--primary)/35 hover:shadow-[0_18px_34px_-26px_var(--primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--primary)"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -top-8 -right-8 size-24 rounded-full bg-(--primary)/10 blur-2xl transition duration-300 group-hover:bg-(--primary)/20"
              />
              <span className="relative flex items-center justify-between gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-(--btn-regular-bg) text-(--btn-content) shadow-inner">
                  <Icon className="size-4.5" aria-hidden />
                </span>
                <span className="flex items-center gap-1.5">
                  <strong className="text-2xl font-bold tracking-tight tabular-nums">{item.value}</strong>
                  <ChevronRight
                    aria-hidden
                    className="size-4 text-zinc-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-(--primary)"
                  />
                </span>
              </span>
              <span className="relative mt-4 block">
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="mt-1 block truncate text-xs text-zinc-500 dark:text-zinc-400">{item.detail}</span>
              </span>
              <span
                aria-hidden
                className="absolute inset-x-4 bottom-0 h-px bg-linear-to-r from-transparent via-(--primary)/40 to-transparent opacity-0 transition group-hover:opacity-100"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
