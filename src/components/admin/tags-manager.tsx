"use client";

import { useEffect, useState } from "react";
import { requestJson, requestJsonBody } from "@/lib/api-client";
import type { TagItem } from "@/types/tag-item";

// 标签表单初始值
const emptyForm = { name: "", slug: "" };

// 标签管理：新增/编辑/删除与合并
export default function TagsManager() {
  const [items, setItems] = useState<TagItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // 拉取标签列表
  async function load(): Promise<void> {
    setLoading(true);
    const result = await requestJson<TagItem[]>("/api/tags");
    if (result.ok) {
      setItems(result.data);
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
    setLoading(false);
  }

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  // 提交表单：编辑走 PUT，新建走 POST
  async function handleSubmit(): Promise<void> {
    setSaving(true);
    setMessage(null);
    const payload = { name: form.name, slug: form.slug };
    const result = editingId
      ? await requestJsonBody<{ id: number }>(`/api/tags/${editingId}`, "PUT", payload)
      : await requestJsonBody<{ id: number }>("/api/tags", "POST", payload);
    setSaving(false);
    if (result.ok) {
      setMessage({ type: "success", text: editingId ? "标签已更新" : "标签已创建" });
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 删除标签
  async function handleDelete(tag: TagItem): Promise<void> {
    if (!window.confirm(`确定删除标签「${tag.name}」吗？其文章关联会一并解除。`)) {
      return;
    }
    const result = await requestJsonBody<{ id: number }>(`/api/tags/${tag.id}`, "DELETE");
    if (result.ok) {
      setMessage({ type: "success", text: "标签已删除" });
      await load();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 合并标签：把源标签关联迁移到目标标签后删除源标签
  async function handleMerge(): Promise<void> {
    const source = Number(sourceId);
    const target = Number(targetId);
    if (!source || !target) {
      setMessage({ type: "error", text: "请选择待合并标签与目标标签" });
      return;
    }
    if (!window.confirm("合并后源标签将被删除，其文章关联会迁移到目标标签，确定继续吗？")) {
      return;
    }
    const result = await requestJsonBody<{ merged: boolean }>("/api/tags/merge", "POST", {
      sourceId: source,
      targetId: target,
    });
    if (result.ok) {
      setMessage({ type: "success", text: "标签已合并" });
      setSourceId("");
      setTargetId("");
      await load();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-sky-500/20";
  const selectClass =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

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

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">{editingId ? "编辑标签" : "新建标签"}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tag-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              名称
            </label>
            <input
              id="tag-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="tag-slug" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              slug（留空按名称生成）
            </label>
            <input
              id="tag-slug"
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={saving}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-60"
          >
            {editingId ? "保存修改" : "创建标签"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              取消编辑
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">合并标签</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          合并后源标签的文章关联会迁移到目标标签，源标签随后被删除。
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="tag-merge-source" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              待合并标签
            </label>
            <select
              id="tag-merge-source"
              value={sourceId}
              onChange={(event) => setSourceId(event.target.value)}
              className={`mt-1.5 ${selectClass}`}
            >
              <option value="">请选择</option>
              {items.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}（{tag.postCount} 篇）
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tag-merge-target" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              目标标签
            </label>
            <select
              id="tag-merge-target"
              value={targetId}
              onChange={(event) => setTargetId(event.target.value)}
              className={`mt-1.5 ${selectClass}`}
            >
              <option value="">请选择</option>
              {items
                .filter((tag) => String(tag.id) !== sourceId)
                .map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}（{tag.postCount} 篇）
                  </option>
                ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void handleMerge()}
              className="h-10 w-full rounded-lg border border-sky-200 px-4 text-sm font-medium text-sky-700 transition hover:bg-sky-50 dark:border-sky-500/40 dark:text-sky-400 dark:hover:bg-sky-500/10"
            >
              合并标签
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">名称</th>
              <th className="px-4 py-3 font-medium">slug</th>
              <th className="px-4 py-3 font-medium">文章数</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
                  加载中…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
                  还没有标签
                </td>
              </tr>
            ) : (
              items.map((tag) => (
                <tr key={tag.id}>
                  <td className="px-4 py-3 font-medium">{tag.name}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{tag.slug}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{tag.postCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(tag.id);
                          setForm({ name: tag.name, slug: tag.slug });
                        }}
                        className="text-sky-600 transition hover:text-sky-700 dark:text-sky-400"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(tag)}
                        className="text-red-600 transition hover:text-red-700 dark:text-red-400"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
