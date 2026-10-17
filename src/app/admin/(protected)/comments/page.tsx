import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { CommentStatus, CommentTargetType } from "@/generated/prisma/client";
import AdminPageHeader from "@/components/admin/admin-page-header";
import CommentsTable from "@/components/admin/comments-table";
import Pagination from "@/components/site/pagination";
import { COMMENT_STATUS_LABELS, COMMENT_TARGET_LABELS } from "@/lib/comment-labels";
import { parsePageParam } from "@/lib/pagination";
import { createSiteServices } from "@/server/services/service-container";

export const metadata: Metadata = {
  title: "评论管理",
};

// 后台每页评论条数
const COMMENTS_PER_PAGE = 20;

// 读取查询参数中的单个字符串
function readSingle(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : (value ?? "")).trim();
}

// 校验状态筛选值，非法值直接忽略
function parseStatus(value: string): CommentStatus | undefined {
  return (Object.values(CommentStatus) as string[]).includes(value) ? (value as CommentStatus) : undefined;
}

// 校验内容类型筛选值，非法值直接忽略
function parseTargetType(value: string): CommentTargetType | undefined {
  return (Object.values(CommentTargetType) as string[]).includes(value)
    ? (value as CommentTargetType)
    : undefined;
}

// 评论管理：服务端筛选分页，客户端执行审核与删除操作
export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const status = parseStatus(readSingle(params.status));
  const targetType = parseTargetType(readSingle(params.targetType));
  const keyword = readSingle(params.q);
  const { adminCommentService } = createSiteServices();
  const result = await adminCommentService.list({
    page,
    pageSize: COMMENTS_PER_PAGE,
    status,
    targetType,
    keyword: keyword || undefined,
  });
  const totalPages = Math.max(1, Math.ceil(result.total / COMMENTS_PER_PAGE));
  const query: Record<string, string> = {
    ...(status ? { status } : {}),
    ...(targetType ? { targetType } : {}),
    ...(keyword ? { q: keyword } : {}),
  };

  return (
    <section className="space-y-6">
      <AdminPageHeader
        title="评论管理"
        description="审核本站文章、相册、项目、页面与动态下的评论；邮箱仅后台可见。"
      />

      <div className="admin-card p-4 sm:p-5">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-(--btn-regular-bg) px-3 py-1 font-medium">
            全部 {result.counts.total}
          </span>
          <span className="rounded-full bg-amber-500/10 px-3 py-1 font-medium text-amber-700 dark:text-amber-300">
            待审核 {result.counts.pending}
          </span>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 font-medium text-emerald-700 dark:text-emerald-300">
            已通过 {result.counts.approved}
          </span>
          <span className="rounded-full bg-zinc-500/10 px-3 py-1 font-medium text-zinc-600 dark:text-zinc-300">
            已隐藏 {result.counts.hidden}
          </span>
        </div>

        <form action="/admin/comments" method="get" className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_10rem_10rem_auto_auto]">
          <div className="min-w-0">
            <label htmlFor="comment-keyword" className="sr-only">
              搜索评论
            </label>
            <input
              id="comment-keyword"
              name="q"
              type="search"
              defaultValue={keyword}
              placeholder="搜索昵称、邮箱、内容或内容标题"
              className="h-10 w-full min-w-0 rounded-lg border border-(--line-color) bg-(--card-bg) px-3 text-sm outline-none transition focus:border-(--primary)"
            />
          </div>
          <div>
            <label htmlFor="comment-status" className="sr-only">
              审核状态
            </label>
            <select
              id="comment-status"
              name="status"
              defaultValue={status ?? ""}
              className="h-10 w-full rounded-lg border border-(--line-color) bg-(--card-bg) px-3 text-sm outline-none transition focus:border-(--primary)"
            >
              <option value="">全部状态</option>
              {Object.values(CommentStatus).map((value) => (
                <option key={value} value={value}>
                  {COMMENT_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="comment-target-type" className="sr-only">
              内容类型
            </label>
            <select
              id="comment-target-type"
              name="targetType"
              defaultValue={targetType ?? ""}
              className="h-10 w-full rounded-lg border border-(--line-color) bg-(--card-bg) px-3 text-sm outline-none transition focus:border-(--primary)"
            >
              <option value="">全部类型</option>
              {Object.values(CommentTargetType).map((value) => (
                <option key={value} value={value}>
                  {COMMENT_TARGET_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-4 text-sm font-medium text-white transition hover:bg-sky-700"
          >
            <Search aria-hidden className="size-4" />
            筛选
          </button>
          <Link
            href="/admin/comments"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-(--line-color) px-4 text-sm transition hover:border-(--primary) hover:text-(--primary)"
          >
            重置
          </Link>
        </form>
      </div>

      <CommentsTable items={result.items} />
      <Pagination basePath="/admin/comments" page={page} totalPages={totalPages} query={query} />
    </section>
  );
}
