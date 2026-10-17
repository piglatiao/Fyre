"use client";

import { FileIcon, ImagePlus, Loader2, X } from "lucide-react";
import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { requestJson } from "@/lib/api-client";
import { formatDate } from "@/lib/format-date";
import { isVideoUrl } from "@/lib/media-url";
import { uploadMediaFile } from "@/lib/upload-media-file";
import type { MediaFile } from "@/types/media-file";
import type { PageResult } from "@/types/page-result";

// 弹窗每页展示的媒体数量
const PAGE_SIZE = 24;
// 选择器分类页签
const tabs = [
  { value: "IMAGE", label: "图片" },
  { value: "VIDEO", label: "视频" },
  { value: "ALL", label: "全部" },
  { value: "FILE", label: "其它文件" },
] as const;

type MediaPickerTab = (typeof tabs)[number]["value"];

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

// 媒体选择弹窗：挂载即打开，浏览媒体库并回填地址，支持先上传再选中
export default function MediaPickerDialog({
  filter,
  onSelect,
  onClose,
}: {
  filter: "IMAGE" | "ALL";
  onSelect: (item: MediaFile) => void;
  onClose: () => void;
}) {
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [tab, setTab] = useState<MediaPickerTab>(filter);
  const [items, setItems] = useState<MediaFile[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  // 挂载即按初始页签加载，并锁住页面滚动
  useEffect(() => {
    void (async () => {
      await load(1, filter);
    })();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [filter]);

  // Esc 关闭弹窗
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // 拉取媒体分页列表：视频与其它文件按地址二次过滤
  async function load(targetPage: number, targetTab: MediaPickerTab): Promise<void> {
    setLoading(true);
    setMessage("");
    const query = new URLSearchParams({ page: String(targetPage), pageSize: String(PAGE_SIZE) });
    if (targetTab === "IMAGE") {
      query.set("type", "IMAGE");
    }
    if (targetTab === "VIDEO" || targetTab === "FILE") {
      query.set("type", "FILE");
    }
    const result = await requestJson<PageResult<MediaFile>>(`/api/media?${query.toString()}`);
    if (result.ok) {
      const filtered = result.data.items.filter((item) => {
        if (targetTab === "VIDEO") {
          return isVideoUrl(item.url);
        }
        if (targetTab === "FILE") {
          return !isVideoUrl(item.url);
        }
        return true;
      });
      setItems(filtered);
      setPage(result.data.page);
      setTotal(result.data.total);
      setTotalPages(result.data.totalPages);
    } else {
      setMessage(result.error.message);
      setItems([]);
    }
    setLoading(false);
  }

  // 在弹窗内直接上传：成功后立即选中该文件
  async function handleUpload(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    setUploading(true);
    setMessage("");
    const result = await uploadMediaFile(file);
    setUploading(false);
    if (result.ok) {
      onSelect(result.data);
      onClose();
    } else {
      setMessage(result.error.message);
    }
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="从媒体库选择"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-3.5 dark:border-zinc-800">
          <h2 className="text-sm font-semibold">从媒体库选择</h2>
          <div className="flex items-center gap-2">
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*,video/mp4,video/webm,audio/*,.pdf,.zip,.7z,.rar,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.markdown,.csv,.json,.yaml,.yml,.log"
              className="hidden"
              onChange={(event) => void handleUpload(event)}
            />
            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-sky-600 px-3 text-xs font-medium text-white transition hover:bg-sky-700 disabled:opacity-60"
            >
              {uploading ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : <ImagePlus aria-hidden className="size-3.5" />}
              {uploading ? "上传中…" : "上传新文件"}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭"
              className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-2.5 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            {tabs.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setTab(item.value);
                  void load(1, item.value);
                }}
                className={
                  tab === item.value
                    ? "rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-600 dark:bg-sky-950/60 dark:text-sky-300"
                    : "rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }
              >
                {item.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">共 {total} 个</span>
        </div>

        {message ? (
          <p className="border-b border-zinc-200 px-5 py-2 text-xs text-red-600 dark:border-zinc-800 dark:text-red-400">{message}</p>
        ) : null}

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">加载中…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">该分类下还没有文件，可点右上角上传。</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    title={item.originalName}
                    className="group w-full overflow-hidden rounded-xl border border-zinc-200 text-left transition hover:border-sky-400 hover:shadow-md dark:border-zinc-700"
                  >
                    <span className="flex h-24 items-center justify-center overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                      {item.type === "IMAGE" ? (
                        // eslint-disable-next-line @next/next/no-img-element -- 媒体库展示上传原图，使用原生 img
                        <img src={item.url} alt={item.originalName} className="size-full object-cover" />
                      ) : isVideoUrl(item.url) ? (
                        <video src={item.url} muted loop playsInline preload="metadata" className="size-full object-cover" />
                      ) : (
                        <FileIcon aria-hidden className="size-8 text-zinc-400" />
                      )}
                    </span>
                    <span className="block px-2.5 py-2">
                      <span className="block truncate text-xs font-medium">{item.originalName}</span>
                      <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                        {formatFileSize(item.size)} · {formatDate(new Date(item.createdAt))}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 px-5 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => void load(page - 1, tab)}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            上一页
          </button>
          <span>
            第 {page} / {totalPages} 页
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => void load(page + 1, tab)}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}