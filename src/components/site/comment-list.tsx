import { MessageCircle } from "lucide-react";
import MarkdownContent from "@/components/site/markdown-content";
import type { SiteComment } from "@/types/site-comment";

const commentDateFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

// 仅允许服务端已校验的 HTTP(S) 地址生成外链，兼容历史数据
function isSafeWebsite(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

// 公开评论列表：Markdown HTML 已由服务端消毒，展示昵称、时间、网站与正文
export default function CommentList({ comments }: { comments: SiteComment[] }) {
  if (comments.length === 0) {
    return (
      <div className="py-8 text-center text-(--content-meta)">
        <MessageCircle aria-hidden className="mx-auto mb-3 size-7 text-(--primary)/70" />
        <p className="text-sm">还没有评论，来留下第一条留言吧。</p>
      </div>
    );
  }

  return (
    <ol className="space-y-5">
      {comments.map((comment) => {
        const initial = comment.authorName.trim().slice(0, 1).toUpperCase() || "访";
        return (
          <li key={comment.id} className="flex gap-3">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--primary)/12 text-sm font-bold text-(--primary) ring-1 ring-(--primary)/15"
            >
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {isSafeWebsite(comment.authorWebsite) ? (
                  <a
                    href={comment.authorWebsite}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="break-all text-sm font-semibold text-(--btn-content) transition hover:text-(--primary)"
                  >
                    {comment.authorName}
                  </a>
                ) : (
                  <span className="break-all text-sm font-semibold text-(--btn-content)">
                    {comment.authorName}
                  </span>
                )}
                <time dateTime={comment.createdAt} className="text-xs text-(--content-meta)">
                  {commentDateFormatter.format(new Date(comment.createdAt))}
                </time>
              </div>
              <MarkdownContent html={comment.html} className="comment-markdown mt-2" />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
