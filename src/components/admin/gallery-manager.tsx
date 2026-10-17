"use client";

import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Images,
  LockKeyhole,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestJsonBody } from "@/lib/api-client";
import { formatDateKey } from "@/lib/format-date";
import type { AdminGalleryAlbum } from "@/types/admin-gallery-album";
import MediaUrlField from "./media-url-field";

// 照片草稿：key 仅用于 React 列表与字段 id，保存时转换为 sortOrder
interface PhotoDraft {
  key: number;
  imageUrl: string;
  caption: string;
}

// 相册表单草稿
interface GalleryDraft {
  title: string;
  slug: string;
  description: string;
  coverUrl: string;
  eventDate: string;
  location: string;
  tagsText: string;
  password: string;
  passwordHint: string;
  clearPassword: boolean;
  sortOrder: string;
  enabled: boolean;
  photos: PhotoDraft[];
}

let photoKeySeed = 0;

// 创建照片草稿并分配稳定的前端 key
function createPhotoDraft(imageUrl = "", caption = ""): PhotoDraft {
  photoKeySeed += 1;
  return { key: photoKeySeed, imageUrl, caption };
}

// 空白相册表单
function createEmptyGallery(): GalleryDraft {
  return {
    title: "",
    slug: "",
    description: "",
    coverUrl: "",
    eventDate: "",
    location: "",
    tagsText: "",
    password: "",
    passwordHint: "",
    clearPassword: false,
    sortOrder: "0",
    enabled: true,
    photos: [],
  };
}

