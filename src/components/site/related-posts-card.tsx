import { ChevronRight, Lock, Signpost } from "lucide-react";
import Link from "next/link";
import type { PostSummary } from "@/types/post-summary";

// 文章页「相关文章」卡：样式对齐官网（编号徽标 + 标题 + 分类/摘要 + 箭头），
// 内容由服务端按同标签/同分类的相关度推荐
export default function RelatedPostsCard({ posts }: { posts: PostSummary[] }) {
  if (posts.length === 0) {
    return null;
  }
  return (
    <section className="card-base mb-4 flex flex-col rounded-(--radius-large) p-5 md:p-6">
      <div className="mb-1 flex items-center gap-2 border-b border-(--line-divider) pb-3">
        <Signpost aria-hidden className="size-5 text-(--primary)" />
        <span className="text-75 text-base font-bold">相关文章</span>
        <span className="ml-auto rounded-full bg-(--btn-regular-bg) px-2 py-0.5 text-xs text-(--btn-content)">
          智能推荐
        </span>
      </div>
      {posts.map((post, index) => (
        <Link
          key={post.id}
          href={`/posts/${post.slug}`}
          className="group -mx-1 flex items-center gap-3 rounded-lg border-b border-dashed border-(--line-divider) px-3 py-3 transition-all last:border-b-0 hover:bg-black/5 active:scale-[0.98] dark:hover:bg-white/5"
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-(--enter-btn-bg) text-sm font-bold text-(--primary) transition">
            {index + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="text-75 block truncate text-sm font-bold transition group-hover:text-(--primary)">
              {post.title}
            </span>
            <span className="text-30 mt-0.5 flex items-center gap-1.5 text-xs">
              {post.category ? (
                <span className="shrink-0 rounded-sm bg-black/5 px-1.5 py-0.5 text-black/40 dark:bg-white/10 dark:text-white/40">
                  {post.category.name}
                </span>
              ) : null}
              {post.encrypted ? (
                <span className="shrink-0 rounded-sm bg-black/5 px-1.5 py-0.5 text-black/40 dark:bg-white/10 dark:text-white/40">
                  <Lock aria-hidden className="mr-0.5 inline size-3" />
                  加密
                </span>
              ) : null}
              <span className="truncate">{post.excerpt}</span>
            </span>
          </span>
          <ChevronRight
            aria-hidden
            className="size-5 shrink-0 text-black/15 transition group-hover:translate-x-0.5 group-hover:text-(--primary) dark:text-white/15"
          />
        </Link>
      ))}
    </section>
  );
}
