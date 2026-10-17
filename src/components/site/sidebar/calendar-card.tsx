"use client";

import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import { requestJson } from "@/lib/api-client";
import { formatDateKey } from "@/lib/format-date";
import type { CalendarEntry } from "@/types/calendar-entry";

// 日历视图：日 → 月 → 年，点击标题逐级切换（与官网一致）
type CalendarView = "day" | "month" | "year";

// 中文月份与星期表头（与官网一致）
const MONTH_NAMES = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
const WEEK_DAYS = ["日", "一", "二", "三", "四", "五", "六"];
// 热力图色阶透明度：0 篇用底色，1~4 篇按档位加深（与官网一致）
const HEATMAP_OPACITY = [0, 0.45, 0.65, 0.85, 1];

// 数字补零（拼日期键）
function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

// 拆分 YYYY-MM-DD：直接取数字，避免再做时区换算
function parseDateKey(key: string): { year: number; month: number; day: number } {
  const [year, month, day] = key.split("-").map((part) => Number.parseInt(part, 10));
  return { year, month: month - 1, day };
}

// 列表右侧日期：按官网取值输出「M-D」
function shortMonthDay(key: string): string {
  const { month, day } = parseDateKey(key);
  return month + 1 + "-" + day;
}

// 侧栏日历卡：月历 + 年度热力图 + 当月/当日文章列表（数据来自 /api/posts/calendar）
export default function CalendarCard({ delay = 150 }: { delay?: number }) {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<CalendarView>("day");
  const [today, setToday] = useState({ year: 1970, month: 0, day: 1 });
  const [displayYear, setDisplayYear] = useState(1970);
  const [displayMonth, setDisplayMonth] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  // 提示框挂到 body：卡片带 transform（入场动画），fixed 定位会以卡片为参照而错位
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 首屏：按 Asia/Shanghai 定位到当天所在月份，再拉取文章日期数据
  useEffect(() => {
    let cancelled = false;
    const todayParts = parseDateKey(formatDateKey(new Date()));
    setToday(todayParts);
    setDisplayYear(todayParts.year);
    setDisplayMonth(todayParts.month);
    setReady(true);
    void (async () => {
      const result = await requestJson<CalendarEntry[]>("/api/posts/calendar");
      if (!cancelled && result.ok) {
        setEntries(result.data);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 按日期分组的文章（格子计数与当日列表共用）
  const dateMap = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const entry of entries) {
      const list = map.get(entry.date);
      if (list) {
        list.push(entry);
      } else {
        map.set(entry.date, [entry]);
      }
    }
    return map;
  }, [entries]);

  // 当月文章（未选中具体某天时展示）
  const monthPosts = useMemo(() => {
    const prefix = displayYear + "-" + pad2(displayMonth + 1);
    return entries.filter((entry) => entry.date.startsWith(prefix)).sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [entries, displayYear, displayMonth]);

  // 当年有文章的月份与年份（月视图圆点、年份选项）
  const monthsWithPosts = useMemo(() => {
    const set = new Set<number>();
    for (const entry of entries) {
      const parts = parseDateKey(entry.date);
      if (parts.year === displayYear) {
        set.add(parts.month);
      }
    }
    return set;
  }, [entries, displayYear]);

  const yearOptions = useMemo(() => {
    const withPosts = new Set<number>();
    for (const entry of entries) {
      withPosts.add(parseDateKey(entry.date).year);
    }
    withPosts.add(today.year);
    return [...withPosts].sort((a, b) => b - a).map((year) => ({ year, hasPost: entries.some((entry) => parseDateKey(entry.date).year === year) }));
  }, [entries, today.year]);

  // 当月格子：前置空白补齐星期，逐天统计文章数
  const dayCells = useMemo(() => {
    const firstWeekday = new Date(displayYear, displayMonth, 1).getDay();
    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    const cells: { day: number | null; dateKey: string; count: number }[] = [];
    for (let index = 0; index < firstWeekday; index += 1) {
      cells.push({ day: null, dateKey: "", count: 0 });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = displayYear + "-" + pad2(displayMonth + 1) + "-" + pad2(day);
      cells.push({ day, dateKey, count: dateMap.get(dateKey)?.length ?? 0 });
    }
    return cells;
  }, [displayYear, displayMonth, dateMap]);

  // 热力图：当年 12 个月 × 4 周（每 7 天折算一周，与官网一致）
  const heatmap = useMemo(() => {
    const data = Array.from({ length: 12 }, () => [0, 0, 0, 0]);
    for (const entry of entries) {
      const parts = parseDateKey(entry.date);
      if (parts.year !== displayYear) {
        continue;
      }
      data[parts.month][Math.min(Math.floor((parts.day - 1) / 7), 3)] += 1;
    }
    return data;
  }, [entries, displayYear]);

  const listedPosts = selectedDate ? (dateMap.get(selectedDate) ?? []) : monthPosts;

  // 上一月/上一年：年视图不响应（按钮隐藏）
  function step(delta: number): void {
    if (view === "day") {
      const next = displayMonth + delta;
      if (next > 11) {
        setDisplayMonth(0);
        setDisplayYear(displayYear + 1);
      } else if (next < 0) {
        setDisplayMonth(11);
        setDisplayYear(displayYear - 1);
      } else {
        setDisplayMonth(next);
      }
      setSelectedDate(null);
      return;
    }
    if (view === "month") {
      setDisplayYear(displayYear + delta);
    }
  }

  // 回到今天
  function resetToToday(): void {
    setDisplayYear(today.year);
    setDisplayMonth(today.month);
    setSelectedDate(null);
    setView("day");
  }

  // 标题点击：日 → 月 → 年
  function stepView(): void {
    setView(view === "day" ? "month" : "year");
  }

  // 点击某天：只有当天有文章才响应；再次点击同一天取消选中
  function selectDay(dateKey: string, count: number): void {
    if (count <= 0) {
      return;
    }
    setSelectedDate(selectedDate === dateKey ? null : dateKey);
  }

  // 热力图悬停提示：跟随格子显示「N月第W周，C篇文章」
  function showTooltip(event: ReactMouseEvent<HTMLDivElement>, month: number, week: number, count: number): void {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      text: month + 1 + "月第" + (week + 1) + "周，" + count + "篇文章",
      x: rect.left + rect.width / 2,
      y: rect.top - 28,
    });
  }

  const monthCellClass =
    "relative cursor-pointer rounded-sm p-2 text-center text-sm transition-colors hover:bg-(--btn-plain-bg-hover)";
  const todayKey = ready ? today.year + "-" + pad2(today.month + 1) + "-" + pad2(today.day) : "";

  return (
    <section className="card-base onload-animation rounded-(--radius-large) pb-4" style={{ animationDelay: delay + "ms" }}>
      <h2 className="sr-only">日历</h2>
      <div className="px-4 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            aria-label="上一月"
            onClick={() => step(-1)}
            className="btn-plain h-8 w-8 rounded-lg transition-colors hover:bg-(--btn-plain-bg-hover)"
            hidden={view === "year"}
          >
            <ChevronLeft aria-hidden className="size-4" />
          </button>
          <button
            type="button"
            onClick={stepView}
            className="text-lg font-bold text-neutral-900 transition-colors select-none hover:text-(--primary) dark:text-neutral-100"
          >
            {view === "day" ? displayYear + "年" + MONTH_NAMES[displayMonth] : view === "month" ? displayYear + "年" : "年"}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="回到今天"
              onClick={resetToToday}
              hidden={view === "day" && displayYear === today.year && displayMonth === today.month}
              className="btn-plain h-8 w-8 rounded-lg transition-colors hover:bg-(--btn-plain-bg-hover)"
            >
              <RotateCcw aria-hidden className="size-4" />
            </button>
            <button
              type="button"
              aria-label="下一月"
              onClick={() => step(1)}
              className="btn-plain h-8 w-8 rounded-lg transition-colors hover:bg-(--btn-plain-bg-hover)"
              hidden={view === "year"}
            >
              <ChevronRight aria-hidden className="size-4" />
            </button>
          </div>
        </div>

        {view === "day" ? (
          <>
            <div className="weekdays mb-2 grid grid-cols-7 gap-1">
              {WEEK_DAYS.map((label) => (
                <div key={label} className="text-center text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  {label}
                </div>
              ))}
            </div>
            <div id="calendar-grid" className="grid grid-cols-7 gap-1 pb-1">
              {dayCells.map((cell, index) =>
                cell.day === null ? (
                  <div key={"blank-" + index} className="calendar-day flex aspect-square items-center justify-center rounded-sm text-sm" />
                ) : (
                  <div
                    key={cell.dateKey}
                    data-date={cell.dateKey}
                    data-has-post={cell.count > 0}
                    onClick={() => selectDay(cell.dateKey, cell.count)}
                    className={
                      "calendar-day relative flex aspect-square items-center justify-center rounded-sm text-sm " +
                      (cell.count > 0
                        ? "cursor-pointer font-bold text-neutral-900 dark:text-neutral-100"
                        : "text-neutral-700 dark:text-neutral-300") +
                      (cell.dateKey === todayKey ? " ring-2 ring-(--primary)" : "") +
                      (cell.dateKey === selectedDate ? " calendar-day-selected" : "")
                    }
                  >
                    {cell.day}
                    {cell.count > 0 ? (
                      <span className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-(--primary)" />
                    ) : null}
                    {cell.count > 1 ? (
                      <span className="absolute top-0 right-0 text-[10px] font-bold text-(--primary)">{cell.count}</span>
                    ) : null}
                  </div>
                ),
              )}
            </div>

            <div className="mb-2">
              <div className="heatmap-months mb-1 grid gap-0.5" style={{ gridTemplateColumns: "repeat(12, 1fr)" }}>
                {MONTH_NAMES.map((name) => (
                  <span key={name} className="text-center text-[10px] text-neutral-400 dark:text-neutral-500">
                    {name.replace("月", "")}
                  </span>
                ))}
              </div>
              <div
                className="heatmap-grid grid"
                style={{ gridTemplateColumns: "repeat(12, 1fr)", gridTemplateRows: "repeat(4, 1fr)", rowGap: "0.125rem" }}
              >
                {[0, 1, 2, 3].map((week) =>
                  MONTH_NAMES.map((name, month) => {
                    const count = heatmap[month][week];
                    const level = Math.min(count, 4);
                    return (
                      <div
                        key={name + "-" + week}
                        role="presentation"
                        className="heatmap-cell rounded-sm"
                        style={{
                          backgroundColor: count === 0 ? "var(--btn-plain-bg-hover)" : "var(--primary)",
                          opacity: count === 0 ? 1 : HEATMAP_OPACITY[level],
                        }}
                        onClick={() => {
                          setDisplayMonth(month);
                          setSelectedDate(null);
                          setView("day");
                        }}
                        onMouseEnter={(event) => showTooltip(event, month, week, count)}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  }),
                )}
              </div>
            </div>
          </>
        ) : view === "month" ? (
          <div className="grid grid-cols-3 gap-2">
            {MONTH_NAMES.map((name, index) => (
              <div
                key={name}
                onClick={() => {
                  setDisplayMonth(index);
                  setSelectedDate(null);
                  setView("day");
                }}
                className={
                  monthCellClass +
                  (index === displayMonth ? " bg-(--btn-plain-bg-hover) font-bold text-(--primary)" : " text-neutral-700 dark:text-neutral-300")
                }
              >
                {name}
                {monthsWithPosts.has(index) ? (
                  <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-(--primary)" />
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {yearOptions.map((option) => (
              <div
                key={option.year}
                onClick={() => {
                  setDisplayYear(option.year);
                  setView("month");
                }}
                className={
                  monthCellClass +
                  (option.year === displayYear ? " bg-(--btn-plain-bg-hover) font-bold text-(--primary)" : " text-neutral-700 dark:text-neutral-300")
                }
              >
                {option.year}
                {option.hasPost ? (
                  <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-(--primary)" />
                ) : null}
              </div>
            ))}
          </div>
        )}

        {view === "day" && listedPosts.length > 0 ? (
          <div className="mt-3">
            <div className="mb-2 border-t border-neutral-200 dark:border-neutral-700" />
            <div className="custom-scrollbar flex max-h-48 flex-col gap-1 overflow-y-auto">
              {listedPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={"/posts/" + post.slug}
                  className="flex items-center justify-between rounded-sm px-2 py-1 text-sm text-neutral-700 transition-colors hover:bg-(--btn-plain-bg-hover) hover:text-(--primary) dark:text-neutral-300 dark:hover:text-(--primary)"
                >
                  <span className="truncate">{post.title}</span>
                  <span className="ml-2 text-xs whitespace-nowrap text-neutral-500 dark:text-neutral-400">
                    {shortMonthDay(post.date)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      {mounted && tooltip
        ? createPortal(
            <div
              className="pointer-events-none fixed z-[9999] -translate-x-1/2 rounded-md bg-black/80 px-2 py-1 text-xs whitespace-nowrap text-white shadow-md"
              style={{ left: tooltip.x, top: tooltip.y }}
            >
              {tooltip.text}
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