// 提交前把标签文本拆成数组
function readTags(value: string): string[] {
  return value
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

// 相册管理：相册元信息、封面、密码、启用状态与照片列表
export default function GalleryManager({ albums }: { albums: AdminGalleryAlbum[] }) {
  const router = useRouter();
  const [form, setForm] = useState<GalleryDraft>(createEmptyGallery);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingPasswordConfigured, setEditingPasswordConfigured] = useState(false);
  const [deleting, setDeleting] = useState<AdminGalleryAlbum | null>(null);
  const [busyKey, setBusyKey] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const inputClass =
    "w-full rounded-lg border border-(--line-color) bg-transparent px-3 py-2 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15";
  const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
  const smallButtonClass =
    "inline-flex h-8 items-center gap-1.5 rounded-lg border border-(--line-color) px-2.5 text-xs font-medium transition hover:border-(--primary) hover:text-(--primary) disabled:opacity-60";

  // 构造接口载荷：照片按当前界面顺序换算为倒序权重
  function buildPayload(draft: GalleryDraft) {
    return {
      title: draft.title,
      slug: draft.slug,
      description: draft.description,
      coverUrl: draft.coverUrl,
      eventDate: draft.eventDate,
      location: draft.location,
      tags: readTags(draft.tagsText),
      password: draft.password,
      passwordHint: draft.passwordHint,
      clearPassword: draft.clearPassword,
      sortOrder: Number.parseInt(draft.sortOrder, 10) || 0,
      enabled: draft.enabled,
      photos: draft.photos.map((photo, index) => ({
        imageUrl: photo.imageUrl,
        caption: photo.caption,
        sortOrder: (draft.photos.length - index) * 10,
      })),
    };
  }

  // 保存相册：编辑走 PUT，新建走 POST
  async function handleSave(): Promise<void> {
    setBusyKey("save");
    setMessage(null);
    const result = editingId
      ? await requestJsonBody<{ id: number }>(`/api/gallery/albums/${editingId}`, "PUT", buildPayload(form))
      : await requestJsonBody<{ id: number }>("/api/gallery/albums", "POST", buildPayload(form));
    setBusyKey("");
    if (result.ok) {
      setMessage({ type: "success", text: editingId ? "相册已更新，前台即时生效" : "相册已创建，前台即时生效" });
      setEditingId(null);
      setEditingPasswordConfigured(false);
      setForm(createEmptyGallery());
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 编辑相册：回填元信息与照片，密码始终留空以免泄露
  function startEdit(album: AdminGalleryAlbum): void {
    setEditingId(album.id);
    setEditingPasswordConfigured(album.passwordConfigured);
    setForm({
      title: album.title,
      slug: album.slug,
      description: album.description,
      coverUrl: album.coverUrl,
      eventDate: album.eventDate ? formatDateKey(album.eventDate) : "",
      location: album.location,
      tagsText: album.tags.join(", "),
      password: "",
      passwordHint: album.passwordHint,
      clearPassword: false,
      sortOrder: String(album.sortOrder),
      enabled: album.enabled,
      photos: album.photos.map((photo) => createPhotoDraft(photo.imageUrl, photo.caption)),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 退出编辑并恢复空白表单
  function cancelEdit(): void {
    setEditingId(null);
    setEditingPasswordConfigured(false);
    setForm(createEmptyGallery());
    setMessage(null);
  }

  // 快速启用或停用相册
  async function handleToggle(album: AdminGalleryAlbum): Promise<void> {
    setBusyKey(`toggle-${album.id}`);
    setMessage(null);
    const result = await requestJsonBody<{ id: number }>(`/api/gallery/albums/${album.id}`, "PUT", {
      title: album.title,
      slug: album.slug,
      description: album.description,
      coverUrl: album.coverUrl,
      eventDate: album.eventDate ? formatDateKey(album.eventDate) : "",
      location: album.location,
      tags: album.tags,
      password: "",
      passwordHint: album.passwordHint,
      clearPassword: false,
      sortOrder: album.sortOrder,
      enabled: !album.enabled,
      photos: album.photos.map((photo) => ({
        imageUrl: photo.imageUrl,
        caption: photo.caption,
        sortOrder: photo.sortOrder,
      })),
    });
    setBusyKey("");
    if (result.ok) {
      setMessage({ type: "success", text: album.enabled ? `已停用「${album.title}」` : `已启用「${album.title}」` });
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 删除相册及其全部照片
  async function handleDelete(): Promise<void> {
    if (!deleting) {
      return;
    }
    setBusyKey("delete");
    setMessage(null);
    const result = await requestJsonBody<{ id: number }>(`/api/gallery/albums/${deleting.id}`, "DELETE");
    setBusyKey("");
    if (result.ok) {
      setMessage({ type: "success", text: `已删除「${deleting.title}」` });
      setDeleting(null);
      if (editingId === deleting.id) {
        cancelEdit();
      }
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 更新单张照片草稿
  function updatePhoto(key: number, patch: Partial<PhotoDraft>): void {
    setForm((current) => ({
      ...current,
      photos: current.photos.map((photo) => (photo.key === key ? { ...photo, ...patch } : photo)),
    }));
  }

  // 调整照片顺序：-1 上移，1 下移
  function movePhoto(index: number, offset: -1 | 1): void {
    setForm((current) => {
      const target = index + offset;
      if (target < 0 || target >= current.photos.length) {
        return current;
      }
      const photos = [...current.photos];
      const [photo] = photos.splice(index, 1);
      photos.splice(target, 0, photo);
      return { ...current, photos };
    });
  }

  // 移除一张照片草稿
  function removePhoto(key: number): void {
    setForm((current) => ({ ...current, photos: current.photos.filter((photo) => photo.key !== key) }));
  }

  const canSave = form.title.trim().length > 0 && form.slug.trim().length > 0;

  return (
    <div className="space-y-6">
      {message ? (
        <p
          role="status"
          className={
            message.type === "error"
              ? "rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400"
              : "rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
          }
        >
          {message.text}
        </p>
      ) : null}

      <section className="rounded-2xl border border-(--line-color) bg-(--card-bg-transparent) p-5 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-(--btn-regular-bg) text-(--primary)">
              {editingId ? <Pencil aria-hidden className="size-4" /> : <Plus aria-hidden className="size-4" />}
            </span>
            <div>
              <h2 className="text-sm font-semibold">{editingId ? "编辑相册" : "新增相册"}</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                封面与照片均支持直接上传或从媒体库选择，保存后前台即时生效。
              </p>
            </div>
          </div>
          {editingId ? (
            <button type="button" onClick={cancelEdit} className={smallButtonClass}>
              <X aria-hidden className="size-3.5" />
              取消编辑
            </button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label htmlFor="gallery-title" className={labelClass}>
              相册名称
            </label>
            <input
              id="gallery-title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="例如：可爱流萤"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="gallery-slug" className={labelClass}>
              相册标识
            </label>
            <input
              id="gallery-slug"
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              placeholder="firefly-2026"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="gallery-date" className={labelClass}>
              相册日期
            </label>
            <input
              id="gallery-date"
              type="date"
              value={form.eventDate}
              onChange={(event) => setForm({ ...form, eventDate: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="gallery-location" className={labelClass}>
              拍摄地点
            </label>
            <input
              id="gallery-location"
              value={form.location}
              onChange={(event) => setForm({ ...form, location: event.target.value })}
              placeholder="例如：崩坏：星穹铁道"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="gallery-tags" className={labelClass}>
              标签
            </label>
            <input
              id="gallery-tags"
              value={form.tagsText}
              onChange={(event) => setForm({ ...form, tagsText: event.target.value })}
              placeholder="流萤, 崩坏星穹铁道"
              className={`mt-1.5 ${inputClass}`}
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">使用逗号分隔，最多 12 个。</p>
          </div>
          <div>
            <label htmlFor="gallery-sort" className={labelClass}>
              排序权重（越大越靠前）
            </label>
            <input
              id="gallery-sort"
              type="number"
              value={form.sortOrder}
              onChange={(event) => setForm({ ...form, sortOrder: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <label htmlFor="gallery-description" className={labelClass}>
              相册简介
            </label>
            <textarea
              id="gallery-description"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={3}
              placeholder="一句话描述这个相册记录的故事"
              className={`mt-1.5 resize-y ${inputClass}`}
            />
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <MediaUrlField
              id="gallery-cover"
              label="封面图片"
              value={form.coverUrl}
              onChange={(next) => setForm({ ...form, coverUrl: next })}
              inputClass={inputClass}
              labelClass={labelClass}
              placeholder="留空时自动使用第一张照片作为封面"
              hint="建议使用横向图片，列表按 2:1、详情横幅按 3:1 展示。"
            />
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-(--line-color) p-4">
          <div className="flex flex-wrap items-center gap-2">
            <LockKeyhole aria-hidden className="size-4 text-(--primary)" />
            <h3 className="text-sm font-semibold">访问密码</h3>
            {editingId && editingPasswordConfigured ? (
              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                已设置密码
              </span>
            ) : (
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                公开相册
              </span>
            )}
          </div>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="gallery-password" className={labelClass}>
                {editingId ? "新密码（留空保持原密码）" : "访问密码（留空为公开相册）"}
              </label>
              <input
                id="gallery-password"
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                autoComplete="new-password"
                placeholder={editingId ? "不修改请留空" : "可选"}
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
            <div>
              <label htmlFor="gallery-password-hint" className={labelClass}>
                密码提示
              </label>
              <input
                id="gallery-password-hint"
                value={form.passwordHint}
                onChange={(event) => setForm({ ...form, passwordHint: event.target.value })}
                placeholder="例如：示例密码123456"
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
            {editingId && editingPasswordConfigured ? (
              <label className="flex items-center gap-2 text-sm text-zinc-700 md:col-span-2 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={form.clearPassword}
                  onChange={(event) => setForm({ ...form, clearPassword: event.target.checked })}
                  className="size-4 accent-(--primary)"
                />
                清除现有密码，把相册改为公开访问
              </label>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            密码只保存哈希；编辑时不会回显。若同时填写新密码，会优先使用新密码。
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-(--line-color) p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Images aria-hidden className="size-4 text-(--primary)" />
              <h3 className="text-sm font-semibold">照片列表</h3>
              <span className="rounded-md bg-(--btn-regular-bg) px-1.5 py-0.5 text-[11px] text-(--btn-content)">
                {form.photos.length} / 100
              </span>
            </div>
            <button
              type="button"
              disabled={form.photos.length >= 100}
              onClick={() => setForm((current) => ({ ...current, photos: [...current.photos, createPhotoDraft()] }))}
              className={smallButtonClass}
            >
              <Plus aria-hidden className="size-3.5" />
              添加照片
            </button>
          </div>

          {form.photos.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-(--line-color) px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
              还没有照片，点击「添加照片」后上传或从媒体库选择。
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {form.photos.map((photo, index) => (
                <div key={photo.key} className="rounded-xl border border-(--line-color) bg-(--card-bg-transparent) p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">照片 {index + 1}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        aria-label="上移照片"
                        title="上移"
                        disabled={index === 0}
                        onClick={() => movePhoto(index, -1)}
                        className={smallButtonClass}
                      >
                        <ArrowUp aria-hidden className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="下移照片"
                        title="下移"
                        disabled={index === form.photos.length - 1}
                        onClick={() => movePhoto(index, 1)}
                        className={smallButtonClass}
                      >
                        <ArrowDown aria-hidden className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="删除照片"
                        title="删除"
                        onClick={() => removePhoto(photo.key)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        <Trash2 aria-hidden className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
                    <MediaUrlField
                      id={`gallery-photo-${photo.key}`}
                      label="照片地址"
                      value={photo.imageUrl}
                      onChange={(next) => updatePhoto(photo.key, { imageUrl: next })}
                      inputClass={inputClass}
                      labelClass={labelClass}
                      placeholder="/uploads/… 或外部图片地址"
                    />
                    <div>
                      <label htmlFor={`gallery-photo-caption-${photo.key}`} className={labelClass}>
                        照片说明
                      </label>
                      <input
                        id={`gallery-photo-caption-${photo.key}`}
                        value={photo.caption}
                        onChange={(event) => updatePhoto(photo.key, { caption: event.target.value })}
                        placeholder="可选，会显示在灯箱中"
                        className={`mt-1.5 ${inputClass}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busyKey === "save" || !canSave}
            onClick={() => void handleSave()}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-(--btn-content) px-4 text-sm font-medium text-white transition hover:bg-(--primary) disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save aria-hidden className="size-4" />
            {busyKey === "save" ? "保存中…" : editingId ? "保存相册" : "创建相册"}
          </button>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => setForm({ ...form, enabled: event.target.checked })}
              className="size-4 accent-(--primary)"
            />
            保存后立即在前台显示
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-(--line-color) bg-(--card-bg-transparent) p-5 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">全部相册</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">共 {albums.length} 个相册，可快速查看、编辑、启停或删除。</p>
          </div>
        </div>

        {albums.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-(--line-color) px-4 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
            还没有相册，先在上方创建一个。
          </p>
        ) : (
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            {albums.map((album) => (
              <article
                key={album.id}
                className="min-w-0 overflow-hidden rounded-xl border border-(--line-color) bg-(--card-bg-transparent) p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-(--btn-regular-bg) text-(--primary)">
                    {album.coverUrl || album.photos[0]?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- 封面来自后台上传或外链
                      <img
                        src={album.coverUrl || album.photos[0]?.imageUrl}
                        alt={album.title}
                        className="absolute inset-0 size-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <Images aria-hidden className="size-6" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold">{album.title}</h3>
                      {album.passwordConfigured ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                          <LockKeyhole aria-hidden className="size-3" />
                          加密
                        </span>
                      ) : null}
                      <span
                        className={
                          album.enabled
                            ? "rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                        }
                      >
                        {album.enabled ? "已启用" : "已停用"}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                      /gallery/{album.slug} · {album.photos.length} 张照片 · 权重 {album.sortOrder}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
                      {album.description || "暂无简介"}
                    </p>
                    {album.tags.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {album.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-(--btn-regular-bg) px-1.5 py-0.5 text-[11px] text-(--btn-content)"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                  {album.enabled ? (
                    <Link href={`/gallery/${album.slug}`} target="_blank" className={smallButtonClass}>
                      查看
                    </Link>
                  ) : null}
                  <button type="button" onClick={() => startEdit(album)} className={smallButtonClass}>
                    <Pencil aria-hidden className="size-3.5" />
                    编辑
                  </button>
                  <button
                    type="button"
                    disabled={busyKey === `toggle-${album.id}`}
                    onClick={() => void handleToggle(album)}
                    className={smallButtonClass}
                  >
                    {album.enabled ? <EyeOff aria-hidden className="size-3.5" /> : <Eye aria-hidden className="size-3.5" />}
                    {album.enabled ? "停用" : "启用"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(album)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <Trash2 aria-hidden className="size-3.5" />
                    删除
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {deleting ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-500/40 dark:bg-amber-500/10">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            确定删除相册「{deleting.title}」及其 {deleting.photos.length} 张照片吗？删除后前台立即移除。
          </p>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              disabled={busyKey === "delete"}
              onClick={() => void handleDelete()}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {busyKey === "delete" ? "删除中…" : "确认删除"}
            </button>
            <button
              type="button"
              onClick={() => setDeleting(null)}
              className="rounded-lg border border-(--line-color) px-4 py-2 text-sm text-zinc-600 transition hover:bg-white dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              取消
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
