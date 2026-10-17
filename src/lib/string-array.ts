// 把数据库 JSON 字段安全转换为字符串数组：过滤非字符串、去空白并去重
export function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const items = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return [...new Set(items)];
}
