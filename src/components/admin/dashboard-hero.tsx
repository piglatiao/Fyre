import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Eye, FileEdit, FileText, ImageIcon } from "lucide-react";
import { formatDate } from "@/lib/format-date";
import { formatUptime } from "@/lib/system-info";
import DashboardLiveClock from "./dashboard-live-clock";

// 按 Asia/Shanghai 时间生成问候语
function buildGreeting(): string {
  const hourPart = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(new Date())
    .find((part) => part.type === "hour")?.value;
  const hour = Number(hourPart ?? "0");
  if (hour < 6) {
    return "夜深了";
  }
  if (hour < 11) {
    return "早上好";
  }
  if (hour < 14) {
    return "中午好";
  }
  if (hour < 18) {
    return "下午好";
  }
  return "晚上好";
}

// 仪表盘头部：站点状态、问候、概览指标、实时时钟与快捷操作
export default function DashboardHero({
  siteName,
  siteDescription,
  summary,
  quickLinks,
}: {
  siteName: string;
  siteDescription: string;
  summary: { posts: number; views: number; media: number; pages: number; uptimeSeconds: number };
  quickLinks: { href: string; label: string; icon: LucideIcon; primary: boolean }[];
}) {
  return (
    <section className="admin-hero">
      <div className="admin-hero-grid" aria-hidden />
      <span className="admin-hero-orb admin-hero-orb-a" aria-hidden />
      <span className="admin-hero-orb admin-hero-orb-b" aria-hidden />
      <div className="relative flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="admin-live-dot" aria-hidden />
            <span className="font-medium text-(--primary)">站点运行中</span>
            <span className="opacity-40">·</span>
            <span>
              {buildGreeting()} · {formatDate(new Date())}
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            {siteName}
            <span className="mx-2 text-(--primary)">·</span>
            创作中心
          </h1>
          <p className="mt-2 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">{siteDescription}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="admin-chip">
              <FileText className="size-3.5" aria-hidden />
              文章 <strong>{summary.posts}</strong>
            </span>
            <span className="admin-chip">
              <Eye className="size-3.5" aria-hidden />
              阅读 <strong>{summary.views}</strong>
            </span>
            <span className="admin-chip">
              <ImageIcon className="size-3.5" aria-hidden />
              媒体 <strong>{summary.media}</strong>
            </span>
            <span className="admin-chip">
              <FileEdit className="size-3.5" aria-hidden />
              页面 <strong>{summary.pages}</strong>
            </span>
            <span className="admin-chip">
              已运行 <strong>{formatUptime(summary.uptimeSeconds)}</strong>
            </span>
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <DashboardLiveClock />
          <div className="flex flex-wrap gap-2">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  item.primary
                    ? "admin-quick-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium"
                    : "admin-quick-ghost inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm"
                }
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
