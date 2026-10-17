import { buildSiteFeed } from "@/lib/site-feed";

// Atom 1.0 订阅：输出最近发布的文章（与 RSS 共用条目构建）
export async function GET(): Promise<Response> {
  const feed = await buildSiteFeed();
  return new Response(feed.atom1(), {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}