import { BookOpen, CalendarDays, ChevronRight, Lock, Pin } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { PostSummary } from "@/types/post-summary";
import { formatDate } from "@/lib/format-date";

// 文章卡片（列表模式）：右侧封面、主色标题竖条、元信息与底部标签；支持列表逐项入场延迟
export default function PostCard({
  post,
  animationDelayMs,
}: {
  post: PostSummary;
  animationDelayMs?: number;
}) {
  const maxTags = 3;
  // 列表逐项延迟入场：与官网一致使用 calc(var(--content-delay) + Nms)，未传值时交给全局 30ms 递增规则
  const animationDelayStyle =
    animationDelayMs === undefined
      ? undefined
      : ({ animationDelay: `calc(var(--content-delay) + ${animationDelayMs}ms)` } as CSSProperties);
  const visibleTags = post.tags.slice(0, maxTags);
  const restCount = post.tags.length - visibleTags.length;

  return (
    <article
      className="card-base onload-animation post-card-wrapper relative flex w-full flex-col-reverse overflow-hidden rounded-(--radius-large)"
      style={{ "--coverWidth": "30%", ...animationDelayStyle } as CSSProperties}
    >
      <div className="post-card-content relative flex h-full w-full flex-col px-4 pt-4 pb-4 md:w-[calc(100%-var(--coverWidth)-1.5rem)] md:pt-7 md:pr-2 md:pb-7 md:pl-9">
        <Link href={`/posts/${post.slug}`} className="post-card-title group mb-3 block w-full text-2xl font-bold text-90 transition hover:text-(--primary) md:text-3xl">
          {post.title}
        </Link>

        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-neutral-500 dark:text-neutral-400">
          {post.pinned ? (
            <span className="flex items-center gap-1 rounded-md bg-(--btn-regular-bg) px-2 py-1.5 text-sm font-bold text-(--btn-content)">
              <Pin aria-hidden className="size-4" />
              置顶
            </span>
          ) : null}
          {post.encrypted ? (
            <span className="flex items-center gap-1 rounded-md bg-(--btn-regular-bg) px-2 py-1.5 text-sm font-bold text-(--btn-content)">
              <Lock aria-hidden className="size-4" />
              加密
            </span>
          ) : null}
          <span className="flex items-center text-sm">
            <CalendarDays aria-hidden className="meta-icon size-4" />
            <span className="text-50 font-medium">{formatDate(post.publishedAt)}</span>
          </span>
          {post.category ? (
            <span className="flex items-center text-sm">
              <BookOpen aria-hidden className="meta-icon size-4" />
              <Link
                href={`/category/${post.category.slug}`}
                className="text-50 font-medium whitespace-nowrap transition hover:text-(--primary)"
              >
                {post.category.name}
              </Link>
            </span>
          ) : null}
        </div>

        {post.encrypted ? (
          <p className="text-50 mb-2 flex grow items-center gap-1.5 text-sm md:pr-4">
            <Lock aria-hidden className="size-3.5" />
            该文章已加密，输入密码后查看正文。
          </p>
        ) : post.excerpt ? (
          <p className="text-75 mb-2 line-clamp-2 grow md:pr-4">{post.excerpt}</p>
        ) : null}

        {visibleTags.length > 0 ? (
          <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-3">
            {visibleTags.map((tag) => (
              <Link key={tag.slug} href={`/tag/${tag.slug}`} className="tag-item px-2.5 py-1 text-xs font-medium">
                #{tag.name}
              </Link>
            ))}
            {restCount > 0 ? (
              <span className="tag-item px-2.5 py-1 text-xs font-medium" title={post.tags.map((tag) => `#${tag.name}`).join(" ")}>
                +{restCount}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {post.coverUrl ? (
        <Link
          href={`/posts/${post.slug}`}
          tabIndex={-1}
          aria-hidden
          className="post-card-image group relative aspect-2/1 w-full overflow-hidden md:absolute md:top-4 md:right-4 md:bottom-4 md:w-(--coverWidth) md:aspect-auto"
        >
          <span className="pointer-events-none absolute inset-0 z-10 transition group-hover:bg-black/30" />
          <span className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <ChevronRight aria-hidden className="size-10 scale-50 text-white opacity-0 transition group-hover:scale-100 group-hover:opacity-100" />
          </span>
          <span className="block size-full overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element -- 封面来自后台上传或外链 */}
            <img
              src={post.coverUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="size-full object-cover transition duration-300 group-hover:scale-110"
            />
          </span>
        </Link>
      ) : null}
    </article>
  );
}