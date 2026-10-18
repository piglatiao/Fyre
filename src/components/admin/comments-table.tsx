"use client";

import { Check, EyeOff, Mail, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import MarkdownContent from "@/components/site/markdown-content";
import type { CommentStatus } from "@/generated/prisma/client";
import { requestJsonBody } from "@/lib/api-client";
import { COMMENT_STATUS_LABELS, COMMENT_TARGET_LABELS } from "@/lib/comment-labels";
import type { AdminCommentView } from "@/types/admin-comment-view";

const commentDateFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

// 后台外链同样只允许 HTTP(S)，避免历史脏数据生成危险链接
function isSafeWebsite(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

// 评论状态徽标配色：同时用文字表达状态，不只依赖颜色
function statusClass(status: CommentStatus): string {
  if (status === "APPROVED") {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }
  if (status === "HIDDEN") {
    return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300";
  }
  return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
}

// 后台评论列表：通过、隐藏、恢复待审与删除操作
export default function CommentsTable({ items }: { items: AdminCommentView[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 修改评论状态并刷新服务端列表
  async function updateStatus(id: number, status: CommentStatus): Promise<void> {
    setBusyId(id);
    setMessage(null);
    const result = await requestJsonBody<{ id: number }>(`/api/comments/${id}`, "PATCH", { status });
    setBusyId(null);
    if (!result.ok) {
      setMessage({ type: "error", text: result.error.message });
      return;
    }
    setMessage({ type: "success", text: `评论状态已更新为「${COMMENT_STATUS_LABELS[status]}」` });
    router.refresh();
  }

  // 删除前确认，避免误触导致评论不可恢复
  async function remove(id: number): Promise<void> {
    if (!window.confirm("确定删除这条评论吗？删除后无法恢复。")) {
      return;
    }
    setBusyId(id);
    setMessage(null);
    const result = await requestJsonBody<{ id: number }>(`/api/comments/${id}`, "DELETE");
    setBusyId(null);
    if (!result.ok) {
      setMessage({ type: "error", text: result.error.message });
      return;
    }
    setMessage({ type: "success", text: "评论已删除" });
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="admin-card p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        当前筛选条件下没有评论。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {message ? (
        <p
          role="alert"
          className={
            message.type === "error"
              ? "rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300"
              : "rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
          }
        >
          {message.text}
        </p>
      ) : null}

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="admin-card min-w-0 overflow-hidden p-4 sm:p-5">
            <div className="flex min-w-0 flex-wrap items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--primary)/12 text-sm font-bold text-(--primary)">
                {item.authorName.slice(0, 1).toUpperCase() || "访"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <p className="break-all text-sm font-semibold">{item.authorName}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(item.status)}`}>
                    {COMMENT_STATUS_LABELS[item.status]}
                  </span>
                  <span className="rounded-full bg-(--btn-regular-bg) px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-300">
                    {COMMENT_TARGET_LABELS[item.targetType]}
                  </span>
                </div>
                <p className="mt-1 break-words text-xs text-zinc-500 dark:text-zinc-400">
                  {item.targetTitle}
                  {item.targetId !== null ? ` · #${item.targetId}` : ""}
                </p>
              </div>
              <time dateTime={item.createdAt} className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                {commentDateFormatter.format(new Date(item.createdAt))}
              </time>
            </div>

            <MarkdownContent html={item.html} className="comment-markdown mt-4" />

            <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500 dark:text-zinc-400">
              {item.authorEmail ? (
                <a href={`mailto:${item.authorEmail}`} className="flex min-w-0 items-center gap-1 hover:text-(--primary)">
                  <Mail aria-hidden className="size-3.5 shrink-0" />
                  <span className="break-all">{item.authorEmail}</span>
                </a>
              ) : null}
              {isSafeWebsite(item.authorWebsite) ? (
                <a
                  href={item.authorWebsite}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="max-w-full break-all text-sky-600 hover:text-sky-700 dark:text-sky-400"
                >
                  {item.authorWebsite}
                </a>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-(--line-color) pt-3">
              {item.status !== "APPROVED" ? (
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => void updateStatus(item.id, "APPROVED")}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-emerald-500/30 px-3 text-xs font-medium text-emerald-700 transition hover:bg-emerald-500/10 disabled:opacity-60 dark:text-emerald-300"
                >
                  <Check aria-hidden className="size-3.5" />
                  通过
                </button>
              ) : null}
              {item.status !== "HIDDEN" ? (
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => void updateStatus(item.id, "HIDDEN")}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-(--line-color) px-3 text-xs font-medium transition hover:bg-(--btn-plain-bg-hover) disabled:opacity-60"
                >
                  <EyeOff aria-hidden className="size-3.5" />
                  隐藏
                </button>
              ) : null}
              {item.status !== "PENDING" ? (
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => void updateStatus(item.id, "PENDING")}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-(--line-color) px-3 text-xs font-medium transition hover:bg-(--btn-plain-bg-hover) disabled:opacity-60"
                >
                  <RotateCcw aria-hidden className="size-3.5" />
                  转为待审
                </button>
              ) : null}
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => void remove(item.id)}
                className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-red-500/30 px-3 text-xs font-medium text-red-700 transition hover:bg-red-500/10 disabled:opacity-60 dark:text-red-300"
              >
                <Trash2 aria-hidden className="size-3.5" />
                删除
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
