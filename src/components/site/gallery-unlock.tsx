"use client";

import { Loader2, ShieldLock } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { requestJsonBody } from "@/lib/api-client";

// 加密相册解锁表单：校验通过后刷新页面，由服务端渲染照片
export default function GalleryUnlock({ albumId, passwordHint }: { albumId: number; passwordHint: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 提交密码：成功后刷新页面读取新的解锁 Cookie
  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!password || submitting) {
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await requestJsonBody<{ unlocked: boolean; slug: string }>(
      `/api/gallery/albums/${albumId}/unlock`,
      "POST",
      { password },
    );
    setSubmitting(false);
    if (result.ok) {
      router.refresh();
    } else {
      setError(result.error.message);
    }
  }

  return (
    <div className="flex justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-(--line-divider) bg-(--card-bg-transparent) p-6 backdrop-blur-md sm:p-8">
        <div className="flex flex-col items-center text-center">
          <ShieldLock aria-hidden className="size-14 text-(--primary)" />
          <h2 className="mt-3 text-lg font-bold text-black/80 dark:text-white/80">这是一个加密相册</h2>
          <p className="mt-1 text-sm text-black/40 dark:text-white/40">输入访问密码后即可查看相册中的照片。</p>
          {passwordHint ? (
            <p className="mt-2 text-xs text-black/35 dark:text-white/35">密码提示：{passwordHint}</p>
          ) : null}
        </div>
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-2">
          <label htmlFor="gallery-password" className="sr-only">
            相册访问密码
          </label>
          <input
            id="gallery-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="请输入访问密码"
            autoComplete="off"
            autoFocus
            className="h-10 w-full rounded-lg border border-(--line-color) bg-(--btn-plain-bg-active) px-3 text-sm outline-none transition focus:border-(--primary)"
          />
          <button
            type="submit"
            disabled={submitting || !password}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-(--primary) text-sm font-medium text-white transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60 dark:text-black/70"
          >
            {submitting ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
            {submitting ? "正在验证…" : "解锁相册"}
          </button>
        </form>
        {error ? <p className="mt-2 text-center text-xs text-red-500 dark:text-red-400">{error}</p> : null}
      </div>
    </div>
  );
}
