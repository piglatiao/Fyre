"use client";

import { Eye, FileDown, FileUp, ImagePlus, Images, Loader2, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ChangeEvent, ClipboardEvent, DragEvent } from "react";
import { useEffect, useRef, useState } from "react";
import MarkdownContent from "@/components/site/markdown-content";
import { requestJson, requestJsonBody } from "@/lib/api-client";
import { fromLocalInputValue, toLocalInputValue } from "@/lib/datetime-input";
import { parseFrontMatter, readListValue } from "@/lib/markdown-front-matter";
import type { AdminCategoryItem } from "@/types/admin-category-item";
import type { AdminPostFormData } from "@/types/admin-post-form-data";
import type { MarkdownResult } from "@/types/markdown-result";
import type { MediaFile } from "@/types/media-file";
import type { PostStatus } from "@/generated/prisma/client";
import { uploadMediaFile } from "@/lib/upload-media-file";
import type { TagItem } from "@/types/tag-item";
import MediaPickerDialog from "./media-picker-dialog";
import MediaUrlField from "./media-url-field";
import MarkdownInsertToolbar from "./markdown-insert-toolbar";

// 状态选项
const STATUS_OPTIONS: { value: PostStatus; label: string }[] = [
  { value: "DRAFT", label: "草稿" },
  { value: "SCHEDULED", label: "定时发布" },
  { value: "PUBLISHED", label: "发布" },
  { value: "PRIVATE", label: "私密" },
];

// 预览防抖时长（毫秒）
const PREVIEW_DEBOUNCE_MS = 600;

