import Link from "next/link";
import type { PostSummary } from "@/types/post-summary";
import WidgetCard from "./widget-card";

// 最新文章卡：带序号的紧凑列表
export default function LatestPostsCard({ posts, delay = 0 }: { posts: PostSummary[]; delay?: number }) {
  if (posts.length === 0) {
    return null;
  }
  return (
    <WidgetCard title="最新文章" delay={delay}>
      <div className="flex flex-col">
        {posts.map((post, index) => (
          <Link
            key={post.id}
            href={`/posts/${post.slug}`}
            className="group -mx-1 flex items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-black/5 dark:hover:bg-white/5"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-(--enter-btn-bg) text-sm font-bold text-(--primary)">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold transition group-hover:text-(--primary)">
                {post.title}
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 text-xs text-black/30 dark:text-white/30">
                {post.category ? (
                  <span className="shrink-0 rounded-sm bg-black/5 px-1.5 py-0.5 text-black/40 dark:bg-white/10 dark:text-white/40">
                    {post.category.name}
                  </span>
                ) : null}
                <span className="truncate">{post.excerpt}</span>
              </span>
            </span>
          </Link>
        ))}
      </div>
    </WidgetCard>
  );
}