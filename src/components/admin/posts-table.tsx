"use client";

import { Lock, Pin, Search, Upload } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { requestJson, requestJsonBody } from "@/lib/api-client";
import { formatDate } from "@/lib/format-date";
import { postStatusLabels, postStatusStyles } from "@/lib/post-status-display";
import type { AdminPostRow } from "@/types/admin-post-row";
import type { MarkdownImportResult } from "@/types/markdown-import-result";
import type { PageResult } from "@/types/page-result";

// 状态筛选选项
const STATUS_OPTIONS = [
  { value: "", label: "全部状态" },
  { value: "PUBLISHED", label: "已发布" },
  { value: "DRAFT", label: "草稿" },
  { value: "SCHEDULED", label: "定时" },
  { value: "PRIVATE", label: "私密" },
];

// 后台文章列表：状态/关键词筛选、批量删除与分页
export default function PostsTable() {
  const [items, setItems] = useState<AdminPostRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("");
  const [keyword, setKeyword] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [importing, setImporting] = useState(false);
  const [publishOnImport, setPublishOnImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 拉取列表数据
  const load = useCallback(async (targetPage: number, targetStatus: string, targetKeyword: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(targetPage), pageSize: "10" });
    if (targetStatus) {
      params.set("status", targetStatus);
    }
    if (targetKeyword) {
      params.set("keyword", targetKeyword);
    }
    const result = await requestJson<PageResult<AdminPostRow>>(`/api/posts?${params.toString()}`);
    if (result.ok) {
      setItems(result.data.items);
      setTotal(result.data.total);
      setTotalPages(result.data.totalPages);
      setPage(result.data.page);
      setSelected([]);
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      await load(1, "", "");
    })();
  }, [load]);

  // 勾选/取消勾选单篇文章
  function toggleSelect(id: number): void {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  // 批量删除
  async function handleDelete(ids: number[]): Promise<void> {
    if (ids.length === 0) {
      setMessage({ type: "error", text: "请先选择要删除的文章" });
      return;
    }
    if (!window.confirm(`确定删除选中的 ${ids.length} 篇文章吗？该操作不可恢复。`)) {
      return;
    }
    const result = await requestJsonBody<{ removed: number }>("/api/posts", "DELETE", { ids });
    if (result.ok) {
      setMessage({ type: "success", text: `已删除 ${result.data.removed} 篇文章` });
      await load(page, status, keyword);
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 导入本地 Markdown 文件：读取文本后调用导入接口并刷新列表
  async function handleImportFiles(fileList: File[]): Promise<void> {
    if (fileList.length === 0) {
      return;
    }
    setImporting(true);
    const files = await Promise.all(
      fileList.map(async (file) => ({ fileName: file.name, content: await file.text() })),
    );
    const result = await requestJsonBody<MarkdownImportResult>("/api/posts/import", "POST", {
      status: publishOnImport ? "PUBLISHED" : "DRAFT",
      files,
    });
    setImporting(false);
    if (!result.ok) {
      setMessage({ type: "error", text: result.error.message });
      return;
    }
    const { created, failed } = result.data;
    setMessage({
      type: failed.length > 0 ? "error" : "success",
      text:
        failed.length === 0
          ? `已导入 ${created.length} 篇文章`
          : `已导入 ${created.length} 篇，失败 ${failed.length} 篇：${failed[0].reason}`,
    });
    await load(1, status, keyword);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          状态
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              void load(1, event.target.value, keyword);
            }}
            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setKeyword(keywordInput);
            void load(1, status, keywordInput);
          }}
          className="flex items-center gap-2"
        >
          <label htmlFor="post-keyword" className="sr-only">
            搜索文章
          </label>
          <input
            id="post-keyword"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            placeholder="搜索标题或 slug"
            className="h-9 w-48 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Search aria-hidden className="size-4" />
            搜索
          </button>
        </form>
        <div className="ml-auto flex items-center gap-2">
          <label className="inline-flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={publishOnImport}
              onChange={(event) => setPublishOnImport(event.target.checked)}
            />
            导入后立即发布
          </label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Upload aria-hidden className="size-4" />
            {importing ? "导入中…" : "导入 MD"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,text/markdown"
            multiple
            aria-label="选择要导入的 Markdown 文件"
            className="hidden"
            onChange={(event) => {
              const fileList = Array.from(event.target.files ?? []);
              event.target.value = "";
              void handleImportFiles(fileList);
            }}
          />
          <button
            type="button"
            onClick={() => void handleDelete(selected)}
            disabled={selected.length === 0}
            className="inline-flex h-9 items-center rounded-lg border border-red-200 px-3 text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            批量删除{selected.length > 0 ? `（${selected.length}）` : ""}
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

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="全选"
                  checked={items.length > 0 && selected.length === items.length}
                  onChange={(event) => setSelected(event.target.checked ? items.map((item) => item.id) : [])}
                />
              </th>
              <th className="px-4 py-3 font-medium">标题</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">分类</th>
              <th className="px-4 py-3 font-medium">更新时间</th>
              <th className="px-4 py-3 font-medium">阅读</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
                  加载中…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
                  没有符合条件的文章
                </td>
              </tr>
            ) : (
              items.map((post) => (
                <tr key={post.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`选择 ${post.title}`}
                      checked={selected.includes(post.id)}
                      onChange={() => toggleSelect(post.id)}
                    />
                  </td>
                  <td className="max-w-80 px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {post.pinned ? <Pin aria-hidden className="size-3.5 shrink-0 text-amber-500" /> : null}
                      {post.encrypted ? <Lock aria-hidden className="size-3.5 shrink-0 text-sky-600 dark:text-sky-400" /> : null}
                      <Link
                        href={`/admin/posts/${post.id}`}
                        className="truncate font-medium transition hover:text-sky-600 dark:hover:text-sky-400"
                      >
                        {post.title}
                      </Link>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-zinc-400 dark:text-zinc-500">{post.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${postStatusStyles[post.status]}`}>
                      {postStatusLabels[post.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{post.category?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{formatDate(new Date(post.updatedAt))}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{post.viewCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/posts/${post.id}`}
                        className="text-sky-600 transition hover:text-sky-700 dark:text-sky-400"
                      >
                        编辑
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleDelete([post.id])}
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

      <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <span>
          共 {total} 篇 · 第 {page} / {totalPages} 页
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => void load(page - 1, status, keyword)}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            上一页
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => void load(page + 1, status, keyword)}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}
