"use client";

import { useEffect, useState } from "react";
import { requestJson, requestJsonBody } from "@/lib/api-client";
import type { AdminCategoryItem } from "@/types/admin-category-item";

// 分类表单初始值
const emptyForm = { name: "", slug: "", description: "", sort: 0 };

// 分类管理：新增/编辑/删除，非空分类删除前需指定文章去向
export default function CategoriesManager() {
  const [items, setItems] = useState<AdminCategoryItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<AdminCategoryItem | null>(null);
  const [moveTo, setMoveTo] = useState("none");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // 拉取分类列表
  async function load(): Promise<void> {
    setLoading(true);
    const result = await requestJson<AdminCategoryItem[]>("/api/categories");
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
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      sort: Number(form.sort) || 0,
    };
    const result = editingId
      ? await requestJsonBody<{ id: number }>(`/api/categories/${editingId}`, "PUT", payload)
      : await requestJsonBody<{ id: number }>("/api/categories", "POST", payload);
    setSaving(false);
    if (result.ok) {
      setMessage({ type: "success", text: editingId ? "分类已更新" : "分类已创建" });
      setForm(emptyForm);
      setEditingId(null);
      await load();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 删除分类：非空时提交迁移目标
  async function handleDelete(category: AdminCategoryItem, target: string): Promise<void> {
    const query = category.postCount > 0 ? `?moveTo=${target}` : "";
    const result = await requestJsonBody<{ movedPosts: number }>(
      `/api/categories/${category.id}${query}`,
      "DELETE",
    );
    if (result.ok) {
      setMessage({
        type: "success",
        text:
          result.data.movedPosts > 0
            ? `分类已删除，并迁移了 ${result.data.movedPosts} 篇文章`
            : "分类已删除",
      });
      setDeleting(null);
      await load();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-sky-500/20";

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
        <h2 className="text-sm font-semibold">{editingId ? "编辑分类" : "新建分类"}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              名称
            </label>
            <input
              id="category-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="category-slug" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              slug（留空按名称生成）
            </label>
            <input
              id="category-slug"
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="category-desc" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              描述
            </label>
            <input
              id="category-desc"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="category-sort" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              排序（数字越小越靠前）
            </label>
            <input
              id="category-sort"
              type="number"
              value={form.sort}
              onChange={(event) => setForm({ ...form, sort: Number(event.target.value) })}
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
            {editingId ? "保存修改" : "创建分类"}
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

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">名称</th>
              <th className="px-4 py-3 font-medium">slug</th>
              <th className="px-4 py-3 font-medium">排序</th>
              <th className="px-4 py-3 font-medium">文章数</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
                  加载中…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
                  还没有分类
                </td>
              </tr>
            ) : (
              items.map((category) => (
                <tr key={category.id}>
                  <td className="px-4 py-3 font-medium">{category.name}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{category.slug}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{category.sort}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{category.postCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(category.id);
                          setForm({
                            name: category.name,
                            slug: category.slug,
                            description: category.description ?? "",
                            sort: category.sort,
                          });
                        }}
                        className="text-sky-600 transition hover:text-sky-700 dark:text-sky-400"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleting(category);
                          setMoveTo("none");
                        }}
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

      {deleting ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-500/40 dark:bg-amber-500/10">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            确定删除分类「{deleting.name}」吗？
            {deleting.postCount > 0
              ? `该分类下有 ${deleting.postCount} 篇文章，请选择迁移目标。`
              : "该分类下没有文章。"}
          </p>
          {deleting.postCount > 0 ? (
            <select
              aria-label="迁移目标分类"
              value={moveTo}
              onChange={(event) => setMoveTo(event.target.value)}
              className="mt-3 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm dark:border-amber-500/40 dark:bg-zinc-900"
            >
              <option value="none">迁移到「无分类」</option>
              {items
                .filter((item) => item.id !== deleting.id)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    迁移到「{item.name}」
                  </option>
                ))}
            </select>
          ) : null}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleDelete(deleting, moveTo)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
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
