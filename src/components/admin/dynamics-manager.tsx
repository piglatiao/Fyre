"use client";

import { CalendarClock, ImagePlus, MapPin, Pin, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MarkdownEditor from "@/components/admin/markdown-editor";
import MediaPickerDialog from "@/components/admin/media-picker-dialog";
import { requestJsonBody } from "@/lib/api-client";
import { fromLocalInputValue, toLocalInputValue } from "@/lib/datetime-input";
import { formatDateTimeSeconds } from "@/lib/dynamic-time";
import type { AdminDynamicEntry } from "@/types/admin-dynamic-entry";
import type { DynamicImage } from "@/types/dynamic-image";
import type { MediaFile } from "@/types/media-file";

// 表单草稿：正文为 Markdown 原文，发布时间使用 datetime-local 字符串
interface DynamicFormDraft {
  content: string;
  images: DynamicImage[];
  location: string;
  pinned: boolean;
  publishedAtLocal: string;
}

// 表单初始值：发布时间留空表示立即发布
const emptyDraft: DynamicFormDraft = {
  content: "",
  images: [],
  location: "",
  pinned: false,
  publishedAtLocal: "",
};

// 配图数量上限（与接口 zod 校验保持一致）
const MAX_IMAGES = 9;
// 列表摘要的截断长度
const EXCERPT_LENGTH = 140;

// 正文转纯文本摘要：去掉图片/链接与 Markdown 符号后压缩空白
function toExcerpt(content: string): string {
  const plain = content
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*`~_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > EXCERPT_LENGTH ? `${plain.slice(0, EXCERPT_LENGTH)}…` : plain;
}

// 动态管理：服务端传入当前页数据，客户端负责列表、编辑与删除后刷新
export default function DynamicsManager({
  items,
  total,
  page,
  totalPages,
}: {
  items: AdminDynamicEntry[];
  total: number;
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<DynamicFormDraft>(emptyDraft);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  // 当前时间：挂载后写入，避免服务端与客户端首屏渲染不一致
  const [now, setNow] = useState(0);

  useEffect(() => {
    // 挂载后通过定时器写入当前时间：避免在 effect 内同步 setState 触发级联渲染
    const timer = window.setTimeout(() => setNow(Date.now()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  // 打开新建面板
  function startCreate(): void {
    setEditingId(null);
    setDraft(emptyDraft);
    setEditorOpen(true);
    setMessage(null);
  }

  // 打开编辑面板：回填 Markdown 原文、配图与发布时间
  function startEdit(item: AdminDynamicEntry): void {
    setEditingId(item.id);
    setDraft({
      content: item.content,
      images: item.images,
      location: item.location,
      pinned: item.pinned,
      publishedAtLocal: toLocalInputValue(item.publishedAt.toISOString()),
    });
    setEditorOpen(true);
    setMessage(null);
  }

  // 关闭编辑面板并清空草稿
  function closeEditor(): void {
    setEditorOpen(false);
    setEditingId(null);
    setDraft(emptyDraft);
  }

  // 提交保存：新建走 POST，编辑走 PATCH，成功后刷新服务端数据
  async function handleSave(): Promise<void> {
    setSaving(true);
    setMessage(null);
    const payload = {
      content: draft.content,
      images: draft.images,
      location: draft.location,
      pinned: draft.pinned,
      publishedAt: fromLocalInputValue(draft.publishedAtLocal),
    };
    const result = editingId
      ? await requestJsonBody<{ id: number }>(`/api/dynamics/${editingId}`, "PATCH", payload)
      : await requestJsonBody<{ id: number }>("/api/dynamics", "POST", payload);
    setSaving(false);
    if (result.ok) {
      setMessage({ type: "success", text: editingId ? "动态已更新" : "动态已发布" });
      closeEditor();
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 删除动态：确认后调用接口并刷新
  async function handleDelete(item: AdminDynamicEntry): Promise<void> {
    if (!window.confirm("确定删除这条动态吗？该操作不可恢复。")) {
      return;
    }
    const result = await requestJsonBody<{ id: number }>(`/api/dynamics/${item.id}`, "DELETE");
    if (result.ok) {
      setMessage({ type: "success", text: "动态已删除" });
      if (editingId === item.id) {
        closeEditor();
      }
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 从媒体库选图：去重并受数量上限约束
  function handlePickMedia(file: MediaFile): void {
    setPickerOpen(false);
    setDraft((current) => {
      if (current.images.length >= MAX_IMAGES) {
        return current;
      }
      if (current.images.some((image) => image.src === file.url)) {
        return current;
      }
      return { ...current, images: [...current.images, { alt: file.originalName ?? "", src: file.url }] };
    });
  }

  // 移除草稿中的第 index 张配图
  function removeImage(index: number): void {
    setDraft((current) => ({ ...current, images: current.images.filter((_, position) => position !== index) }));
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-sky-500/20";
  const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <div className="space-y-6">
      {message ? (
        <p
          role="status"
          className={
            message.type === "error"
              ? "rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400"
              : "rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
          }
        >
          {message.text}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">共 {total} 条动态，按置顶与发布时间排序。</p>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
        >
          发布动态
        </button>
      </div>

      {editorOpen ? (
        <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{editingId ? "编辑动态" : "发布新动态"}</h2>
            <button
              type="button"
              onClick={closeEditor}
              className="text-sm text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              取消
            </button>
          </div>
          <MarkdownEditor value={draft.content} onChange={(next) => setDraft({ ...draft, content: next })} />
          <div>
            <span className={labelClass}>配图（可选，最多 {MAX_IMAGES} 张，来自媒体库）</span>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {draft.images.map((image, index) => (
                <div key={`${image.src}-${index}`} className="relative">
                  <img
                    src={image.src}
                    alt={image.alt || `配图 ${index + 1}`}
                    className="h-20 w-20 rounded-xl border border-zinc-200 object-cover dark:border-zinc-700"
                  />
                  <button
                    type="button"
                    aria-label={`移除第 ${index + 1} 张配图`}
                    onClick={() => removeImage(index)}
                    className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-zinc-900 text-white shadow transition hover:bg-red-600 dark:bg-zinc-700 dark:hover:bg-red-600"
                  >
                    <X aria-hidden className="size-3" />
                  </button>
                </div>
              ))}
              {draft.images.length < MAX_IMAGES ? (
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-zinc-300 text-xs text-zinc-500 transition hover:border-sky-400 hover:text-sky-600 dark:border-zinc-600 dark:text-zinc-400 dark:hover:border-sky-500 dark:hover:text-sky-400"
                >
                  <ImagePlus aria-hidden className="size-4" />
                  选择配图
                </button>
              ) : null}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="dynamic-location" className={labelClass}>
                位置（可选）
              </label>
              <input
                id="dynamic-location"
                maxLength={64}
                value={draft.location}
                onChange={(event) => setDraft({ ...draft, location: event.target.value })}
                placeholder="如：广西"
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
            <div>
              <label htmlFor="dynamic-published-at" className={labelClass}>
                发布时间（留空为立即发布）
              </label>
              <input
                id="dynamic-published-at"
                type="datetime-local"
                value={draft.publishedAtLocal}
                onChange={(event) => setDraft({ ...draft, publishedAtLocal: event.target.value })}
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-700 sm:col-span-2 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={draft.pinned}
                onChange={(event) => setDraft({ ...draft, pinned: event.target.checked })}
                className="size-4"
              />
              置顶显示
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || draft.content.trim().length === 0}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-60"
            >
              {saving ? "保存中…" : editingId ? "保存修改" : "发布"}
            </button>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">发布时间设为未来时，前台到点才展示。</span>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-300 px-4 py-12 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            还没有动态，点击右上角「发布动态」写下第一条吧。
          </p>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1">
                  <CalendarClock aria-hidden className="size-3.5" />
                  {formatDateTimeSeconds(item.publishedAt)}
                </span>
                {item.pinned ? (
                  <span className="flex items-center gap-0.5 rounded-md bg-sky-50 px-1.5 py-0.5 font-medium text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
                    <Pin aria-hidden className="size-3" />
                    置顶
                  </span>
                ) : null}
                {now > 0 && item.publishedAt.getTime() > now ? (
                  <span className="rounded-md bg-amber-50 px-1.5 py-0.5 font-medium text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                    定时
                  </span>
                ) : null}
                {item.location ? (
                  <span className="flex items-center gap-1">
                    <MapPin aria-hidden className="size-3.5" />
                    {item.location}
                  </span>
                ) : null}
                <span>{item.images.length} 张配图</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{toExcerpt(item.content)}</p>
              {item.images.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.images.map((image, index) => (
                    <img
                      key={`${image.src}-${index}`}
                      src={image.src}
                      alt={image.alt || `配图 ${index + 1}`}
                      className="h-16 w-16 rounded-lg border border-zinc-200 object-cover dark:border-zinc-700"
                    />
                  ))}
                </div>
              ) : null}
              <div className="mt-3 flex items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="text-sky-600 transition hover:text-sky-700 dark:text-sky-400"
                >
                  编辑
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(item)}
                  className="text-red-600 transition hover:text-red-700 dark:text-red-400"
                >
                  删除
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {totalPages > 1 ? (
        <nav aria-label="分页导航" className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
          <span>
            第 {page} / {totalPages} 页
          </span>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={`/admin/dynamics?page=${page - 1}`}
                rel="prev"
                className="rounded-lg border border-zinc-200 px-3 py-1.5 transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                上一页
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link
                href={`/admin/dynamics?page=${page + 1}`}
                rel="next"
                className="rounded-lg border border-zinc-200 px-3 py-1.5 transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                下一页
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}

      {pickerOpen ? (
        <MediaPickerDialog filter="IMAGE" onSelect={handlePickMedia} onClose={() => setPickerOpen(false)} />
      ) : null}
    </div>
  );
}