// 后台文章编辑器：分栏 Markdown 编辑 + 服务端实时预览 + 图片上传插入
export default function PostEditor({ postId }: { postId?: number }) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const mdInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [status, setStatus] = useState<PostStatus>("DRAFT");
  const [pinned, setPinned] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [publishedAtLocal, setPublishedAtLocal] = useState("");
  const [scheduledAtLocal, setScheduledAtLocal] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [series, setSeries] = useState("");
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [encrypted, setEncrypted] = useState(false);
  const [password, setPassword] = useState("");

  const [categories, setCategories] = useState<AdminCategoryItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [preview, setPreview] = useState<MarkdownResult>({ html: "", toc: [] });
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(postId));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // 加载分类与标签选项
  useEffect(() => {
    void (async () => {
      const [categoryResult, tagResult] = await Promise.all([
        requestJson<AdminCategoryItem[]>("/api/categories"),
        requestJson<TagItem[]>("/api/tags"),
      ]);
      if (categoryResult.ok) {
        setCategories(categoryResult.data);
      }
      if (tagResult.ok) {
        setTags(tagResult.data);
      }
    })();
  }, []);

  // 编辑模式：回填文章数据
  useEffect(() => {
    if (!postId) {
      return;
    }
    void (async () => {
      const result = await requestJson<AdminPostFormData>(`/api/posts/${postId}`);
      if (result.ok) {
        const data = result.data;
        setTitle(data.title);
        setSlug(data.slug);
        setSavedSlug(data.slug);
        setContent(data.content);
        setExcerpt(data.excerpt ?? "");
        setCoverUrl(data.coverUrl ?? "");
        setStatus(data.status);
        setPinned(data.pinned);
        setSeoTitle(data.seoTitle ?? "");
        setSeoDescription(data.seoDescription ?? "");
        setSeoKeywords(data.seoKeywords ?? "");
        setPublishedAtLocal(toLocalInputValue(data.publishedAt));
        setScheduledAtLocal(toLocalInputValue(data.scheduledAt));
        setCategoryId(data.categoryId ? String(data.categoryId) : "");
        setSeries(data.series ?? "");
        setTagIds(data.tagIds);
        setEncrypted(data.encrypted);
      } else {
        setMessage({ type: "error", text: result.error.message });
      }
      setLoading(false);
    })();
  }, [postId]);

  // 正文变化后防抖请求预览
  useEffect(() => {
    const timer = setTimeout(() => {
      void (async () => {
        if (!content.trim()) {
          setPreview({ html: "", toc: [] });
          return;
        }
        const result = await requestJsonBody<MarkdownResult>("/api/preview", "POST", { content });
        setPreview(result.ok ? result.data : { html: "", toc: [] });
      })();
    }, PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [content]);

  // 在光标处插入文本片段（用函数式更新，连续插入多张图片时不会互相覆盖）
  function insertAtCursor(snippet: string, caretOffset = snippet.length): void {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((current) => `${current}\n${snippet}\n`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    setContent((current) => `${current.slice(0, start)}${snippet}${current.slice(end)}`);
    requestAnimationFrame(() => {
      textarea.focus();
      const position = start + caretOffset;
      textarea.setSelectionRange(position, position);
    });
  }

  // 上传单张图片并插入 Markdown 语法：按钮、粘贴、拖拽三种入口共用
  async function uploadAndInsert(file: File): Promise<void> {
    setUploading(true);
    setMessage(null);
    const result = await uploadMediaFile(file);
    setUploading(false);
    if (result.ok) {
      insertAtCursor(`\n![${file.name}](${result.data.url})\n`);
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 上传图片：成功后把 Markdown 图片语法插入正文光标处
  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      await uploadAndInsert(file);
    }
  }

  // 粘贴截图：依次上传剪贴板中的图片并插入正文
  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>): void {
    const files = Array.from(event.clipboardData?.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (files.length === 0) {
      return;
    }
    event.preventDefault();
    void (async () => {
      for (const file of files) {
        await uploadAndInsert(file);
      }
    })();
  }

  // 拖拽图片到编辑器：依次上传并插入正文
  function handleDrop(event: DragEvent<HTMLTextAreaElement>): void {
    const files = Array.from(event.dataTransfer?.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (files.length === 0) {
      return;
    }
    event.preventDefault();
    void (async () => {
      for (const file of files) {
        await uploadAndInsert(file);
      }
    })();
  }

  // 从媒体库选图后插入正文
  function handlePickMedia(item: MediaFile): void {
    insertAtCursor(`\n![${item.originalName}](${item.url})\n`);
    setPickerOpen(false);
  }


  // 导入 Markdown 文件：解析头部信息回填表单，正文进入编辑器
  async function handleImportMd(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    const text = await file.text();
    const { data, content: body } = parseFrontMatter(text);
    const headingMatch = /^#\s+(.+)$/m.exec(body);
    const fallbackTitle = file.name.replace(/\.[^.]+$/, "");
    setTitle(data.title || headingMatch?.[1]?.trim() || fallbackTitle);
    if (data.slug) {
      setSlug(data.slug);
    }
    if (data.excerpt) {
      setExcerpt(data.excerpt);
    }
    if (data.series) {
      setSeries(data.series);
    }
    const tagNames = readListValue(data.tags);
    if (tagNames.length > 0) {
      const matchedIds = tags
        .filter((tag) => tagNames.some((name) => name.toLowerCase() === tag.name.toLowerCase()))
        .map((tag) => tag.id);
      if (matchedIds.length > 0) {
        setTagIds(matchedIds);
      }
    }
    setContent(body);
    setMessage({ type: "success", text: `已从 ${file.name} 导入内容` });
  }

  // 保存文章：新建走 POST，编辑走 PUT
  async function handleSave(): Promise<void> {
    setSaving(true);
    setMessage(null);
    const payload = {
      title,
      slug,
      content,
      excerpt: excerpt || null,
      coverUrl: coverUrl || null,
      status,
      pinned,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      seoKeywords: seoKeywords || null,
      publishedAt: fromLocalInputValue(publishedAtLocal),
      scheduledAt: fromLocalInputValue(scheduledAtLocal),
      categoryId: categoryId ? Number(categoryId) : null,
      tagIds,
      series: series || null,
      encrypted,
      password: password || null,
    };
    const result = postId
      ? await requestJsonBody<{ id: number }>(`/api/posts/${postId}`, "PUT", payload)
      : await requestJsonBody<{ id: number }>("/api/posts", "POST", payload);
    setSaving(false);
    if (result.ok) {
      setSavedSlug(slug || savedSlug);
      setMessage({ type: "success", text: "保存成功" });
      if (!postId) {
        router.replace(`/admin/posts/${result.data.id}`);
      }
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 删除文章
  async function handleDelete(): Promise<void> {
    if (!postId || !window.confirm("确定删除这篇文章吗？该操作不可恢复。")) {
      return;
    }
    const result = await requestJsonBody<{ removed: number }>(`/api/posts/${postId}`, "DELETE");
    if (result.ok) {
      router.push("/admin/posts");
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">加载中…</p>;
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-sky-500/20";
  const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{postId ? "编辑文章" : "新建文章"}</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            支持 Markdown 与 GFM 扩展，图片可直接上传插入。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={mdInputRef}
            type="file"
            accept=".md,.markdown,.txt,text/markdown,text/plain"
            className="hidden"
            onChange={(event) => void handleImportMd(event)}
          />
          <button
            type="button"
            onClick={() => mdInputRef.current?.click()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <FileUp aria-hidden className="size-4" />
            导入 MD
          </button>
          {postId ? (
            <a
              href={`/api/posts/${postId}/markdown`}
              download
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <FileDown aria-hidden className="size-4" />
              下载 MD
            </a>
          ) : null}
          {postId && savedSlug && status === "PUBLISHED" ? (
            <Link
              href={`/posts/${savedSlug}`}
              target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Eye aria-hidden className="size-4" />
              查看前台
            </Link>
          ) : null}
          {postId ? (
            <button
              type="button"
              onClick={() => void handleDelete()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-sm text-red-600 transition hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
            >
              <Trash2 aria-hidden className="size-4" />
              删除
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sky-600 px-4 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Save aria-hidden className="size-4" />}
            保存
          </button>
        </div>
      </div>

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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <label htmlFor="post-title" className={labelClass}>
                标题
              </label>
              <input
                id="post-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="请输入文章标题"
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
            <div>
              <label htmlFor="post-slug" className={labelClass}>
                slug（留空自动生成）
              </label>
              <input
                id="post-slug"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="例如 hello-firefly"
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
            <div>
              <label htmlFor="post-excerpt" className={labelClass}>
                摘要（留空由正文自动生成）
              </label>
              <textarea
                id="post-excerpt"
                value={excerpt}
                onChange={(event) => setExcerpt(event.target.value)}
                rows={2}
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
              <h2 className="text-sm font-semibold">正文</h2>
              <div className="flex items-center gap-2">
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
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 text-xs text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <Images aria-hidden className="size-3.5" />
                  媒体库插图
                </button>
              </div>
            </div>
            <MarkdownInsertToolbar onInsert={insertAtCursor} />
            <div className="grid divide-y divide-zinc-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0 dark:divide-zinc-800">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                onPaste={handlePaste}
                onDrop={handleDrop}
                onDragOver={(event) => {
                  if (Array.from(event.dataTransfer?.items ?? []).some((item) => item.kind === "file")) {
                    event.preventDefault();
                  }
                }}
                placeholder="使用 Markdown 撰写正文…（支持粘贴/拖拽图片自动上传）"
                spellCheck={false}
                className="min-h-96 w-full resize-y bg-transparent p-5 font-mono text-sm leading-relaxed outline-none"
              />
              <div className="max-h-[36rem] min-h-96 overflow-y-auto p-5">
                {preview.html ? (
                  <MarkdownContent html={preview.html} />
                ) : (
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">输入正文后这里会显示渲染预览。</p>
                )}
              </div>
            </div>
          </div>

          <details className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <summary className="cursor-pointer text-sm font-semibold">SEO 设置（可选）</summary>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="post-seo-title" className={labelClass}>
                  SEO 标题
                </label>
                <input
                  id="post-seo-title"
                  value={seoTitle}
                  onChange={(event) => setSeoTitle(event.target.value)}
                  className={`mt-1.5 ${inputClass}`}
                />
              </div>
              <div>
                <label htmlFor="post-seo-description" className={labelClass}>
                  SEO 描述
                </label>
                <textarea
                  id="post-seo-description"
                  value={seoDescription}
                  onChange={(event) => setSeoDescription(event.target.value)}
                  rows={2}
                  className={`mt-1.5 ${inputClass}`}
                />
              </div>
              <div>
                <label htmlFor="post-seo-keywords" className={labelClass}>
                  SEO 关键词（英文逗号分隔）
                </label>
                <input
                  id="post-seo-keywords"
                  value={seoKeywords}
                  onChange={(event) => setSeoKeywords(event.target.value)}
                  className={`mt-1.5 ${inputClass}`}
                />
              </div>
            </div>
          </details>
        </div>

        <aside className="space-y-6">
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold">发布设置</h2>
            <div>
              <label htmlFor="post-status" className={labelClass}>
                状态
              </label>
              <select
                id="post-status"
                value={status}
                onChange={(event) => setStatus(event.target.value as PostStatus)}
                className={`mt-1.5 ${inputClass}`}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {status === "SCHEDULED" ? (
              <div>
                <label htmlFor="post-scheduled" className={labelClass}>
                  定时时间
                </label>
                <input
                  id="post-scheduled"
                  type="datetime-local"
                  value={scheduledAtLocal}
                  onChange={(event) => setScheduledAtLocal(event.target.value)}
                  className={`mt-1.5 ${inputClass}`}
                />
              </div>
            ) : null}
            {status === "PUBLISHED" ? (
              <div>
                <label htmlFor="post-published" className={labelClass}>
                  发布时间（留空取当前时间）
                </label>
                <input
                  id="post-published"
                  type="datetime-local"
                  value={publishedAtLocal}
                  onChange={(event) => setPublishedAtLocal(event.target.value)}
                  className={`mt-1.5 ${inputClass}`}
                />
              </div>
            ) : null}
            <div>
              <label htmlFor="post-category" className={labelClass}>
                分类
              </label>
              <select
                id="post-category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className={`mt-1.5 ${inputClass}`}
              >
                <option value="">无分类</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="post-series" className={labelClass}>
                所属系列
              </label>
              <input
                id="post-series"
                value={series}
                maxLength={60}
                onChange={(event) => setSeries(event.target.value)}
                placeholder="例如：流萤使用指南（留空表示不归类）"
                className={`mt-1.5 ${inputClass}`}
              />
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                同系列文章会按发布时间自动编号，可在前台「系列」页集中浏览。
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(event) => setPinned(event.target.checked)}
              />
              置顶展示
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={encrypted}
                onChange={(event) => setEncrypted(event.target.checked)}
              />
              密码保护（需输入密码才能查看）
            </label>
            {encrypted ? (
              <div>
                <label htmlFor="post-password" className={labelClass}>
                  访问密码{postId ? "（留空保持原密码）" : ""}
                </label>
                <input
                  id="post-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={postId ? "留空则不修改已有密码" : "请输入访问密码"}
                  className={`mt-1.5 ${inputClass}`}
                />
              </div>
            ) : null}
          </div>

          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold">封面</h2>
            <MediaUrlField
              id="post-cover"
              label="封面图地址"
              value={coverUrl}
              onChange={setCoverUrl}
              placeholder="/uploads/… 或外部图片地址"
              hint="可从媒体库选择，或直接上传新图片"
              inputClass={inputClass}
              labelClass={labelClass}
            />
          </div>

          <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold">标签</h2>
            {tags.length > 0 ? (
              <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={tagIds.includes(tag.id)}
                      onChange={(event) =>
                        setTagIds((current) =>
                          event.target.checked
                            ? [...current, tag.id]
                            : current.filter((item) => item !== tag.id),
                        )
                      }
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 dark:text-zinc-500">暂无标签，可先在标签管理中创建。</p>
            )}
          </div>
        </aside>
      </div>

      {pickerOpen ? (
        <MediaPickerDialog filter="IMAGE" onSelect={handlePickMedia} onClose={() => setPickerOpen(false)} />
      ) : null}
    </div>
  );
}
