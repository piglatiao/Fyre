// slug 规范化：转小写，空白与下划线转横线，仅保留字母、数字、横线与中文
export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fa5-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// 随机后缀（4 位十六进制）
function randomSuffix(): string {
  return Math.random().toString(16).slice(2, 6).padEnd(4, "0");
}

// 自动生成文章 slug：post-YYYYMMDD-xxxx
export function generatePostSlug(now: Date): string {
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `post-${date}-${randomSuffix()}`;
}

// 分类/标签自动 slug：以名称规范化结果为基础并追加随机后缀
export function generateNamedSlug(name: string): string {
  const base = normalizeSlug(name) || "item";
  return `${base}-${randomSuffix()}`;
}

// 自动生成 slug 的最大尝试次数
export const SLUG_MAX_ATTEMPTS = 5;
