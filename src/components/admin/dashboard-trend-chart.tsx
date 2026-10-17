"use client";

import { useState } from "react";
import type { DashboardTrendPoint } from "@/types/dashboard-trend-point";

// 逻辑画布尺寸：宽高只用于生成路径坐标，渲染时由容器拉伸（preserveAspectRatio="none"），
// 所有文字标签改用 HTML 绝对定位，避免随 svg 拉伸而变形
const VIEW_W = 720;
const VIEW_H = 200;
const PAD_TOP = 16;
const PAD_BOTTOM = 10;
// 有发布的天的最小高度比例，保证单篇发布也清晰可见
const MIN_RATIO = 0.08;

// 生成折线路径：单调三次插值（Fritsch–Carlson / PCHIP）。
// 不能用普通贝塞尔平滑：30 天里只有一天有发布时，普通平滑会把峰值摊成相邻好几天的缓坡，读数失真
function buildLinePath(xs: number[], ys: number[]): string {
  const count = xs.length;
  if (count === 0) {
    return "";
  }
  if (count === 1) {
    return `M ${xs[0]} ${ys[0]}`;
  }
  const dx: number[] = [];
  const slope: number[] = [];
  for (let index = 0; index < count - 1; index += 1) {
    const step = xs[index + 1] - xs[index];
    dx.push(step);
    slope.push(step === 0 ? 0 : (ys[index + 1] - ys[index]) / step);
  }
  // 端点切线取相邻斜率；内部点在同号斜率间取加权调和平均，异号（极值点）取 0，保证不过冲
  const tangent = new Array<number>(count).fill(0);
  tangent[0] = slope[0];
  tangent[count - 1] = slope[count - 2];
  for (let index = 1; index < count - 1; index += 1) {
    if (slope[index - 1] * slope[index] <= 0) {
      tangent[index] = 0;
      continue;
    }
    const w1 = 2 * dx[index] + dx[index - 1];
    const w2 = dx[index] + 2 * dx[index - 1];
    tangent[index] = (w1 + w2) / (w1 / slope[index - 1] + w2 / slope[index]);
  }
  let path = `M ${xs[0]} ${ys[0]}`;
  for (let index = 0; index < count - 1; index += 1) {
    const step = dx[index];
    path += ` C ${xs[index] + step / 3} ${ys[index] + (tangent[index] * step) / 3}, ${xs[index + 1] - step / 3} ${ys[index + 1] - (tangent[index + 1] * step) / 3}, ${xs[index + 1]} ${ys[index + 1]}`;
  }
  return path;
}

// 发布趋势图：平滑面积图 + 悬停读数，颜色全部来自主题令牌（跟随后台色相配置）
export default function DashboardTrendChart({ points }: { points: DashboardTrendPoint[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const max = Math.max(1, ...points.map((point) => point.count));
  const total = points.reduce((sum, point) => sum + point.count, 0);
  const activeDays = points.filter((point) => point.count > 0).length;
  const isEmpty = total === 0;

  const innerH = VIEW_H - PAD_TOP - PAD_BOTTOM;
  const xs = points.map((_, index) =>
    points.length > 1 ? (index * VIEW_W) / (points.length - 1) : VIEW_W / 2,
  );
  const ys = points.map((point) =>
    PAD_TOP + innerH * (1 - (point.count > 0 ? Math.max(MIN_RATIO, point.count / max) : 0)),
  );
  const linePath = buildLinePath(xs, ys);
  const areaPath = linePath
    ? `${linePath} L ${xs[xs.length - 1]} ${VIEW_H} L ${xs[0]} ${VIEW_H} Z`
    : "";

  const active = activeIndex === null ? null : points[activeIndex];
  const activeLeft = activeIndex === null ? 0 : (xs[activeIndex] / VIEW_W) * 100;
  const activeTop = activeIndex === null ? 0 : (ys[activeIndex] / VIEW_H) * 100;
  const middleLabel = points.length > 2 ? points[Math.floor((points.length - 1) / 2)]?.label : "";

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          近 {points.length} 天发布{" "}
          <span className="font-semibold text-zinc-700 dark:text-zinc-200">{total}</span> 篇
        </p>
        <p className="text-xs text-zinc-400">
          有更新 {activeDays} 天 · 峰值 {max} 篇/天
        </p>
      </div>

      <div className="relative mt-4 h-40">
        {/* 纵向留白用于放置 tooltip，图表本体只占容器下半部分 */}
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 h-[86%] w-full overflow-visible"
          aria-hidden
        >
          <defs>
            <linearGradient id="dashboard-trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.36" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* 参考线：25% / 50% / 75% 与基线 */}
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1={0}
              x2={VIEW_W}
              y1={PAD_TOP + innerH * ratio}
              y2={PAD_TOP + innerH * ratio}
              stroke="var(--line-divider)"
              strokeWidth={1}
              strokeDasharray="4 6"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <line
            x1={0}
            x2={VIEW_W}
            y1={VIEW_H}
            y2={VIEW_H}
            stroke="var(--line-color)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          {areaPath ? <path d={areaPath} fill="url(#dashboard-trend-fill)" /> : null}
          {linePath ? (
            <path
              d={linePath}
              fill="none"
              stroke="var(--primary)"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>

        {/* 悬停引导线 + 数据点 */}
        {active ? (
          <>
            <div
              className="pointer-events-none absolute bottom-0 w-px bg-(--line-color)"
              style={{ left: `${activeLeft}%`, height: "86%" }}
            />
            <div
              className="pointer-events-none absolute z-10 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2"
              style={{
                left: `${activeLeft}%`,
                top: `${(86 * activeTop) / 100}%`,
                background: "var(--primary)",
                // 圆点描边跟随卡片背景，暗色模式下同样成立
                boxShadow: "0 0 0 2px var(--card-bg)",
              }}
            />
          </>
        ) : null}

        {/* 悬停热区：整列都可触发，避免相邻列之间出现空隙导致闪烁 */}
        <div className="absolute bottom-0 flex h-[86%] w-full">
          {points.map((point, index) => (
            <div
              key={point.label}
              className="h-full flex-1"
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex((current) => (current === index ? null : current))}
            />
          ))}
        </div>

        {isEmpty ? (
          <p className="pointer-events-none absolute inset-x-0 bottom-8 text-center text-xs text-zinc-400">
            近 {points.length} 天还没有发布
          </p>
        ) : null}

        {/* 悬停读数 */}
        {active ? (
          <div
            className="pointer-events-none absolute top-0 z-20 -translate-x-1/2 rounded-lg border border-(--line-color) bg-(--card-bg) px-2.5 py-1 text-xs whitespace-nowrap shadow-md"
            style={{ left: `${Math.min(94, Math.max(6, activeLeft))}%` }}
          >
            <span className="text-zinc-500 dark:text-zinc-400">{active.label}</span>
            <span className="ml-2 font-semibold tabular-nums text-sky-600 dark:text-sky-400">
              {active.count} 篇
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex justify-between text-xs text-zinc-400">
        <span>{points[0]?.label}</span>
        {middleLabel ? <span>{middleLabel}</span> : null}
        <span>今天</span>
      </div>
    </div>
  );
}