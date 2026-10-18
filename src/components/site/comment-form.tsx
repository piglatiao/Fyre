"use client";

import { Send } from "lucide-react";
import { useId, useState } from "react";
import type { CommentStatus, CommentTargetType } from "@/generated/prisma/client";
import { requestJsonBody } from "@/lib/api-client";
import type { CommentSubmitResult } from "@/types/comment-submit-result";

// 评论提交表单：昵称必填，邮箱与网站可选，成功后保留访客信息
export default function CommentForm({
  targetType,
  targetId,
  requireApproval,
  onSubmitted,
}: {
  targetType: CommentTargetType;
  targetId: number | null;
  requireApproval: boolean;
  onSubmitted: (status: CommentStatus) => void;
}) {
  const idPrefix = useId();
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [authorWebsite, setAuthorWebsite] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 提交评论：服务端再次校验目标、频率与内容长度
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!content.trim()) {
      setMessage({ type: "error", text: "请填写评论内容" });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    const result = await requestJsonBody<CommentSubmitResult>("/api/comments", "POST", {
      targetType,
      targetId,
      authorName,
      authorEmail,
      authorWebsite,
      content,
    });
    setSubmitting(false);
    if (!result.ok) {
      setMessage({ type: "error", text: result.error.message });
      return;
    }
    setContent("");
    setMessage({
      type: "success",
      text:
        result.data.status === "PENDING"
          ? "评论已提交，审核通过后会公开显示。"
          : "评论已发布，感谢你的留言！",
    });
    onSubmitted(result.data.status);
  }

  const inputClass =
    "mt-1.5 min-h-11 w-full rounded-lg border border-(--line-color) bg-(--card-bg) px-3.5 py-2.5 text-sm text-(--btn-content) outline-none transition placeholder:text-black/30 focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15 dark:placeholder:text-white/30";

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="min-w-0">
          <label htmlFor={`${idPrefix}-name`} className="text-sm font-medium text-(--btn-content)">
            昵称 <span className="text-red-500">*</span>
          </label>
          <input
            id={`${idPrefix}-name`}
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
            maxLength={50}
            autoComplete="name"
            placeholder="怎么称呼你？"
            className={inputClass}
            required
          />
        </div>
        <div className="min-w-0">
          <label htmlFor={`${idPrefix}-email`} className="text-sm font-medium text-(--btn-content)">
            邮箱 <span className="font-normal text-(--content-meta)">（不公开）</span>
          </label>
          <input
            id={`${idPrefix}-email`}
            type="email"
            value={authorEmail}
            onChange={(event) => setAuthorEmail(event.target.value)}
            maxLength={100}
            autoComplete="email"
            placeholder="用于识别身份，可选"
            className={inputClass}
          />
        </div>
        <div className="min-w-0">
          <label htmlFor={`${idPrefix}-website`} className="text-sm font-medium text-(--btn-content)">
            网站 <span className="font-normal text-(--content-meta)">（可选）</span>
          </label>
          <input
            id={`${idPrefix}-website`}
            type="url"
            value={authorWebsite}
            onChange={(event) => setAuthorWebsite(event.target.value)}
            maxLength={500}
            autoComplete="url"
            placeholder="https://example.com"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-content`} className="text-sm font-medium text-(--btn-content)">
          评论内容 <span className="text-red-500">*</span>
        </label>
        <textarea
          id={`${idPrefix}-content`}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="留下你的想法…支持 Markdown 语法"
          className={`${inputClass} resize-y leading-7`}
          required
        />
        <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-(--content-meta)">
          <span>支持 Markdown。{requireApproval ? "提交后需审核，通过后公开显示。" : "评论将直接公开，请友善交流。"}</span>
          <span className="shrink-0 tabular-nums">{content.length} / 2000</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          aria-live="polite"
          className={
            message?.type === "error"
              ? "text-sm text-red-600 dark:text-red-400"
              : "text-sm text-emerald-600 dark:text-emerald-400"
          }
        >
          {message?.text ?? ""}
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-(--primary) px-5 text-sm font-medium text-white transition hover:bg-(--primary)/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--primary) disabled:cursor-wait disabled:opacity-60 dark:text-black/70"
        >
          <Send aria-hidden className="size-4" />
          {submitting ? "提交中…" : "发表评论"}
        </button>
      </div>
    </form>
  );
}
