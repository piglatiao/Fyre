import { BarChart3, CalendarDays, Clock, Eye, FileText, FolderOpen, Tag, Type } from "lucide-react";
import { formatDate } from "@/lib/format-date";
import type { SiteStats } from "@/types/site-stats";
import WidgetCard from "./widget-card";

// 运行天数：按建站日期（回退为最近更新时间）计算
function resolveRunningDays(startDate: string, fallback: Date | null): number | null {
  const start = startDate ? new Date(`${startDate}T00:00:00+08:00`) : fallback;
  if (!start || Number.isNaN(start.getTime())) {
    return null;
  }
  const days = Math.floor((Date.now() - start.getTime()) / 86400000);
  return days >= 0 ? days : null;
}

// 站点统计：文章、分类、标签、阅读量与运行天数
export default function SiteStatsCard({
  stats,
  startDate,
  delay = 50,
}: {
  stats: SiteStats;
  startDate: string;
  delay?: number;
}) {
  const runningDays = resolveRunningDays(startDate, stats.latestUpdatedAt);
  const rows = [
    { key: "posts", label: "文章", icon: FileText, value: String(stats.publishedCount) },
    { key: "categories", label: "分类", icon: FolderOpen, value: String(stats.categoryCount) },
    { key: "tags", label: "标签", icon: Tag, value: String(stats.tagCount) },
    { key: "words", label: "总字数", icon: Type, value: stats.totalWords.toLocaleString("en-US") },
    { key: "views", label: "阅读", icon: Eye, value: String(stats.totalViews) },
    ...(runningDays === null
      ? []
      : [{ key: "days", label: "运行天数", icon: Clock, value: `${runningDays} 天` }]),
  ];

  return (
    <WidgetCard title="站点统计" delay={delay}>
      <div className="flex flex-col gap-1">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.key} className="flex items-center justify-between rounded-lg px-3 py-2">
              <div className="flex items-center gap-2.5">
                <span className="text-lg text-(--primary)">
                  <Icon aria-hidden className="size-4.5" />
                </span>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{row.label}</span>
              </div>
              <span className="max-w-[55%] truncate text-right text-xs font-bold">{row.value}</span>
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
}