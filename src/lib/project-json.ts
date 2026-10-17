import type { ProjectLink } from "@/types/project-link";

// 把数据库 JSON 列规范化为字符串数组
export function toProjectTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

// 把数据库 JSON 列规范化为项目外链数组
export function toProjectLinks(value: unknown): ProjectLink[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null) {
      return [];
    }
    const record = item as Record<string, unknown>;
    if (typeof record.label !== "string" || typeof record.value !== "string") {
      return [];
    }
    return [{
      label: record.label,
      icon: typeof record.icon === "string" ? record.icon : "",
      value: record.value,
    }];
  });
}
