"use client";

import { Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { requestJsonBody } from "@/lib/api-client";

// 加密文章解锁表单：校验通过后刷新页面展示正文
export default function PostUnlock({ postId }: { postId: number }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 提交密码：成功后刷新页面（服务端已写入解锁 Cookie）
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!password || submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await requestJsonBody<{ unlocked: boolean }>(`/api/posts/${postId}/unlock`, "POST", { password });
    setSubmitting(false);
    if (result.ok) {
      router.refresh();
    } else {
      setError(result.error.message);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="my-6 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-(--deep-text)">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--btn-regular-bg) text-(--btn-content)">
          <Lock aria-hidden className="size-4.5" />
        </span>
        <div>
          <p className="text-base font-bold">该文章已加密</p>
          <p className="text-50 text-sm">输入访问密码后即可查看正文内容。</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="请输入访问密码"
          autoFocus
          className="h-10 w-full max-w-72 rounded-lg border border-(--line-color) bg-(--btn-plain-bg-active) px-3 text-sm text-(--deep-text) outline-none transition focus:border-(--primary)"
        />
        <button
          type="submit"
          disabled={submitting || !password}
          className="btn-regular h-10 rounded-lg px-5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
          解锁
        </button>
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </form>
  );
}