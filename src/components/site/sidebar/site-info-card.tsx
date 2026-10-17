import { CalendarDays, Copyright, Layers, Rocket } from "lucide-react";
import { formatDate } from "@/lib/format-date";
import type { SiteStats } from "@/types/site-stats";
import WidgetCard from "./widget-card";

// 站点信息：构建平台、博客版本、文章许可与最后更新时间
export default function SiteInfoCard({ stats, delay = 100 }: { stats: SiteStats; delay?: number }) {
  const rows = [
    { key: "platform", label: "构建平台", icon: Rocket, value: "Next.js 16" },
    { key: "version", label: "博客版本", icon: Layers, value: "1.0.0" },
    { key: "license", label: "文章许可", icon: Copyright, value: "CC BY-NC-SA 4.0" },
    {
      key: "updated",
      label: "最后更新",
      icon: CalendarDays,
      value: stats.latestUpdatedAt ? formatDate(stats.latestUpdatedAt) : "暂无",
    },
  ];

  return (
    <WidgetCard title="站点信息" delay={delay}>
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
              <span className="max-w-[55%] truncate text-right text-xs font-bold" title={row.value}>
                {row.value}
              </span>
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
}