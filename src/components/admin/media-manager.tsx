"use client";

import { CloudDownload, FileIcon, ImagePlus, Loader2, Trash2 } from "lucide-react";
import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { requestJson, requestJsonBody } from "@/lib/api-client";
import { formatDate } from "@/lib/format-date";
import { isVideoUrl } from "@/lib/media-url";
import type { MediaFile } from "@/types/media-file";
import type { PageResult } from "@/types/page-result";

// 每页展示的媒体数量
const PAGE_SIZE = 12;

// 类型筛选项
const typeFilters = [
  { value: "", label: "全部" },
  { value: "IMAGE", label: "图片" },
  { value: "FILE", label: "文件" },
] as const;

// 文件体积展示：按 KB / MB 自适应
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// 媒体库：上传（支持多选）、网格浏览、复制地址与删除
export default function MediaManager() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<MediaFile[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);

  // 拉取媒体分页列表
  async function load(targetPage: number, targetType: string): Promise<void> {
    setLoading(true);
    const query = new URLSearchParams({ page: String(targetPage), pageSize: String(PAGE_SIZE) });
    if (targetType) {
      query.set("type", targetType);
    }
    const result = await requestJson<PageResult<MediaFile>>(`/api/media?${query.toString()}`);
    if (result.ok) {
      setItems(result.data.items);
      setPage(result.data.page);
      setTotal(result.data.total);
      setTotalPages(result.data.totalPages);
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
    setLoading(false);
  }

  useEffect(() => {
    void (async () => {
      await load(1, "");
    })();
  }, []);

  // 上传文件：逐个提交，任一失败即停止并提示
  async function handleUpload(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) {
      return;
    }
    setUploading(true);
    setMessage(null);
    let uploaded = 0;
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      const result = await requestJson<MediaFile>("/api/media", { method: "POST", body: form });
      if (!result.ok) {
        setUploading(false);
        setMessage({
          type: "error",
          text: uploaded > 0 ? `已上传 ${uploaded} 个文件，随后失败：${result.error.message}` : result.error.message,
        });
        await load(1, type);
        return;
      }
      uploaded += 1;
    }
    setUploading(false);
    setMessage({ type: "success", text: `已上传 ${uploaded} 个文件` });
    await load(1, type);
  }

  // 转存远程文件：把外部地址下载到本站媒体库后刷新列表
  async function handleImport(): Promise<void> {
    const url = importUrl.trim();
    if (!url) {
      setMessage({ type: "error", text: "请先填写要转存的文件地址" });
      return;
    }
    setImporting(true);
    setMessage(null);
    const result = await requestJsonBody<MediaFile>("/api/media/import", "POST", { url });
    setImporting(false);
    if (result.ok) {
      setImportUrl("");
      setMessage({ type: "success", text: `已转存：${result.data.originalName}` });
      await load(1, type);
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 删除媒体：同时删除磁盘文件与记录
  async function handleDelete(item: MediaFile): Promise<void> {
    if (!window.confirm(`确定删除「${item.originalName}」吗？正在使用该地址的文章会出现空图。`)) {
      return;
    }
    const result = await requestJsonBody<{ id: number }>(`/api/media/${item.id}`, "DELETE");
    if (result.ok) {
      setMessage({ type: "success", text: "媒体已删除" });
      const nextPage = items.length === 1 && page > 1 ? page - 1 : page;
      await load(nextPage, type);
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 复制媒体地址：拼接站点绝对地址后写入剪贴板
  async function handleCopy(item: MediaFile): Promise<void> {
    const absoluteUrl = `${window.location.origin}${item.url}`;
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setMessage({ type: "success", text: `已复制：${absoluteUrl}` });
    } catch {
      setMessage({ type: "error", text: `复制失败，请手动复制：${absoluteUrl}` });
    }
  }

  return (
    <div className="space-y-6">
      {message ? (
        <p
          role="status"
          className={
            message.type === "error"
              ? "rounded-lg bg-red-50 px-4 py-2 text-sm break-all text-red-600 dark:bg-red-500/10 dark:text-red-400"
              : "rounded-lg bg-emerald-50 px-4 py-2 text-sm break-all text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
          }
        >
          {message.text}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2">
          {typeFilters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => {
                setType(filter.value);
                void load(1, filter.value);
              }}
              className={
                type === filter.value
                  ? "rounded-lg bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-600 dark:bg-sky-950/60 dark:text-sky-300"
                  : "rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.zip,.7z,.rar,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.markdown,.csv,.json,.yaml,.yml,.log"
            className="hidden"
            onChange={(event) => void handleUpload(event)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sky-600 px-4 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 aria-hidden className="size-4 animate-spin" />
            ) : (
              <ImagePlus aria-hidden className="size-4" />
            )}
            {uploading ? "上传中…" : "上传文件"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <CloudDownload aria-hidden className="size-4 text-zinc-400" />
        <input
          value={importUrl}
          onChange={(event) => setImportUrl(event.target.value)}
          placeholder="https://example.com/image.jpg 或视频地址，转存到本站媒体库"
          className="min-w-64 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-sky-500/20"
        />
        <button
          type="button"
          onClick={() => void handleImport()}
          disabled={importing}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-4 text-sm text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {importing ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
          {importing ? "转存中…" : "转存到媒体库"}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">加载中…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-(--line-color) bg-white p-10 text-center text-sm text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          还没有媒体文件，点击右上角上传。
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex h-40 items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                {item.type === "IMAGE" ? (
                  // eslint-disable-next-line @next/next/no-img-element -- 媒体库展示上传原图，使用原生 img
                  <img src={item.url} alt={item.originalName} className="h-40 w-full object-cover" />
                ) : isVideoUrl(item.url) ? (
                  <video
                    src={item.url}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    onMouseEnter={(event) => void event.currentTarget.play()}
                    onMouseLeave={(event) => event.currentTarget.pause()}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <FileIcon aria-hidden className="size-10 text-zinc-400" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="truncate text-sm font-medium" title={item.originalName}>
                  {item.originalName}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatFileSize(item.size)} · {formatDate(new Date(item.createdAt))}
                </p>
                <div className="mt-auto flex items-center gap-3 pt-2 text-sm">
                  <button
                    type="button"
                    onClick={() => void handleCopy(item)}
                    className="text-sky-600 transition hover:text-sky-700 dark:text-sky-400"
                  >
                    复制地址
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(item)}
                    className="inline-flex items-center gap-1 text-red-600 transition hover:text-red-700 dark:text-red-400"
                  >
                    <Trash2 aria-hidden className="size-3.5" />
                    删除
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <span>
          共 {total} 个 · 第 {page} / {totalPages} 页
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => void load(page - 1, type)}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            上一页
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => void load(page + 1, type)}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}
