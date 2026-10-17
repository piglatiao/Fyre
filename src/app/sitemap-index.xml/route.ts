import { getSiteUrl } from "@/lib/site-url";

// 官网兼容入口：站点地图索引指向动态生成的 sitemap.xml
export function GET(): Response {
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `<sitemap><loc>${getSiteUrl()}/sitemap.xml</loc></sitemap>`,
    "</sitemapindex>",
  ].join("");

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
