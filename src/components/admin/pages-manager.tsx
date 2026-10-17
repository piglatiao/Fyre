"use client";

import { Eye } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import MarkdownEditor from "@/components/admin/markdown-editor";
import { requestJson, requestJsonBody } from "@/lib/api-client";
import { formatDate } from "@/lib/format-date";
import type { AdminPageFormData } from "@/types/admin-page-form-data";
import type { AdminPageItem } from "@/types/admin-page-item";

// 页面表单初始值
const emptyForm = { title: "", slug: "", content: "", published: true };

// 单页管理：列表 + 新建/编辑（Markdown 正文）+ 删除，内容用于「关于」「友链」等独立页面
export default function PagesManager() {
  const [items, setItems] = useState<AdminPageItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // 拉取页面列表
  async function load(): Promise<void> {
    setLoading(true);
    const result = await requestJson<AdminPageItem[]>("/api/pages");
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

  // 新建页面：用于开始撰写
  function startCreate(): void {
    setEditingId(null);
    setForm(emptyForm);
    setMessage(null);
  }

  // 载入页面详情并回填表单（新建成功后同步服务端生成的 slug）
  async function fillForm(id: number): Promise<void> {
    const result = await requestJson<AdminPageFormData>(`/api/pages/${id}`);
    if (result.ok) {
      setForm({
        title: result.data.title,
        slug: result.data.slug,
        content: result.data.content,
        published: result.data.published,
      });
      setEditingId(result.data.id);
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 提交表单：编辑走 PUT，新建走 POST
  async function handleSubmit(): Promise<void> {
    setSaving(true);
    setMessage(null);
    const payload = {
      title: form.title,
      slug: form.slug,
      content: form.content,
      published: form.published,
    };
    const result = editingId
      ? await requestJsonBody<{ id: number }>(`/api/pages/${editingId}`, "PUT", payload)
      : await requestJsonBody<{ id: number }>("/api/pages", "POST", payload);
    setSaving(false);
    if (result.ok) {
      setMessage({ type: "success", text: editingId ? "页面已更新" : "页面已创建" });
      await load();
      await fillForm(editingId ?? result.data.id);
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 删除页面
  async function handleDelete(page: AdminPageItem): Promise<void> {
    if (!window.confirm(`确定删除页面「${page.title}」吗？该操作不可恢复。`)) {
      return;
    }
    const result = await requestJsonBody<{ id: number }>(`/api/pages/${page.id}`, "DELETE");
    if (result.ok) {
      setMessage({ type: "success", text: "页面已删除" });
      if (editingId === page.id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      await load();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
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

      <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">{editingId ? "编辑页面" : "新建页面"}</h2>
          {editingId ? (
            <button
              type="button"
              onClick={startCreate}
              className="text-sm text-sky-600 transition hover:text-sky-700 dark:text-sky-400"
            >
              转为新建
            </button>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="page-title" className={labelClass}>
              标题
            </label>
            <input
              id="page-title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="page-slug" className={labelClass}>
              slug（留空按标题生成）
            </label>
            <input
              id="page-slug"
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
        </div>
        <MarkdownEditor value={form.content} onChange={(content) => setForm({ ...form, content })} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(event) => setForm({ ...form, published: event.target.checked })}
            />
            发布到前台（取消勾选则仅后台可见）
          </label>
          <div className="flex items-center gap-2">
            {editingId && form.published ? (
              <Link
                href={`/page/${form.slug}`}
                target="_blank"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Eye aria-hidden className="size-4" />
                查看前台
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={saving}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:opacity-60"
            >
              {saving ? "保存中…" : "保存页面"}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">标题</th>
              <th className="px-4 py-3 font-medium">slug</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">更新时间</th>
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
                  还没有独立页面
                </td>
              </tr>
            ) : (
              items.map((page) => (
                <tr key={page.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3 font-medium">{page.title}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{page.slug}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        page.published
                          ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      }
                    >
                      {page.published ? "已发布" : "未发布"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                    {formatDate(new Date(page.updatedAt))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMessage(null);
                          void fillForm(page.id);
                        }}
                        className="text-sky-600 transition hover:text-sky-700 dark:text-sky-400"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(page)}
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
