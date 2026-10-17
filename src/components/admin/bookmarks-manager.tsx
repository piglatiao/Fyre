"use client";

import { BookmarkPlus, Eye, EyeOff, FolderPlus, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestJsonBody } from "@/lib/api-client";
import type { AdminBookmarkGroup } from "@/types/admin-bookmark-group";
import type { AdminBookmarkItem } from "@/types/admin-bookmark-item";
import BookmarkIcon from "@/components/bookmark-icon";
import MediaUrlField from "./media-url-field";

// 分组表单草稿
interface GroupDraft {
  name: string;
  slug: string;
  icon: string;
  description: string;
  weight: string;
  enabled: boolean;
}

// 书签表单草稿
interface ItemDraft {
  title: string;
  url: string;
  description: string;
  icon: string;
  weight: string;
  enabled: boolean;
}

// 删除确认对象
interface ConfirmTarget {
  kind: "group" | "item";
  id: number;
  title: string;
  groupId: number;
}

const emptyGroup: GroupDraft = {
  name: "",
  slug: "",
  icon: "",
  description: "",
  weight: "0",
  enabled: true,
};

const emptyItem: ItemDraft = {
  title: "",
  url: "",
  description: "",
  icon: "",
  weight: "0",
  enabled: true,
};

// 书签导航后台管理：分组与条目分表单维护，支持启停、编辑和删除
export default function BookmarksManager({ groups }: { groups: AdminBookmarkGroup[] }) {
  const router = useRouter();
  const [groupForm, setGroupForm] = useState<GroupDraft>(emptyGroup);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [itemGroupId, setItemGroupId] = useState<number | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState<ItemDraft>(emptyItem);
  const [confirm, setConfirm] = useState<ConfirmTarget | null>(null);
  const [busyKey, setBusyKey] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const inputClass =
    "w-full rounded-lg border border-(--line-color) bg-transparent px-3 py-2 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15";
  const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
  const smallButtonClass =
    "inline-flex h-8 items-center gap-1.5 rounded-lg border border-(--line-color) px-2.5 text-xs font-medium transition hover:border-(--primary) hover:text-(--primary) disabled:opacity-60";

  const activeItemGroup = groups.find((group) => group.id === itemGroupId) ?? null;

  // 分组表单载荷
  function buildGroupPayload(draft: GroupDraft) {
    return {
      name: draft.name,
      slug: draft.slug,
      icon: draft.icon,
      description: draft.description,
      weight: Number.parseInt(draft.weight, 10) || 0,
      enabled: draft.enabled,
    };
  }

  // 书签表单载荷
  function buildItemPayload(draft: ItemDraft, groupId: number) {
    return {
      groupId,
      title: draft.title,
      url: draft.url,
      description: draft.description,
      icon: draft.icon,
      weight: Number.parseInt(draft.weight, 10) || 0,
      enabled: draft.enabled,
    };
  }

  // 保存分组
  async function saveGroup(): Promise<void> {
    setBusyKey("group-save");
    setMessage(null);
    const result = editingGroupId
      ? await requestJsonBody<{ id: number }>(
          `/api/bookmarks/groups/${editingGroupId}`,
          "PUT",
          buildGroupPayload(groupForm),
        )
      : await requestJsonBody<{ id: number }>("/api/bookmarks/groups", "POST", buildGroupPayload(groupForm));
    setBusyKey("");
    if (result.ok) {
      setMessage({ type: "success", text: editingGroupId ? "分组已更新" : "分组已创建" });
      setEditingGroupId(null);
      setGroupForm(emptyGroup);
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 编辑分组：回填表单
  function startEditGroup(group: AdminBookmarkGroup): void {
    setEditingGroupId(group.id);
    setGroupForm({
      name: group.name,
      slug: group.slug,
      icon: group.icon,
      description: group.description,
      weight: String(group.weight),
      enabled: group.enabled,
    });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 快速启用/停用分组
  async function toggleGroup(group: AdminBookmarkGroup): Promise<void> {
    setBusyKey(`group-toggle-${group.id}`);
    setMessage(null);
    const result = await requestJsonBody<{ id: number }>(`/api/bookmarks/groups/${group.id}`, "PUT", {
      name: group.name,
      slug: group.slug,
      icon: group.icon,
      description: group.description,
      weight: group.weight,
      enabled: !group.enabled,
    });
    setBusyKey("");
    if (result.ok) {
      setMessage({ type: "success", text: group.enabled ? `已停用「${group.name}」` : `已启用「${group.name}」` });
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 打开新增书签表单
  function startAddItem(groupId: number): void {
    setItemGroupId(groupId);
    setEditingItemId(null);
    setItemForm(emptyItem);
    setMessage(null);
  }

  // 编辑书签：回填表单
  function startEditItem(item: AdminBookmarkItem): void {
    setItemGroupId(item.groupId);
    setEditingItemId(item.id);
    setItemForm({
      title: item.title,
      url: item.url,
      description: item.description,
      icon: item.icon,
      weight: String(item.weight),
      enabled: item.enabled,
    });
    setMessage(null);
  }

  // 保存书签
  async function saveItem(): Promise<void> {
    if (itemGroupId === null) {
      return;
    }
    setBusyKey("item-save");
    setMessage(null);
    const result = editingItemId
      ? await requestJsonBody<{ id: number }>(
          `/api/bookmarks/items/${editingItemId}`,
          "PUT",
          buildItemPayload(itemForm, itemGroupId),
        )
      : await requestJsonBody<{ id: number }>("/api/bookmarks/items", "POST", buildItemPayload(itemForm, itemGroupId));
    setBusyKey("");
    if (result.ok) {
      setMessage({ type: "success", text: editingItemId ? "书签已更新" : "书签已添加" });
      setItemGroupId(null);
      setEditingItemId(null);
      setItemForm(emptyItem);
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 快速启用/停用书签
  async function toggleItem(item: AdminBookmarkItem): Promise<void> {
    setBusyKey(`item-toggle-${item.id}`);
    setMessage(null);
    const result = await requestJsonBody<{ id: number }>(`/api/bookmarks/items/${item.id}`, "PUT", {
      groupId: item.groupId,
      title: item.title,
      url: item.url,
      description: item.description,
      icon: item.icon,
      weight: item.weight,
      enabled: !item.enabled,
    });
    setBusyKey("");
    if (result.ok) {
      setMessage({ type: "success", text: item.enabled ? `已停用「${item.title}」` : `已启用「${item.title}」` });
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 执行确认后的删除，分组会级联删除组内书签
  async function confirmDelete(): Promise<void> {
    if (!confirm) {
      return;
    }
    setBusyKey("delete");
    setMessage(null);
    const url = confirm.kind === "group" ? `/api/bookmarks/groups/${confirm.id}` : `/api/bookmarks/items/${confirm.id}`;
    const result = await requestJsonBody<{ id: number }>(url, "DELETE");
    setBusyKey("");
    if (result.ok) {
      setMessage({ type: "success", text: `已删除「${confirm.title}」` });
      if (confirm.kind === "group" && itemGroupId === confirm.groupId) {
        setItemGroupId(null);
        setEditingItemId(null);
      }
      if (confirm.kind === "item" && editingItemId === confirm.id) {
        setItemGroupId(null);
        setEditingItemId(null);
      }
      setConfirm(null);
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
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
            <FolderPlus aria-hidden className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold">{editingGroupId ? "编辑分组" : "新增分组"}</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">分组标识用于前台锚点，只能使用小写字母、数字与连字符。</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="bookmark-group-name" className={labelClass}>
              分组名称
            </label>
            <input
              id="bookmark-group-name"
              value={groupForm.name}
              onChange={(event) => setGroupForm({ ...groupForm, name: event.target.value })}
              placeholder="例如：开发"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="bookmark-group-slug" className={labelClass}>
              分组标识
            </label>
            <input
              id="bookmark-group-slug"
              value={groupForm.slug}
              onChange={(event) => setGroupForm({ ...groupForm, slug: event.target.value.toLowerCase() })}
              placeholder="dev"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="bookmark-group-icon" className={labelClass}>
              分组图标（emoji 或图片地址）
            </label>
            <input
              id="bookmark-group-icon"
              value={groupForm.icon}
              onChange={(event) => setGroupForm({ ...groupForm, icon: event.target.value })}
              placeholder="💻 或 /uploads/icon.png"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="bookmark-group-weight" className={labelClass}>
              权重（越大越靠前）
            </label>
            <input
              id="bookmark-group-weight"
              type="number"
              value={groupForm.weight}
              onChange={(event) => setGroupForm({ ...groupForm, weight: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="bookmark-group-description" className={labelClass}>
              分组描述
            </label>
            <input
              id="bookmark-group-description"
              value={groupForm.description}
              onChange={(event) => setGroupForm({ ...groupForm, description: event.target.value })}
              placeholder="一句话说明这个分组"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={groupForm.enabled}
              onChange={(event) => setGroupForm({ ...groupForm, enabled: event.target.checked })}
              className="size-4 accent-(--primary)"
            />
            在前台显示该分组
          </label>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busyKey === "group-save" || !groupForm.name.trim() || !groupForm.slug.trim()}
            onClick={() => void saveGroup()}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-(--btn-content) px-4 text-sm font-medium text-white transition hover:bg-(--primary) disabled:opacity-60"
          >
            <Save aria-hidden className="size-4" />
            {busyKey === "group-save" ? "保存中…" : editingGroupId ? "保存分组" : "添加分组"}
          </button>
          {editingGroupId ? (
            <button
              type="button"
              onClick={() => {
                setEditingGroupId(null);
                setGroupForm(emptyGroup);
              }}
              className="h-10 rounded-lg border border-(--line-color) px-4 text-sm text-zinc-600 transition hover:bg-(--btn-plain-bg-hover) dark:text-zinc-300"
            >
              取消编辑
            </button>
          ) : null}
        </div>
      </div>

      {activeItemGroup ? (
        <div className="rounded-2xl border border-(--primary)/40 bg-(--card-bg-transparent) p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-(--btn-regular-bg) text-(--primary)">
                <BookmarkPlus aria-hidden className="size-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold">{editingItemId ? "编辑书签" : "新增书签"}</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">所属分组：{activeItemGroup.name}</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="关闭书签表单"
              onClick={() => {
                setItemGroupId(null);
                setEditingItemId(null);
              }}
              className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-(--btn-plain-bg-hover)"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="bookmark-item-title" className={labelClass}>
                书签名称
              </label>
              <input
                id="bookmark-item-title"
                value={itemForm.title}
                onChange={(event) => setItemForm({ ...itemForm, title: event.target.value })}
                placeholder="例如：GitHub"
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
            <div>
              <label htmlFor="bookmark-item-url" className={labelClass}>
                书签地址
              </label>
              <input
                id="bookmark-item-url"
                type="url"
                value={itemForm.url}
                onChange={(event) => setItemForm({ ...itemForm, url: event.target.value })}
                placeholder="https://example.com"
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
            <div className="md:col-span-2">
              <MediaUrlField
                id="bookmark-item-icon"
                label="书签图标"
                value={itemForm.icon}
                onChange={(next) => setItemForm({ ...itemForm, icon: next })}
                inputClass={inputClass}
                labelClass={labelClass}
                accept="image/*"
                filter="IMAGE"
                hint="留空时自动尝试目标站点 favicon"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="bookmark-item-description" className={labelClass}>
                描述
              </label>
              <textarea
                id="bookmark-item-description"
                value={itemForm.description}
                onChange={(event) => setItemForm({ ...itemForm, description: event.target.value })}
                rows={2}
                placeholder="一句话介绍这个站点"
                className={`mt-1.5 resize-y ${inputClass}`}
              />
            </div>
            <div>
              <label htmlFor="bookmark-item-weight" className={labelClass}>
                权重（越大越靠前）
              </label>
              <input
                id="bookmark-item-weight"
                type="number"
                value={itemForm.weight}
                onChange={(event) => setItemForm({ ...itemForm, weight: event.target.value })}
                className={`mt-1.5 ${inputClass}`}
              />
            </div>
            <label className="flex items-center gap-2 self-end text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={itemForm.enabled}
                onChange={(event) => setItemForm({ ...itemForm, enabled: event.target.checked })}
                className="size-4 accent-(--primary)"
              />
              在前台显示该书签
            </label>
          </div>
          <div className="mt-5">
            <button
              type="button"
              disabled={busyKey === "item-save" || !itemForm.title.trim() || !itemForm.url.trim()}
              onClick={() => void saveItem()}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-(--btn-content) px-4 text-sm font-medium text-white transition hover:bg-(--primary) disabled:opacity-60"
            >
              <Save aria-hidden className="size-4" />
              {busyKey === "item-save" ? "保存中…" : editingItemId ? "保存书签" : "添加书签"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        {groups.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-(--line-color) px-4 py-14 text-center text-sm text-zinc-500 dark:text-zinc-400">
            还没有书签分组，先在上方创建一个分组。
          </p>
        ) : (
          groups.map((group) => (
            <section
              key={group.id}
              className="rounded-2xl border border-(--line-color) bg-(--card-bg-transparent) p-4 backdrop-blur-sm"
            >
              <div className="flex flex-wrap items-center gap-3">
                <BookmarkIcon
                  icon={group.icon}
                  title={group.name}
                  className="size-10 rounded-lg border border-black/5 bg-(--btn-regular-bg) text-lg dark:border-white/5"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold">{group.name}</h3>
                    <span className="rounded bg-(--btn-regular-bg) px-1.5 py-0.5 text-[11px] text-(--btn-content)">
                      #{group.slug}
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">权重 {group.weight}</span>
                    <span
                      className={
                        group.enabled
                          ? "rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : "rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      }
                    >
                      {group.enabled ? "已启用" : "已停用"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{group.description || "暂无描述"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => startAddItem(group.id)} className={smallButtonClass}>
                    <Plus aria-hidden className="size-3.5" />
                    添加书签
                  </button>
                  <button type="button" onClick={() => startEditGroup(group)} className={smallButtonClass}>
                    <Pencil aria-hidden className="size-3.5" />
                    编辑分组
                  </button>
                  <button
                    type="button"
                    disabled={busyKey === `group-toggle-${group.id}`}
                    onClick={() => void toggleGroup(group)}
                    className={smallButtonClass}
                  >
                    {group.enabled ? <EyeOff aria-hidden className="size-3.5" /> : <Eye aria-hidden className="size-3.5" />}
                    {group.enabled ? "停用" : "启用"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirm({ kind: "group", id: group.id, title: group.name, groupId: group.id })}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <Trash2 aria-hidden className="size-3.5" />
                    删除
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {group.items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-(--line-color) px-3 py-6 text-center text-xs text-zinc-500 md:col-span-2 dark:text-zinc-400">
                    该分组还没有书签
                  </p>
                ) : (
                  group.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-xl border border-(--line-divider) p-2.5"
                    >
                      <BookmarkIcon
                        icon={item.icon}
                        title={item.title}
                        url={item.url}
                        className="size-10 rounded-lg border border-black/5 bg-zinc-100 text-sm dark:border-white/5 dark:bg-zinc-800"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{item.title}</span>
                          <span
                            className={
                              item.enabled
                                ? "size-1.5 shrink-0 rounded-full bg-emerald-500"
                                : "size-1.5 shrink-0 rounded-full bg-zinc-400"
                            }
                            title={item.enabled ? "已启用" : "已停用"}
                          />
                        </div>
                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{item.description || item.url}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          aria-label={`编辑 ${item.title}`}
                          onClick={() => startEditItem(item)}
                          className="inline-flex size-7 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-(--btn-plain-bg-hover) hover:text-(--primary)"
                        >
                          <Pencil aria-hidden className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label={item.enabled ? `停用 ${item.title}` : `启用 ${item.title}`}
                          disabled={busyKey === `item-toggle-${item.id}`}
                          onClick={() => void toggleItem(item)}
                          className="inline-flex size-7 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-(--btn-plain-bg-hover) hover:text-(--primary) disabled:opacity-50"
                        >
                          {item.enabled ? <EyeOff aria-hidden className="size-3.5" /> : <Eye aria-hidden className="size-3.5" />}
                        </button>
                        <button
                          type="button"
                          aria-label={`删除 ${item.title}`}
                          onClick={() =>
                            setConfirm({ kind: "item", id: item.id, title: item.title, groupId: item.groupId })
                          }
                          className="inline-flex size-7 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                          <Trash2 aria-hidden className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          ))
        )}
      </div>

      {confirm ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-500/40 dark:bg-amber-500/10">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {confirm.kind === "group"
              ? `确定删除分组「${confirm.title}」吗？组内书签会一并删除。`
              : `确定删除书签「${confirm.title}」吗？`}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              disabled={busyKey === "delete"}
              onClick={() => void confirmDelete()}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              确认删除
            </button>
            <button
              type="button"
              onClick={() => setConfirm(null)}
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
