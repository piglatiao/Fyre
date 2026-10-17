import type { LucideIcon } from "lucide-react";

// 迷你走势线：把最近数天的计数归一化为折线路径（viewBox 100 x 30）
function buildSparkPath(values: number[]): string {
  if (values.length < 2) {
    return "";
  }
  const max = Math.max(1, ...values);
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 28 - (value / max) * 24;
      return (index === 0 ? "M " : "L ") + x.toFixed(2) + " " + y.toFixed(2);
    })
    .join(" ");
}

// 仪表盘数据卡片：主题色图标、数值、可选迷你走势与徽标
export default function DashboardStatCard({
  icon: Icon,
  label,
  value,
  hint,
  spark,
  badge,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  hint?: string;
  spark?: number[];
  badge?: { text: string; tone: "up" | "flat" };
}) {
  const sparkPath = spark ? buildSparkPath(spark) : "";

  return (
    <div className="admin-stat-card group">
      <div className="relative flex items-start justify-between gap-3">
        <span className="admin-stat-icon">
          <Icon className="size-5" aria-hidden />
        </span>
        {badge ? (
          <span className={badge.tone === "up" ? "admin-stat-badge up" : "admin-stat-badge"}>{badge.text}</span>
        ) : null}
      </div>
      <p className="relative mt-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="relative mt-1 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
      {sparkPath ? (
        <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="admin-sparkline" aria-hidden>
          <path
            d={sparkPath}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      ) : null}
      {hint ? <p className="relative mt-2 truncate text-xs text-zinc-500 dark:text-zinc-400">{hint}</p> : null}
    </div>
  );
}
