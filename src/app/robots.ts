import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

// robots.txt：放行前台内容，屏蔽后台与接口，并声明 sitemap 地址
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
