"use client";

import { ImagePlus } from "lucide-react";
import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { requestJson, requestJsonBody } from "@/lib/api-client";
import type { MarkdownResult } from "@/types/markdown-result";
import type { MediaFile } from "@/types/media-file";

// 预览防抖时长（毫秒）：与文章编辑器保持一致
const PREVIEW_DEBOUNCE_MS = 600;

// Markdown 编辑器：分栏编辑 + 服务端实时预览 + 图片上传插入，供页面等表单复用
export default function MarkdownEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<MarkdownResult>({ html: "", toc: [] });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 正文变化后防抖请求预览接口
  useEffect(() => {
    const timer = setTimeout(() => {
      void (async () => {
        if (!value.trim()) {
          setPreview({ html: "", toc: [] });
          return;
        }
        const result = await requestJsonBody<MarkdownResult>("/api/preview", "POST", { content: value });
        setPreview(result.ok ? result.data : { html: "", toc: [] });
      })();
    }, PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  // 在光标处插入文本片段
  function insertAtCursor(snippet: string): void {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(`${value}\n${snippet}\n`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    onChange(`${value.slice(0, start)}${snippet}${value.slice(end)}`);
    requestAnimationFrame(() => {
      textarea.focus();
      const position = start + snippet.length;
      textarea.setSelectionRange(position, position);
    });
  }

  // 上传图片：成功后把 Markdown 图片语法插入光标处
  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const result = await requestJson<MediaFile>("/api/media", { method: "POST", body: form });
    setUploading(false);
    if (result.ok) {
      insertAtCursor(`![${file.name}](${result.data.url})`);
    } else {
      setError(result.error.message);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">内容</h2>
        <div className="flex items-center gap-2">
          {error ? <span className="text-xs text-red-600 dark:text-red-400">{error}</span> : null}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="hidden"
            onChange={(event) => void handleImageUpload(event)}
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 text-xs text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ImagePlus aria-hidden className="size-3.5" />
            {uploading ? "上传中…" : "插入图片"}
          </button>
        </div>
      </div>
      <div className="grid divide-y divide-zinc-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0 dark:divide-zinc-800">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="使用 Markdown 撰写内容…"
          spellCheck={false}
          className="min-h-96 w-full resize-y bg-transparent p-5 font-mono text-sm leading-relaxed outline-none"
        />
        <div className="max-h-[36rem] min-h-96 overflow-y-auto p-5">
          {preview.html ? (
            <div className="article-body" dangerouslySetInnerHTML={{ __html: preview.html }} />
          ) : (
            <p className="text-sm text-zinc-400 dark:text-zinc-500">输入内容后这里会显示渲染预览。</p>
          )}
        </div>
      </div>
    </div>
  );
}
