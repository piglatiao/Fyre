"use client";

import { ExternalLink, Eye, EyeOff, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestJsonBody } from "@/lib/api-client";
import type { AdminFriendLinkItem } from "@/types/admin-friend-link-item";
import MediaUrlField from "./media-url-field";

// 表单草稿：标签以逗号分隔的文本维护，权重以字符串承接输入
interface FriendFormDraft {
  title: string;
  avatarUrl: string;
  description: string;
  siteUrl: string;
  tagsText: string;
  weight: string;
  enabled: boolean;
}

// 新增表单初始值
const emptyForm: FriendFormDraft = {
  title: "",
  avatarUrl: "",
  description: "",
  siteUrl: "",
  tagsText: "",
  weight: "0",
  enabled: true,
};

// 把后台条目转换为表单草稿
function toDraft(item: AdminFriendLinkItem): FriendFormDraft {
  return {
    title: item.title,
    avatarUrl: item.avatarUrl,
    description: item.description,
    siteUrl: item.siteUrl,
    tagsText: item.tags.join(", "),
    weight: String(item.weight),
    enabled: item.enabled,
  };
}

// 提交前把标签文本拆成数组
function readTags(value: string): string[] {
  return value
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

// 友链管理：表单新增/编辑、启停、删除与即时刷新
export default function FriendsManager({ items }: { items: AdminFriendLinkItem[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FriendFormDraft>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<AdminFriendLinkItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const inputClass =
    "w-full rounded-lg border border-(--line-color) bg-transparent px-3 py-2 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15";
  const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

  // 构造接口需要的完整友链载荷
  function buildPayload(draft: FriendFormDraft) {
    return {
      title: draft.title,
      avatarUrl: draft.avatarUrl,
      description: draft.description,
      siteUrl: draft.siteUrl,
      tags: readTags(draft.tagsText),
      weight: Number.parseInt(draft.weight, 10) || 0,
      enabled: draft.enabled,
    };
  }

  // 保存友链：编辑走 PUT，新建走 POST
  async function handleSave(): Promise<void> {
    setSaving(true);
    setMessage(null);
    const result = editingId
      ? await requestJsonBody<{ id: number }>(`/api/friends/${editingId}`, "PUT", buildPayload(form))
      : await requestJsonBody<{ id: number }>("/api/friends", "POST", buildPayload(form));
    setSaving(false);
    if (result.ok) {
      setMessage({ type: "success", text: editingId ? "友链已更新，前台即时生效" : "友链已添加，前台即时生效" });
      setEditingId(null);
      setForm(emptyForm);
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 快速启用/停用：保持其余字段不变
  async function handleToggle(item: AdminFriendLinkItem): Promise<void> {
    setBusyId(item.id);
    setMessage(null);
    const result = await requestJsonBody<{ id: number }>(`/api/friends/${item.id}`, "PUT", {
      title: item.title,
      avatarUrl: item.avatarUrl,
      description: item.description,
      siteUrl: item.siteUrl,
      tags: item.tags,
      weight: item.weight,
      enabled: !item.enabled,
    });
    setBusyId(null);
    if (result.ok) {
      setMessage({ type: "success", text: item.enabled ? `已停用「${item.title}」` : `已启用「${item.title}」` });
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 删除友链
  async function handleDelete(item: AdminFriendLinkItem): Promise<void> {
    setBusyId(item.id);
    setMessage(null);
    const result = await requestJsonBody<{ id: number }>(`/api/friends/${item.id}`, "DELETE");
    setBusyId(null);
    if (result.ok) {
      setMessage({ type: "success", text: `已删除「${item.title}」` });
      setDeleting(null);
      if (editingId === item.id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 进入编辑状态并回填表单
  function startEdit(item: AdminFriendLinkItem): void {
    setEditingId(item.id);
    setForm(toDraft(item));
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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

      <div className="rounded-2xl border border-(--line-color) bg-(--card-bg-transparent) p-5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-(--btn-regular-bg) text-(--primary)">
            <Plus aria-hidden className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">{editingId ? "编辑友链" : "新增友链"}</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">头像支持直接上传、媒体库选择或填写外链地址。</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="friend-title" className={labelClass}>
              友链名称
            </label>
            <input
              id="friend-title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="例如：夏夜流萤"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="friend-site-url" className={labelClass}>
              站点地址
            </label>
            <input
              id="friend-site-url"
              type="url"
              value={form.siteUrl}
              onChange={(event) => setForm({ ...form, siteUrl: event.target.value })}
              placeholder="https://example.com"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div className="md:col-span-2">
            <MediaUrlField
              id="friend-avatar-url"
              label="头像地址"
              value={form.avatarUrl}
              onChange={(next) => setForm({ ...form, avatarUrl: next })}
              inputClass={inputClass}
              labelClass={labelClass}
              accept="image/*"
              filter="IMAGE"
              placeholder="留空时显示名称首字"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="friend-description" className={labelClass}>
              简介
            </label>
            <textarea
              id="friend-description"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={3}
              placeholder="一句话介绍这个站点"
              className={`mt-1.5 resize-y ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="friend-tags" className={labelClass}>
              标签（逗号分隔）
            </label>
            <input
              id="friend-tags"
              value={form.tagsText}
              onChange={(event) => setForm({ ...form, tagsText: event.target.value })}
              placeholder="Blog, Docs, 设计"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="friend-weight" className={labelClass}>
              权重（越大越靠前）
            </label>
            <input
              id="friend-weight"
              type="number"
              value={form.weight}
              onChange={(event) => setForm({ ...form, weight: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
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

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || form.title.trim().length === 0 || form.siteUrl.trim().length === 0}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-(--btn-content) px-4 text-sm font-medium text-white transition hover:bg-(--primary) disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save aria-hidden className="size-4" />
            {saving ? "保存中…" : editingId ? "保存修改" : "添加友链"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="h-10 rounded-lg border border-(--line-color) px-4 text-sm text-zinc-600 transition hover:bg-(--btn-plain-bg-hover) dark:text-zinc-300"
            >
              取消编辑
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-(--line-color) px-4 py-14 text-center text-sm text-zinc-500 dark:text-zinc-400">
            还没有友链，填写上方表单添加第一位朋友。
          </p>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="group relative overflow-hidden rounded-2xl border border-(--line-color) bg-(--card-bg-transparent) p-4 backdrop-blur-sm transition hover:border-(--primary)/50"
            >
              <div className="pointer-events-none absolute inset-0 bg-(--primary) opacity-0 transition-opacity group-hover:opacity-[0.03]" />
              <div className="relative flex flex-wrap items-center gap-4">
                <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/5 bg-(--btn-regular-bg) text-lg font-bold text-(--primary) dark:border-white/5">
                  <span aria-hidden>{item.title.trim().charAt(0) || "友"}</span>
                  {item.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- 头像地址可由后台填写任意来源
                    <img
                      src={item.avatarUrl}
                      alt={item.title}
                      className="absolute inset-0 size-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold">{item.title}</h3>
                    <span className="rounded-md bg-(--btn-regular-bg) px-1.5 py-0.5 text-[11px] font-medium text-(--btn-content)">
                      权重 {item.weight}
                    </span>
                    <span
                      className={
                        item.enabled
                          ? "rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : "rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      }
                    >
                      {item.enabled ? "已启用" : "已停用"}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {item.description || "暂无简介"}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <a
                      href={item.siteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex max-w-full items-center gap-1 text-(--primary) hover:underline"
                    >
                      <ExternalLink aria-hidden className="size-3.5 shrink-0" />
                      <span className="truncate">{item.siteUrl}</span>
                    </a>
                    {item.tags.map((tag) => (
                      <span key={tag} className="rounded bg-(--btn-regular-bg) px-1.5 py-0.5">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="rounded-lg border border-(--line-color) px-3 py-1.5 text-xs font-medium transition hover:border-(--primary) hover:text-(--primary)"
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => void handleToggle(item)}
                    className="inline-flex items-center gap-1 rounded-lg border border-(--line-color) px-3 py-1.5 text-xs font-medium transition hover:border-(--primary) hover:text-(--primary) disabled:opacity-60"
                  >
                    {item.enabled ? <EyeOff aria-hidden className="size-3.5" /> : <Eye aria-hidden className="size-3.5" />}
                    {item.enabled ? "停用" : "启用"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(item)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <Trash2 aria-hidden className="size-3.5" />
                    删除
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {deleting ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-500/40 dark:bg-amber-500/10">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            确定删除友链「{deleting.title}」吗？删除后前台立即移除。
          </p>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              disabled={busyId === deleting.id}
              onClick={() => void handleDelete(deleting)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              确认删除
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
