// 站点对外地址：用于 sitemap、RSS 等生成绝对链接
export function getSiteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
