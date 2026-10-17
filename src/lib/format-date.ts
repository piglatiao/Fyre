// 统一按 Asia/Shanghai 展示时间（数据库以 UTC 存储）
const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const yearFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
});

// en-CA 的日期格式即为 YYYY-MM-DD，直接作为日历分组键
const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const monthDayFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  month: "2-digit",
  day: "2-digit",
});

// 格式化为「2026年10月16日」
export function formatDate(date: Date): string {
  return dateTimeFormatter.format(date);
}

// 提取 Asia/Shanghai 时区下的年份（归档分组使用；zh-CN 会输出「2026年」，因此按分段取值）
export function formatYear(date: Date): number {
  const yearPart = yearFormatter.formatToParts(date).find((part) => part.type === "year");
  return yearPart ? Number(yearPart.value) : date.getUTCFullYear();
}

// 格式化为 Asia/Shanghai 时区下的 YYYY-MM-DD（侧栏日历按天分组使用）
export function formatDateKey(date: Date): string {
  return dateKeyFormatter.format(date);
}

// 格式化为「10-16」（归档时间线使用）
export function formatMonthDay(date: Date): string {
  const parts = monthDayFormatter.formatToParts(date);
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  return `${month}-${day}`;
}
