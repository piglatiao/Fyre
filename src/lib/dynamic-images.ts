import type { DynamicImage } from "@/types/dynamic-image";

// 把数据库 JSON 列读出的动态配图规范化为 { alt, src } 数组，非法项直接丢弃
export function toDynamicImages(value: unknown): DynamicImage[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const images: DynamicImage[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) {
      continue;
    }
    const record = item as Record<string, unknown>;
    const src = typeof record.src === "string" ? record.src.trim() : "";
    if (!src) {
      continue;
    }
    const alt = typeof record.alt === "string" ? record.alt.trim() : "";
    images.push({ alt, src });
  }
  return images;
}