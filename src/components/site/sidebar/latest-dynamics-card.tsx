import { Clock, Pin } from "lucide-react";
import Link from "next/link";
import { formatDateTimeSeconds } from "@/lib/dynamic-time";
import type { DynamicEntry } from "@/types/dynamic-entry";
import WidgetCard from "./widget-card";

// 摘要：把渲染后的 HTML 去掉标签并截断，用于侧栏两行预览
function toSummary(html: string, maxLength = 70): string {
  const plain = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > maxLength ? `${plain.slice(0, maxLength)}…` : plain;
}

// 最新动态卡（对齐官网右栏）：时间 + 置顶徽标 + 摘要，底部「更多动态」带计数
export default function LatestDynamicsCard({
  entries,
  total,
  delay = 0,
}: {
  entries: DynamicEntry[];
  total: number;
  delay?: number;
}) {
  if (entries.length === 0) {
    return null;
  }
  return (
    <WidgetCard title="最新动态" delay={delay}>
      <div className="flex flex-col">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="-mx-1 flex flex-col gap-1.5 rounded-lg px-3 py-3 transition hover:bg-black/5 dark:hover:bg-white/5"
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-black/35 dark:text-white/35">
              <span className="flex items-center gap-1">
                <Clock aria-hidden className="size-3.5" />
                {formatDateTimeSeconds(entry.publishedAt)}
              </span>
              {entry.pinned ? (
                <span className="flex items-center gap-0.5 rounded-md bg-(--btn-regular-bg) px-1.5 py-0.5 font-bold text-(--btn-content)">
                  <Pin aria-hidden className="size-3" />
                  置顶
                </span>
              ) : null}
              {entry.location ? <span className="text-black/30 dark:text-white/30">{entry.location}</span> : null}
            </div>
            <p className="text-90 line-clamp-2 text-sm">{toSummary(entry.html)}</p>
          </div>
        ))}
        <Link
          href="/dynamic"
          className="text-50 -mx-1 mt-1 flex items-center justify-center rounded-lg px-3 py-2.5 text-xs font-medium transition hover:bg-black/5 hover:text-(--primary) dark:hover:bg-white/5"
        >
          更多动态 · {total}
        </Link>
      </div>
    </WidgetCard>
  );
}