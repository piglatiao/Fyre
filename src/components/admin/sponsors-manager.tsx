"use client";

import { Eye, EyeOff, Pencil, Plus, Save, Trash2, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestJsonBody } from "@/lib/api-client";
import type { AdminSponsorMethod } from "@/types/admin-sponsor-method";
import type { AdminSponsorRecord } from "@/types/admin-sponsor-record";
import SponsorMethodIcon from "@/components/site/sponsor-method-icon";
import MediaUrlField from "./media-url-field";

// 打赏方式表单草稿
interface MethodDraft {
  name: string;
  icon: string;
  qrCodeUrl: string;
  linkUrl: string;
  description: string;
  sortOrder: string;
  enabled: boolean;
}

// 打赏记录表单草稿
interface RecordDraft {
  name: string;
  avatarUrl: string;
  amount: string;
  message: string;
  sponsoredAt: string;
  sortOrder: string;
  enabled: boolean;
}

// 删除确认目标
interface ConfirmTarget {
  kind: "method" | "record";
  id: number;
  title: string;
}

const emptyMethod: MethodDraft = {
  name: "",
  icon: "",
  qrCodeUrl: "",
  linkUrl: "",
  description: "",
  sortOrder: "0",
  enabled: true,
};

const emptyRecord: RecordDraft = {
  name: "",
  avatarUrl: "",
  amount: "",
  message: "",
  sponsoredAt: "",
  sortOrder: "0",
  enabled: true,
};

