import { Feed } from "feed";
import { renderMarkdown } from "@/lib/markdown";
import { toPlainText } from "@/lib/plain-text";
import { getSiteUrl } from "@/lib/site-url";
import { createSiteServices } from "@/server/services/service-container";

// 订阅源条数上限
const FEED_ITEM_LIMIT = 20;

// 构建站点订阅源：RSS 与 Atom 共用同一份条目数据（加密文章不下发正文与摘要）
export async function buildSiteFeed(): Promise<Feed> {
  const baseUrl = getSiteUrl();
  const { postService, settingService } = createSiteServices();
  const [settings, posts] = await Promise.all([
    settingService.getSiteSettings(),
    postService.listFeedItems(FEED_ITEM_LIMIT),
  ]);

  const feed = new Feed({
    title: settings.siteName,
    id: baseUrl,
    link: baseUrl,
    description: settings.siteDescription,
    language: "zh-CN",
    copyright: `© ${new Date().getFullYear()} ${settings.siteName}`,
    feedLinks: {
      rss: `${baseUrl}/rss.xml`,
      atom: `${baseUrl}/atom.xml`,
    },
  });

  for (const post of posts) {
    if (post.encrypted) {
      continue;
    }
    const link = `${baseUrl}/posts/${post.slug}`;
    const { html } = await renderMarkdown(post.content);
    feed.addItem({
      title: post.title,
      id: link,
      link,
      date: post.publishedAt,
      description: post.seoDescription ?? toPlainText(post.content, 200),
      content: html,
      category: post.tags.map((tag) => ({ name: tag.name })),
    });
  }

  return feed;
}