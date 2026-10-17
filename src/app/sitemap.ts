import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { createSiteServices } from "@/server/services/service-container";

// 站点地图按请求动态生成：新发布文章无需重新部署即可出现在 sitemap 中
export const dynamic = "force-dynamic";

// 站点地图：首页、归档、标签、系列、全部分类、标签、自定义页面与已发布文章
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const { postService, categoryService, tagService, pageService, settingService } = createSiteServices();
  const [entries, categorySlugs, tags, pages, settings] = await Promise.all([
    postService.listSitemapEntries(),
    categoryService.listAllSlugs(),
    tagService.listAll(),
    pageService.listPublishedEntries(),
    settingService.getSiteSettings(),
  ]);

  return [
    { url: `${baseUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/archive`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/categories`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/friends`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/guestbook`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/dynamic`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/projects`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/gallery`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/booknav`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${baseUrl}/sponsor`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/search`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/rss`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/atom`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/tags`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/series`, changeFrequency: "weekly", priority: 0.6 },
    ...(settings.bilibiliEnabled
      ? [{ url: `${baseUrl}/bilibili`, changeFrequency: "weekly" as const, priority: 0.5 }]
      : []),
    ...(settings.bangumiEnabled
      ? [{ url: `${baseUrl}/bangumi`, changeFrequency: "weekly" as const, priority: 0.5 }]
      : []),
    ...(settings.vndbEnabled
      ? [{ url: `${baseUrl}/vndb`, changeFrequency: "weekly" as const, priority: 0.5 }]
      : []),
    ...(settings.malEnabled
      ? [{ url: `${baseUrl}/myanimelist`, changeFrequency: "weekly" as const, priority: 0.5 }]
      : []),
    ...categorySlugs.map(
      (slug): MetadataRoute.Sitemap[number] => ({
        url: `${baseUrl}/category/${slug}`,
        changeFrequency: "weekly",
        priority: 0.5,
      }),
    ),
    ...tags.map(
      (tag): MetadataRoute.Sitemap[number] => ({
        url: `${baseUrl}/tag/${tag.slug}`,
        changeFrequency: "weekly",
        priority: 0.4,
      }),
    ),
    ...pages
      .filter((page) => page.slug !== "about" && page.slug !== "guestbook")
      .map(
      (page): MetadataRoute.Sitemap[number] => ({
        url: `${baseUrl}/page/${page.slug}`,
        lastModified: page.updatedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      }),
    ),
    ...entries.map(
      (entry): MetadataRoute.Sitemap[number] => ({
        url: `${baseUrl}/posts/${entry.slug}`,
        lastModified: entry.updatedAt,
        changeFrequency: "monthly",
        priority: 0.8,
      }),
    ),
  ];
}
