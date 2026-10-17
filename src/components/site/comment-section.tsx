"use client";

import { ChevronDown, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { CommentStatus, CommentTargetType } from "@/generated/prisma/client";
import { requestJson } from "@/lib/api-client";
import type { SiteComment } from "@/types/site-comment";
import type { SiteCommentPage } from "@/types/site-comment-page";
import CommentForm from "./comment-form";
import CommentList from "./comment-list";

// 前端每页评论条数
const PAGE_SIZE = 10;

// 评论交互容器：负责展开、首屏加载、加载更多与提交后刷新
export default function CommentSection({
  targetType,
  targetId,
  title,
  requireApproval,
  collapsible,
}: {
  targetType: CommentTargetType;
  targetId: number | null;
  title: string;
  requireApproval: boolean;
  collapsible: boolean;
}) {
  const [expanded, setExpanded] = useState(!collapsible);
  const [comments, setComments] = useState<SiteComment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(!collapsible);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // 展开后读取第一页评论；目标变化时同步重新加载
  useEffect(() => {
    if (!expanded) {
      return;
    }
    let active = true;
    const query = new URLSearchParams({
      targetType,
      page: "1",
      pageSize: String(PAGE_SIZE),
    });
    if (targetId !== null) {
      query.set("targetId", String(targetId));
    }
    void (async () => {
      const result = await requestJson<SiteCommentPage>(`/api/comments?${query.toString()}`);
      if (!active) {
        return;
      }
      if (result.ok) {
        setComments(result.data.items);
        setTotal(result.data.total);
      } else {
        setError(result.error.message);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [expanded, refreshKey, targetId, targetType]);

  // 继续读取下一页评论并追加到列表末尾
  async function loadMore(): Promise<void> {
    setLoadingMore(true);
    setError("");
    const nextPage = Math.floor(comments.length / PAGE_SIZE) + 1;
    const query = new URLSearchParams({
      targetType,
      page: String(nextPage),
      pageSize: String(PAGE_SIZE),
    });
    if (targetId !== null) {
      query.set("targetId", String(targetId));
    }
    const result = await requestJson<SiteCommentPage>(`/api/comments?${query.toString()}`);
    setLoadingMore(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setComments((current) => {
      const known = new Set(current.map((comment) => comment.id));
      return [...current, ...result.data.items.filter((comment) => !known.has(comment.id))];
    });
    setTotal(result.data.total);
  }

  // 新评论已通过时刷新首屏；待审核时保留当前列表
  function handleSubmitted(status: CommentStatus): void {
    if (status === "APPROVED") {
      setLoading(true);
      setError("");
      setRefreshKey((value) => value + 1);
    }
  }

  const sectionId = collapsible
    ? `comments-${targetType.toLowerCase()}-${targetId ?? "page"}`
    : "comments";

  if (!expanded) {
    return (
      <section id={sectionId} className="card-base relative mt-4 overflow-x-clip overflow-y-visible rounded-(--radius-large) p-4">
        <button
          type="button"
          onClick={() => {
            setExpanded(true);
            setLoading(true);
          }}
          aria-expanded={false}
          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 text-left transition hover:bg-(--btn-plain-bg-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--primary)"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-(--primary)/10 text-(--primary)">
            <MessageCircle aria-hidden className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-(--btn-content)">评论与留言</span>
            <span className="block truncate text-xs text-(--content-meta)">展开后可查看评论并参与讨论</span>
          </span>
          <ChevronDown aria-hidden className="size-4 shrink-0 text-(--content-meta)" />
        </button>
        <span className="sr-only">目标：{title}</span>
      </section>
    );
  }

  return (
    <section
      id={sectionId}
      data-comment-target={`${targetType}:${targetId ?? "page"}`}
      className="card-base relative mt-4 overflow-x-clip overflow-y-visible rounded-(--radius-large) p-5 md:p-8"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <span className="h-6 w-1 rounded-full bg-linear-to-b from-(--primary) to-transparent" />
            <h3 className="text-xl font-bold text-(--btn-content)">评论</h3>
          </div>
          <p className="ml-4 text-sm text-(--content-meta)">欢迎留下你的想法，友善交流，共同成长。</p>
        </div>
        <span className="rounded-full bg-(--btn-regular-bg) px-3 py-1 text-xs font-medium text-(--btn-content)">
          {loading ? "加载中" : `${total} 条评论`}
        </span>
      </div>

      <div className="relative z-10">
        <CommentForm
          targetType={targetType}
          targetId={targetId}
          requireApproval={requireApproval}
          onSubmitted={handleSubmitted}
        />

        <div className="mt-8 border-t border-(--line-color) pt-6">
          {loading ? (
            <p role="status" className="py-6 text-center text-sm text-(--content-meta)">
              正在加载评论…
            </p>
          ) : error && comments.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setError("");
                  setRefreshKey((value) => value + 1);
                }}
                className="mt-3 inline-flex min-h-11 items-center justify-center rounded-lg border border-(--line-color) px-4 text-sm transition hover:border-(--primary) hover:text-(--primary)"
              >
                重新加载
              </button>
            </div>
          ) : (
            <>
              <CommentList comments={comments} />
              {error ? (
                <p role="alert" className="mt-4 text-center text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              ) : null}
              {comments.length < total ? (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => void loadMore()}
                    disabled={loadingMore}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-(--line-color) px-5 text-sm font-medium transition hover:border-(--primary) hover:text-(--primary) disabled:cursor-wait disabled:opacity-60"
                  >
                    {loadingMore ? "加载中…" : "加载更多评论"}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
      <span className="sr-only">目标：{title}</span>
    </section>
  );
}
