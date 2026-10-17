import Link from "next/link";
import { ArrowUpRight, ChevronRight, FileText } from "lucide-react";
import { formatDate } from "@/lib/format-date";
import { postStatusLabels, postStatusStyles } from "@/lib/post-status-display";
import type { AdminPostListItem } from "@/types/admin-post-list-item";

// 最近更新：封面缩略图 + 分类/时间/阅读量 + 状态徽标，整行可点进编辑器
export default function DashboardRecentPosts({ posts }: { posts: AdminPostListItem[] }) {
  return (
    <section className="admin-card">
      <div className="flex items-center justify-between border-b border-(--line-color) px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold">最近更新</h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">按最后修改时间排序</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-1 text-xs text-sky-600 transition hover:text-sky-700 dark:text-sky-400"
        >
          新建文章
          <ArrowUpRight className="size-3.5" aria-hidden />
        </Link>
      </div>
      {posts.length > 0 ? (
        <ul className="divide-y divide-(--line-color)">
          {posts.map((post) => (
            <li key={post.id}>
              <Link href={"/admin/posts/" + post.id} className="admin-row flex items-center gap-3 px-5 py-3">
                <span className="admin-thumb">
                  {post.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- 封面来自后台上传或外链，原生 img 避免远程域名白名单限制
                    <img src={post.coverUrl} alt="" />
                  ) : (
                    <FileText className="size-5" aria-hidden />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{post.title}</p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {post.category?.name ?? "未分类"} · {formatDate(post.updatedAt)} · 阅读 {post.viewCount}
                    {post.encrypted ? " · 已加密" : ""}
                    {post.pinned ? " · 置顶" : ""}
                  </p>
                </div>
                <span className={"shrink-0 rounded-full px-2 py-0.5 text-xs " + postStatusStyles[post.status]}>
                  {postStatusLabels[post.status]}
                </span>
                <ChevronRight className="size-4 shrink-0 text-zinc-400" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
          还没有文章，点击右上角「写文章」开始创作。
        </p>
      )}
    </section>
  );
}
