"use client";

import { Eye, EyeOff, Link2, Pencil, Plus, Rocket, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestJsonBody } from "@/lib/api-client";
import { formatDateKey } from "@/lib/format-date";
import { PROJECT_STATUS_KEYS, getProjectStatusMeta } from "@/lib/project-status";
import type { AdminProject } from "@/types/admin-project";
import ProjectStatusBadge from "@/components/site/project-status-badge";
import MarkdownEditor from "./markdown-editor";
import MediaUrlField from "./media-url-field";

// 项目外链表单草稿
interface LinkDraft {
  label: string;
  icon: string;
  value: string;
}

// 项目表单草稿
interface ProjectDraft {
  title: string;
  slug: string;
  description: string;
  content: string;
  coverUrl: string;
  status: string;
  tagsText: string;
  links: LinkDraft[];
  publishedAt: string;
  sortOrder: string;
  enabled: boolean;
}

const emptyProject: ProjectDraft = {
  title: "",
  slug: "",
  description: "",
  content: "",
  coverUrl: "",
  status: "developing",
  tagsText: "",
  links: [],
  publishedAt: new Date().toISOString().slice(0, 10),
  sortOrder: "0",
  enabled: true,
};

// 提交前把标签文本拆成数组
function readTags(value: string): string[] {
  return value
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

// 项目管理：Markdown 正文、封面、状态、标签、外链、排序与启停
export default function ProjectsManager({ projects }: { projects: AdminProject[] }) {
  const router = useRouter();
  const [form, setForm] = useState<ProjectDraft>(emptyProject);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<AdminProject | null>(null);
  const [busyKey, setBusyKey] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const inputClass =
    "w-full rounded-lg border border-(--line-color) bg-transparent px-3 py-2 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15";
  const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
  const smallButtonClass =
    "inline-flex h-8 items-center gap-1.5 rounded-lg border border-(--line-color) px-2.5 text-xs font-medium transition hover:border-(--primary) hover:text-(--primary) disabled:opacity-60";

  // 构造接口载荷
  function buildPayload(draft: ProjectDraft) {
    return {
      title: draft.title,
      slug: draft.slug,
      description: draft.description,
      content: draft.content,
      coverUrl: draft.coverUrl,
      status: draft.status,
      tags: readTags(draft.tagsText),
      links: draft.links,
      publishedAt: draft.publishedAt,
      sortOrder: Number.parseInt(draft.sortOrder, 10) || 0,
      enabled: draft.enabled,
    };
  }

  // 保存项目：编辑走 PUT，新建走 POST
  async function handleSave(): Promise<void> {
    setBusyKey("save");
    setMessage(null);
    const result = editingId
      ? await requestJsonBody<{ id: number }>(`/api/projects/${editingId}`, "PUT", buildPayload(form))
      : await requestJsonBody<{ id: number }>("/api/projects", "POST", buildPayload(form));
    setBusyKey("");
    if (result.ok) {
      setMessage({ type: "success", text: editingId ? "项目已更新，前台即时生效" : "项目已创建，前台即时生效" });
      setEditingId(null);
      setForm(emptyProject);
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 编辑项目：回填全部字段
  function startEdit(project: AdminProject): void {
    setEditingId(project.id);
    setForm({
      title: project.title,
      slug: project.slug,
      description: project.description,
      content: project.content,
      coverUrl: project.coverUrl,
      status: project.status,
      tagsText: project.tags.join(", "),
      links: project.links.map((link) => ({ ...link })),
      publishedAt: formatDateKey(project.publishedAt),
      sortOrder: String(project.sortOrder),
      enabled: project.enabled,
    });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 快速启用或停用项目
  async function handleToggle(project: AdminProject): Promise<void> {
    setBusyKey(`toggle-${project.id}`);
    setMessage(null);
    const result = await requestJsonBody<{ id: number }>(`/api/projects/${project.id}`, "PUT", {
      title: project.title,
      slug: project.slug,
      description: project.description,
      content: project.content,
      coverUrl: project.coverUrl,
      status: project.status,
      tags: project.tags,
      links: project.links,
      publishedAt: formatDateKey(project.publishedAt),
      sortOrder: project.sortOrder,
      enabled: !project.enabled,
    });
    setBusyKey("");
    if (result.ok) {
      setMessage({ type: "success", text: project.enabled ? `已停用「${project.title}」` : `已启用「${project.title}」` });
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 删除项目
  async function handleDelete(): Promise<void> {
    if (!deleting) {
      return;
    }
    setBusyKey("delete");
    setMessage(null);
    const result = await requestJsonBody<{ id: number }>(`/api/projects/${deleting.id}`, "DELETE");
    setBusyKey("");
    if (result.ok) {
      setMessage({ type: "success", text: `已删除「${deleting.title}」` });
      setDeleting(null);
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 更新单个外链草稿
  function updateLink(index: number, patch: Partial<LinkDraft>): void {
    setForm((current) => ({
      ...current,
      links: current.links.map((link, position) => (position === index ? { ...link, ...patch } : link)),
    }));
  }

  const canSave =
    form.title.trim().length > 0 &&
    form.slug.trim().length > 0 &&
    form.content.trim().length > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(form.publishedAt);

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
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-(--btn-regular-bg) text-(--primary)">
            {editingId ? <Pencil aria-hidden className="size-4" /> : <Plus aria-hidden className="size-4" />}
          </span>
          <div>
            <h2 className="text-sm font-semibold">{editingId ? "编辑项目" : "新增项目"}</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              正文会渲染在详情页底部；封面与外链图标支持直接上传或媒体库选择。
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label htmlFor="project-title" className={labelClass}>
              项目名称
            </label>
            <input
              id="project-title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="例如：Firefly 主题模版"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="project-slug" className={labelClass}>
              项目标识
            </label>
            <input
              id="project-slug"
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              placeholder="firefly"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="project-status" className={labelClass}>
              项目状态
            </label>
            <input
              id="project-status"
              list="project-status-options"
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
              placeholder="planning / developing / published / archived"
              className={`mt-1.5 ${inputClass}`}
            />
            <datalist id="project-status-options">
              {PROJECT_STATUS_KEYS.map((key) => (
                <option key={key} value={key}>
                  {getProjectStatusMeta(key).label}
                </option>
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="project-published" className={labelClass}>
              发布日期
            </label>
            <input
              id="project-published"
              type="date"
              value={form.publishedAt}
              onChange={(event) => setForm({ ...form, publishedAt: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="project-sort" className={labelClass}>
              排序（越大越靠前）
            </label>
            <input
              id="project-sort"
              type="number"
              value={form.sortOrder}
              onChange={(event) => setForm({ ...form, sortOrder: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => setForm({ ...form, enabled: event.target.checked })}
              className="size-4 accent-(--primary)"
            />
            保存后立即在前台显示
          </label>
          <div className="md:col-span-2 xl:col-span-3">
            <MediaUrlField
              id="project-cover"
              label="封面图"
              value={form.coverUrl}
              onChange={(next) => setForm({ ...form, coverUrl: next })}
              inputClass={inputClass}
              labelClass={labelClass}
              accept="image/*"
              filter="IMAGE"
              placeholder="上传封面或填写图片地址，留空显示火箭占位"
            />
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <label htmlFor="project-description" className={labelClass}>
              项目简介
            </label>
            <textarea
              id="project-description"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={2}
              placeholder="一句话介绍项目，列表卡片与详情页会展示"
              className={`mt-1.5 resize-y ${inputClass}`}
            />
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <label htmlFor="project-tags" className={labelClass}>
              标签（逗号分隔）
            </label>
            <input
              id="project-tags"
              value={form.tagsText}
              onChange={(event) => setForm({ ...form, tagsText: event.target.value })}
              placeholder="Astro, Svelte, TypeScript"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-(--line-divider) p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Link2 aria-hidden className="size-4 text-(--primary)" />
              <h3 className="text-sm font-semibold">项目外链</h3>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">GitHub、文档、演示地址</span>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, links: [...form.links, { label: "", icon: "", value: "" }] })}
              className={smallButtonClass}
            >
              <Plus aria-hidden className="size-3.5" />
              添加外链
            </button>
          </div>
          {form.links.length === 0 ? (
            <p className="py-4 text-center text-xs text-zinc-500 dark:text-zinc-400">暂未添加外链按钮</p>
          ) : (
            <div className="mt-3 space-y-2">
              {form.links.map((link, index) => (
                <div key={index} className="grid gap-2 md:grid-cols-[minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.6fr)_auto]">
                  <input
                    value={link.label}
                    onChange={(event) => updateLink(index, { label: event.target.value })}
                    placeholder="名称，如 GitHub"
                    aria-label={`外链 ${index + 1} 名称`}
                    className={inputClass}
                  />
                  <input
                    value={link.icon}
                    onChange={(event) => updateLink(index, { icon: event.target.value })}
                    placeholder="github / /img.png / emoji"
                    aria-label={`外链 ${index + 1} 图标`}
                    className={inputClass}
                  />
                  <input
                    value={link.value}
                    onChange={(event) => updateLink(index, { value: event.target.value })}
                    placeholder="https://github.com/..."
                    aria-label={`外链 ${index + 1} 地址`}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    aria-label={`删除外链 ${index + 1}`}
                    onClick={() => setForm({ ...form, links: form.links.filter((_, position) => position !== index) })}
                    className="inline-flex size-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <X aria-hidden className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5">
          <MarkdownEditor value={form.content} onChange={(content) => setForm({ ...form, content })} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={busyKey === "save" || !canSave}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-(--btn-content) px-4 text-sm font-medium text-white transition hover:bg-(--primary) disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save aria-hidden className="size-4" />
            {busyKey === "save" ? "保存中…" : editingId ? "保存修改" : "添加项目"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyProject);
              }}
              className="h-10 rounded-lg border border-(--line-color) px-4 text-sm text-zinc-600 transition hover:bg-(--btn-plain-bg-hover) dark:text-zinc-300"
            >
              取消编辑
            </button>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">全部项目</h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{projects.length} 个</span>
        </div>
        {projects.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-(--line-color) px-4 py-14 text-center text-sm text-zinc-500 dark:text-zinc-400">
            还没有项目，填写上方表单添加第一个项目。
          </p>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {projects.map((project) => (
              <article
                key={project.id}
                className="min-w-0 overflow-hidden rounded-2xl border border-(--line-color) bg-(--card-bg-transparent) p-4 backdrop-blur-sm transition hover:border-(--primary)/50"
              >
                <div className="flex items-start gap-4">
                  <div className="relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/5 bg-(--btn-regular-bg) dark:border-white/5">
                    {project.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- 封面来自后台上传或外链
                      <img
                        src={project.coverUrl}
                        alt={project.title}
                        className="absolute inset-0 size-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <Rocket aria-hidden className="size-6 text-(--primary)" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold">{project.title}</h3>
                      <ProjectStatusBadge status={project.status} cover />
                      <span
                        className={
                          project.enabled
                            ? "rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                        }
                      >
                        {project.enabled ? "已启用" : "已停用"}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                      /projects/{project.slug} · {formatDateKey(project.publishedAt)} · 权重 {project.sortOrder}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
                      {project.description || "暂无简介"}
                    </p>
                    {project.tags.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {project.tags.map((tag) => (
                          <span key={tag} className="rounded bg-(--btn-regular-bg) px-1.5 py-0.5 text-[11px] text-(--btn-content)">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                  {project.enabled ? (
                    <Link href={`/projects/${project.slug}`} target="_blank" className={smallButtonClass}>
                      查看
                    </Link>
                  ) : null}
                  <button type="button" onClick={() => startEdit(project)} className={smallButtonClass}>
                    <Pencil aria-hidden className="size-3.5" />
                    编辑
                  </button>
                  <button
                    type="button"
                    disabled={busyKey === `toggle-${project.id}`}
                    onClick={() => void handleToggle(project)}
                    className={smallButtonClass}
                  >
                    {project.enabled ? <EyeOff aria-hidden className="size-3.5" /> : <Eye aria-hidden className="size-3.5" />}
                    {project.enabled ? "停用" : "启用"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(project)}
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
            确定删除项目「{deleting.title}」吗？删除后前台立即移除。
          </p>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              disabled={busyKey === "delete"}
              onClick={() => void handleDelete()}
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