// 打赏管理：两种表单分别维护打赏方式与打赏记录
export default function SponsorsManager({
  methods,
  records,
}: {
  methods: AdminSponsorMethod[];
  records: AdminSponsorRecord[];
}) {
  const router = useRouter();
  const [methodForm, setMethodForm] = useState<MethodDraft>(emptyMethod);
  const [editingMethodId, setEditingMethodId] = useState<number | null>(null);
  const [recordForm, setRecordForm] = useState<RecordDraft>(emptyRecord);
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<ConfirmTarget | null>(null);
  const [busyKey, setBusyKey] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const inputClass =
    "w-full rounded-lg border border-(--line-color) bg-transparent px-3 py-2 text-sm outline-none transition focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/15";
  const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
  const smallButtonClass =
    "inline-flex h-8 items-center gap-1.5 rounded-lg border border-(--line-color) px-2.5 text-xs font-medium transition hover:border-(--primary) hover:text-(--primary) disabled:opacity-60";

  // 生成打赏方式接口载荷
  function buildMethodPayload(draft: MethodDraft) {
    return {
      name: draft.name,
      icon: draft.icon,
      qrCodeUrl: draft.qrCodeUrl,
      linkUrl: draft.linkUrl,
      description: draft.description,
      sortOrder: Number.parseInt(draft.sortOrder, 10) || 0,
      enabled: draft.enabled,
    };
  }

  // 生成打赏记录接口载荷
  function buildRecordPayload(draft: RecordDraft) {
    return {
      name: draft.name,
      avatarUrl: draft.avatarUrl,
      amount: draft.amount,
      message: draft.message,
      sponsoredAt: draft.sponsoredAt,
      sortOrder: Number.parseInt(draft.sortOrder, 10) || 0,
      enabled: draft.enabled,
    };
  }

  // 保存打赏方式
  async function saveMethod(): Promise<void> {
    setBusyKey("method-save");
    setMessage(null);
    const result = editingMethodId
      ? await requestJsonBody<{ id: number }>(
          `/api/sponsors/methods/${editingMethodId}`,
          "PUT",
          buildMethodPayload(methodForm),
        )
      : await requestJsonBody<{ id: number }>(
          "/api/sponsors/methods",
          "POST",
          buildMethodPayload(methodForm),
        );
    setBusyKey("");
    if (result.ok) {
      setMessage({ type: "success", text: editingMethodId ? "打赏方式已更新" : "打赏方式已创建" });
      setEditingMethodId(null);
      setMethodForm(emptyMethod);
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 编辑打赏方式：回填表单
  function startEditMethod(item: AdminSponsorMethod): void {
    setEditingMethodId(item.id);
    setMethodForm({
      name: item.name,
      icon: item.icon,
      qrCodeUrl: item.qrCodeUrl,
      linkUrl: item.linkUrl,
      description: item.description,
      sortOrder: String(item.sortOrder),
      enabled: item.enabled,
    });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 快速启用或停用打赏方式
  async function toggleMethod(item: AdminSponsorMethod): Promise<void> {
    setBusyKey(`method-toggle-${item.id}`);
    setMessage(null);
    const result = await requestJsonBody<{ id: number }>(`/api/sponsors/methods/${item.id}`, "PUT", {
      name: item.name,
      icon: item.icon,
      qrCodeUrl: item.qrCodeUrl,
      linkUrl: item.linkUrl,
      description: item.description,
      sortOrder: item.sortOrder,
      enabled: !item.enabled,
    });
    setBusyKey("");
    if (result.ok) {
      setMessage({ type: "success", text: item.enabled ? `已停用「${item.name}」` : `已启用「${item.name}」` });
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 保存打赏记录
  async function saveRecord(): Promise<void> {
    setBusyKey("record-save");
    setMessage(null);
    const result = editingRecordId
      ? await requestJsonBody<{ id: number }>(
          `/api/sponsors/records/${editingRecordId}`,
          "PUT",
          buildRecordPayload(recordForm),
        )
      : await requestJsonBody<{ id: number }>(
          "/api/sponsors/records",
          "POST",
          buildRecordPayload(recordForm),
        );
    setBusyKey("");
    if (result.ok) {
      setMessage({ type: "success", text: editingRecordId ? "打赏记录已更新" : "打赏记录已创建" });
      setEditingRecordId(null);
      setRecordForm(emptyRecord);
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 编辑打赏记录：回填表单
  function startEditRecord(item: AdminSponsorRecord): void {
    setEditingRecordId(item.id);
    setRecordForm({
      name: item.name,
      avatarUrl: item.avatarUrl,
      amount: item.amount,
      message: item.message,
      sponsoredAt: item.sponsoredAt,
      sortOrder: String(item.sortOrder),
      enabled: item.enabled,
    });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 快速启用或停用打赏记录
  async function toggleRecord(item: AdminSponsorRecord): Promise<void> {
    setBusyKey(`record-toggle-${item.id}`);
    setMessage(null);
    const result = await requestJsonBody<{ id: number }>(`/api/sponsors/records/${item.id}`, "PUT", {
      name: item.name,
      avatarUrl: item.avatarUrl,
      amount: item.amount,
      message: item.message,
      sponsoredAt: item.sponsoredAt,
      sortOrder: item.sortOrder,
      enabled: !item.enabled,
    });
    setBusyKey("");
    if (result.ok) {
      setMessage({ type: "success", text: item.enabled ? `已隐藏「${item.name}」` : `已展示「${item.name}」` });
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  // 删除当前确认的打赏方式或记录
  async function confirmDelete(): Promise<void> {
    if (!confirm) {
      return;
    }
    setBusyKey("delete");
    setMessage(null);
    const endpoint =
      confirm.kind === "method"
        ? `/api/sponsors/methods/${confirm.id}`
        : `/api/sponsors/records/${confirm.id}`;
    const result = await requestJsonBody<{ id: number }>(endpoint, "DELETE");
    setBusyKey("");
    if (result.ok) {
      setMessage({ type: "success", text: `已删除「${confirm.title}」` });
      setConfirm(null);
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error.message });
    }
  }

  return (
    <div className="space-y-8">
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
            {editingMethodId ? <Pencil aria-hidden className="size-4" /> : <Plus aria-hidden className="size-4" />}
          </span>
          <div>
            <h2 className="text-sm font-semibold">{editingMethodId ? "编辑打赏方式" : "新增打赏方式"}</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              收款码与打赏链接至少填写一项；图标支持 emoji、品牌名称或上传图片。
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <div>
            <label htmlFor="sponsor-method-name" className={labelClass}>
              名称
            </label>
            <input
              id="sponsor-method-name"
              value={methodForm.name}
              onChange={(event) => setMethodForm({ ...methodForm, name: event.target.value })}
              placeholder="例如：支付宝"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <MediaUrlField
              id="sponsor-method-icon"
              label="图标"
              value={methodForm.icon}
              onChange={(next) => setMethodForm({ ...methodForm, icon: next })}
              inputClass={inputClass}
              labelClass={labelClass}
              accept="image/*"
              filter="IMAGE"
              placeholder="alipay / weixin / kofi / afdian、emoji 或图片地址"
              hint="品牌名会显示对应官方图形；留空时显示名称首字。"
            />
          </div>
          <div>
            <MediaUrlField
              id="sponsor-method-qr"
              label="收款码"
              value={methodForm.qrCodeUrl}
              onChange={(next) => setMethodForm({ ...methodForm, qrCodeUrl: next })}
              inputClass={inputClass}
              labelClass={labelClass}
              accept="image/*"
              filter="IMAGE"
              placeholder="上传收款码或填写图片地址"
            />
          </div>
          <div>
            <label htmlFor="sponsor-method-link" className={labelClass}>
              外部打赏链接
            </label>
            <input
              id="sponsor-method-link"
              value={methodForm.linkUrl}
              onChange={(event) => setMethodForm({ ...methodForm, linkUrl: event.target.value })}
              placeholder="https://ko-fi.com/yourname"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div className="xl:col-span-2">
            <label htmlFor="sponsor-method-description" className={labelClass}>
              描述
            </label>
            <textarea
              id="sponsor-method-description"
              value={methodForm.description}
              onChange={(event) => setMethodForm({ ...methodForm, description: event.target.value })}
              rows={2}
              placeholder="例如：使用支付宝扫码打赏"
              className={`mt-1.5 resize-y ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="sponsor-method-sort" className={labelClass}>
              排序（越大越靠前）
            </label>
            <input
              id="sponsor-method-sort"
              type="number"
              value={methodForm.sortOrder}
              onChange={(event) => setMethodForm({ ...methodForm, sortOrder: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={methodForm.enabled}
              onChange={(event) => setMethodForm({ ...methodForm, enabled: event.target.checked })}
              className="size-4 accent-(--primary)"
            />
            保存后立即在前台显示
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void saveMethod()}
            disabled={busyKey === "method-save" || methodForm.name.trim().length === 0}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-(--btn-content) px-4 text-sm font-medium text-white transition hover:bg-(--primary) disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save aria-hidden className="size-4" />
            {busyKey === "method-save" ? "保存中…" : editingMethodId ? "保存修改" : "添加方式"}
          </button>
          {editingMethodId ? (
            <button
              type="button"
              onClick={() => {
                setEditingMethodId(null);
                setMethodForm(emptyMethod);
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
          <h2 className="text-sm font-semibold">打赏方式</h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{methods.length} 项</span>
        </div>
        {methods.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-(--line-color) px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
            还没有打赏方式，先添加支付宝、微信或外部打赏链接。
          </p>
        ) : (
          methods.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-(--line-color) bg-(--card-bg-transparent) p-4 backdrop-blur-sm transition hover:border-(--primary)/50"
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/5 bg-(--btn-regular-bg) dark:border-white/5">
                  <SponsorMethodIcon
                    icon={item.icon}
                    title={item.name}
                    className="size-8 text-2xl text-(--primary)"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold">{item.name}</h3>
                    <span className="rounded-md bg-(--btn-regular-bg) px-1.5 py-0.5 text-[11px] font-medium text-(--btn-content)">
                      权重 {item.sortOrder}
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
                    {item.description || item.linkUrl || "暂无描述"}
                  </p>
                  <p className="mt-1 truncate text-xs text-zinc-400 dark:text-zinc-500">
                    {item.qrCodeUrl ? `收款码：${item.qrCodeUrl}` : "未设置收款码"}
                    {item.linkUrl ? ` · 链接：${item.linkUrl}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" onClick={() => startEditMethod(item)} className={smallButtonClass}>
                    <Pencil aria-hidden className="size-3.5" />
                    编辑
                  </button>
                  <button
                    type="button"
                    disabled={busyKey === `method-toggle-${item.id}`}
                    onClick={() => void toggleMethod(item)}
                    className={smallButtonClass}
                  >
                    {item.enabled ? <EyeOff aria-hidden className="size-3.5" /> : <Eye aria-hidden className="size-3.5" />}
                    {item.enabled ? "停用" : "启用"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirm({ kind: "method", id: item.id, title: item.name })}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <Trash2 aria-hidden className="size-3.5" />
                    删除
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="rounded-2xl border border-(--line-color) bg-(--card-bg-transparent) p-5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-(--btn-regular-bg) text-(--primary)">
            {editingRecordId ? <Pencil aria-hidden className="size-4" /> : <UsersRound aria-hidden className="size-4" />}
          </span>
          <div>
            <h2 className="text-sm font-semibold">{editingRecordId ? "编辑打赏记录" : "新增打赏记录"}</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">用于展示打赏者名称、金额、日期与留言。</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <div>
            <label htmlFor="sponsor-record-name" className={labelClass}>
              打赏者名称
            </label>
            <input
              id="sponsor-record-name"
              value={recordForm.name}
              onChange={(event) => setRecordForm({ ...recordForm, name: event.target.value })}
              placeholder="例如：夏叶"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <MediaUrlField
              id="sponsor-record-avatar"
              label="头像"
              value={recordForm.avatarUrl}
              onChange={(next) => setRecordForm({ ...recordForm, avatarUrl: next })}
              inputClass={inputClass}
              labelClass={labelClass}
              accept="image/*"
              filter="IMAGE"
              placeholder="留空时显示名称首字"
            />
          </div>
          <div>
            <label htmlFor="sponsor-record-amount" className={labelClass}>
              金额文本
            </label>
            <input
              id="sponsor-record-amount"
              value={recordForm.amount}
              onChange={(event) => setRecordForm({ ...recordForm, amount: event.target.value })}
              placeholder="例如：¥50"
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="sponsor-record-date" className={labelClass}>
              打赏日期
            </label>
            <input
              id="sponsor-record-date"
              type="date"
              value={recordForm.sponsoredAt}
              onChange={(event) => setRecordForm({ ...recordForm, sponsoredAt: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <div className="xl:col-span-2">
            <label htmlFor="sponsor-record-message" className={labelClass}>
              留言
            </label>
            <textarea
              id="sponsor-record-message"
              value={recordForm.message}
              onChange={(event) => setRecordForm({ ...recordForm, message: event.target.value })}
              rows={2}
              placeholder="感谢支持"
              className={`mt-1.5 resize-y ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="sponsor-record-sort" className={labelClass}>
              排序（越大越靠前）
            </label>
            <input
              id="sponsor-record-sort"
              type="number"
              value={recordForm.sortOrder}
              onChange={(event) => setRecordForm({ ...recordForm, sortOrder: event.target.value })}
              className={`mt-1.5 ${inputClass}`}
            />
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={recordForm.enabled}
              onChange={(event) => setRecordForm({ ...recordForm, enabled: event.target.checked })}
              className="size-4 accent-(--primary)"
            />
            在前台打赏者名单中展示
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void saveRecord()}
            disabled={busyKey === "record-save" || recordForm.name.trim().length === 0}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-(--btn-content) px-4 text-sm font-medium text-white transition hover:bg-(--primary) disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save aria-hidden className="size-4" />
            {busyKey === "record-save" ? "保存中…" : editingRecordId ? "保存修改" : "添加记录"}
          </button>
          {editingRecordId ? (
            <button
              type="button"
              onClick={() => {
                setEditingRecordId(null);
                setRecordForm(emptyRecord);
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
          <h2 className="text-sm font-semibold">打赏记录</h2>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{records.length} 条</span>
        </div>
        {records.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-(--line-color) px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
            暂无打赏记录，可在上方添加。
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {records.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-(--line-color) bg-(--card-bg-transparent) p-4 backdrop-blur-sm transition hover:border-(--primary)/50"
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-(--btn-regular-bg) text-sm font-bold text-(--primary)">
                    <span aria-hidden>{item.name.trim().charAt(0) || "赏"}</span>
                    {item.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- 头像来自后台上传或外链
                      <img
                        src={item.avatarUrl}
                        alt={item.name}
                        className="absolute inset-0 size-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold">{item.name}</h3>
                      {item.amount ? <span className="text-xs font-bold text-(--primary)">{item.amount}</span> : null}
                      <span
                        className={
                          item.enabled
                            ? "rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                        }
                      >
                        {item.enabled ? "展示中" : "已隐藏"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {item.sponsoredAt || "未填写日期"} · 权重 {item.sortOrder}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
                      {item.message || "未填写留言"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                  <button type="button" onClick={() => startEditRecord(item)} className={smallButtonClass}>
                    <Pencil aria-hidden className="size-3.5" />
                    编辑
                  </button>
                  <button
                    type="button"
                    disabled={busyKey === `record-toggle-${item.id}`}
                    onClick={() => void toggleRecord(item)}
                    className={smallButtonClass}
                  >
                    {item.enabled ? <EyeOff aria-hidden className="size-3.5" /> : <Eye aria-hidden className="size-3.5" />}
                    {item.enabled ? "隐藏" : "展示"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirm({ kind: "record", id: item.id, title: item.name })}
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

      {confirm ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-500/40 dark:bg-amber-500/10">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            确定删除{confirm.kind === "method" ? "打赏方式" : "打赏记录"}「{confirm.title}」吗？删除后前台立即移除。
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
