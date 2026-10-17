import { buildSiteFeed } from "@/lib/site-feed";

// RSS 2.0 订阅：输出最近发布的文章（与 Atom 共用条目构建）
export async function GET(): Promise<Response> {
  const feed = await buildSiteFeed();
  return new Response(feed.rss2(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}