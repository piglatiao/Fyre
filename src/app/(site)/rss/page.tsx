import type { Metadata } from "next";
import FeedSubscriptionPage from "@/components/site/feed-subscription-page";

export const metadata: Metadata = {
  title: "RSS 订阅",
  description: "订阅获取流萤动态博客的最新文章",
};

// RSS 订阅说明页：与官网 /rss/ 路径保持一致
export default function RssPage() {
  return <FeedSubscriptionPage kind="rss" />;
}
