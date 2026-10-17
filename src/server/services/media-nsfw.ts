import type { MediaNsfwMode } from "@/types/media-nsfw-mode";

// 三类收藏源共用的敏感内容关键词，命中后仅标记，不直接删除条目
const NSFW_KEYWORDS = new Set([
  "Hentai",
  "Ecchi",
  "えっち",
  "エッチ",
  "NSFW",
  "R18",
  "R-18",
  "18禁",
  "黄油",
  "卖肉",
  "成人",
  "成人向け",
  "エロ",
]);

// 判断标签或类型名是否属于敏感内容
export function matchesNsfwKeyword(value: string | null | undefined): boolean {
  return typeof value === "string" && NSFW_KEYWORDS.has(value.trim());
}

// 按后台模式过滤敏感条目；blur 模式保留条目并由卡片负责模糊封面
export function filterByNsfwMode<T>(
  items: T[],
  mode: MediaNsfwMode,
  isNsfw: (item: T) => boolean,
): T[] {
  return mode === "hide" ? items.filter((item) => !isNsfw(item)) : items;
}
