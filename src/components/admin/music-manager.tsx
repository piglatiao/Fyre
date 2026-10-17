"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestJsonBody } from "@/lib/api-client";
import type { AdminMusicTrackItem } from "@/types/admin-music-track-item";
import MediaUrlField from "./media-url-field";

// 表单草稿：数字字段以字符串保存，提交前再转换
interface MusicFormDraft {
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl: string;
  sortOrder: string;
}

// 表单初始值：默认排在末尾，便于新增曲目直接追加
const emptyForm: MusicFormDraft = { title: "", artist: "", audioUrl: "", coverUrl: "", sortOrder: "9999" };

// 音乐管理：曲目列表 + 新增/编辑表单 + 删除确认
// 音频与封面复用媒体库：可在字段内直接上传、从媒体库选择或填写外链
export default function MusicManager({ items }: { items: AdminMusicTrackItem[] }) {
  const router = useRouter();
  const [form, setForm] = useState<MusicFormDraft>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<AdminMusicTrackItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const inputClass =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-sky-500/20";
  const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

  // 提交表单：编辑走 PUT，新建走 POST
  async function handleSubmit(): Promise<void> {
    setSaving(true);
    setMessage(null);
    const payload = {
      title: form.title,
      artist: form.artist,
      audioUrl: form.audioUrl,
      coverUrl: form.coverUrl,
      sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
    };
    const result = editingId
      ? await requestJsonBody<{ id: number }>(`/api/music/${editingId}`, "PUT", payload)
      : await requestJsonBody<{ id: number }>("/api/music", "POST", payload);
    setSaving(false);
    if (result.ok) {
      setMessage({ type: "success", text: editingId ? "曲目已更新，前台即时生效" : "曲目已添加，前台即时生效" });
      setForm(emptyForm);
      setEditingId(null);
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 删除曲目：确认后删除并刷新列表
  async function handleDelete(track: AdminMusicTrackItem): Promise<void> {
    const result = await requestJsonBody<{ id: number }>(`/api/music/${track.id}`, "DELETE");
    if (result.ok) {
      setMessage({ type: "success", text: `已删除「${track.title}」` });
      setDeleting(null);
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 进入编辑态：把列表行回填到表单
  function startEdit(track: AdminMusicTrackItem): void {
    setEditingId(track.id);
    setForm({
      title: track.title,
      artist: track.artist,
      audioUrl: track.audioUrl,
      coverUrl: track.coverUrl,
      sortOrder: String(track.sortOrder),
    });
  }

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
        <h2 className="text-sm font-semibold">{editingId ? "编辑曲目" : "新增曲目"}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label htmlFor="music-title" className={labelClass}>
              曲名
            </label>
            <input
              id="music-title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="例如：夜航星"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="music-sort" className={labelClass}>
              排序（小者在前）
            </label>
            <input
              id="music-sort"
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(event) => setForm({ ...form, sortOrder: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div className="sm:col-span-3">
            <label htmlFor="music-artist" className={labelClass}>
              歌手
            </label>
            <input
              id="music-artist"
              value={form.artist}
              onChange={(event) => setForm({ ...form, artist: event.target.value })}
              placeholder="留空显示「未知歌手」"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div className="sm:col-span-3">
            <MediaUrlField
              id="music-audio"
              label="音频文件（mp3 / m4a / wav / ogg / flac，可直接上传）"
              value={form.audioUrl}
              onChange={(next) => setForm({ ...form, audioUrl: next })}
              inputClass={inputClass}
              labelClass={labelClass}
              accept="audio/*"
              filter="ALL"
              placeholder="/uploads/2026/10/xxx.mp3"
            />
          </div>
          <div className="sm:col-span-3">
            <MediaUrlField
              id="music-cover"
              label="封面图（可选，留空显示音符占位）"
              value={form.coverUrl}
              onChange={(next) => setForm({ ...form, coverUrl: next })}
              inputClass={inputClass}
              labelClass={labelClass}
              accept="image/*"
              placeholder="/uploads/2026/10/xxx.webp"
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
            {saving ? "保存中…" : editingId ? "保存修改" : "添加曲目"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="rounded-lg border border-(--line-color) px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              取消编辑
            </button>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">曲名</th>
              <th className="px-4 py-3 font-medium">歌手</th>
              <th className="px-4 py-3 font-medium">音频</th>
              <th className="px-4 py-3 font-medium">排序</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400">
                  还没有曲目，添加后在博客导航栏与左侧栏即可播放
                </td>
              </tr>
            ) : (
              items.map((track) => (
                <tr key={track.id}>
                  <td className="px-4 py-3 font-medium">{track.title}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{track.artist || "未知歌手"}</td>
                  <td className="px-4 py-3">
                    <a
                      href={track.audioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-600 transition hover:text-sky-700 dark:text-sky-400"
                    >
                      试听 / 打开
                    </a>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{track.sortOrder}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(track)}
                        className="text-sky-600 transition hover:text-sky-700 dark:text-sky-400"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(track)}
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
            确定删除曲目「{deleting.title}」吗？删除后前台播放列表立即移除。
          </p>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleDelete(deleting)}
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
