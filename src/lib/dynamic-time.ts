// 动态时间展示：统一按 Asia/Shanghai 输出「yyyy-MM-dd HH:mm:ss」
const secondsFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

// 格式化为「2026-07-15 02:11:27」（zh-CN 会输出「2026/07/15 02:11:27」，统一替换为短横线日期）
export function formatDateTimeSeconds(date: Date): string {
  return secondsFormatter.format(date).replace(/\//g, "-");
}