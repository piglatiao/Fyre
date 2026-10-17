import { Cpu, Database, HardDrive, Server, Timer } from "lucide-react";
import { formatBytes } from "@/lib/format-bytes";
import { formatUptime } from "@/lib/system-info";
import type { DashboardSystemInfo } from "@/types/dashboard-system-info";

// 运行状态：运行时、内存与存储占用的实时概览（每次请求服务端采集）
export default function DashboardStatusPanel({ info }: { info: DashboardSystemInfo }) {
  // 内存进度条以 2GB 作为可视化参考上限，仅用于展示占用趋势
  const memoryPercent = Math.min(100, Math.round((info.memoryRssBytes / (2 * 1024 * 1024 * 1024)) * 100));
  const rows = [
    { icon: Server, label: "Node 运行时", value: "v" + info.nodeVersion, hint: info.platform, meter: undefined as number | undefined },
    { icon: Timer, label: "运行时长", value: formatUptime(info.uptimeSeconds), hint: "自最近一次启动", meter: undefined as number | undefined },
    {
      icon: Cpu,
      label: "内存占用",
      value: formatBytes(info.memoryRssBytes),
      hint: "常驻内存 · 参考上限 2 GB",
      meter: memoryPercent,
    },
    { icon: Database, label: "数据库大小", value: formatBytes(info.databaseBytes), hint: "数据 + 索引", meter: undefined as number | undefined },
    { icon: HardDrive, label: "媒体库占用", value: formatBytes(info.mediaBytes), hint: info.mediaFiles + " 个文件", meter: undefined as number | undefined },
  ];

  return (
    <section className="admin-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="admin-live-dot" aria-hidden />
          <h2 className="text-sm font-semibold">运行状态</h2>
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">打开页面时实时采集</span>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl border border-(--line-color) bg-(--card-bg) p-3.5">
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <row.icon className="size-4 text-(--primary)" aria-hidden />
              {row.label}
            </div>
            <p className="mt-2 text-lg font-semibold tabular-nums">{row.value}</p>
            <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">{row.hint}</p>
            {typeof row.meter === "number" ? (
              <div className="admin-meter mt-2">
                <span style={{ width: row.meter + "%" }} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
