import type { Metadata } from "next";
import FeedSubscriptionPage from "@/components/site/feed-subscription-page";

export const metadata: Metadata = {
  title: "Atom 订阅",
  description: "订阅获取流萤动态博客的最新文章",
};

// Atom 订阅说明页：与官网 /atom/ 路径保持一致
export default function AtomPage() {
  return <FeedSubscriptionPage kind="atom" />;
}
