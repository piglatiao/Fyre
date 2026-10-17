"use client";

import { CloudDownload, FileIcon, ImagePlus, Loader2, Sparkles, Trash2 } from "lucide-react";
import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { requestJsonBody } from "@/lib/api-client";
import { captureVideoFrame } from "@/lib/capture-video-frame";
import { isVideoUrl } from "@/lib/media-url";
import { uploadMediaFile } from "@/lib/upload-media-file";
import type { MediaFile } from "@/types/media-file";
import MediaPickerDialog from "./media-picker-dialog";

// 媒体地址字段：输入地址 + 媒体库选择 + 直接上传 + 预览 + 从视频抓帧
// 样式类由调用方传入，保证与所在表单保持一致
export default function MediaUrlField({
  id,
  label,
  value,
  onChange,
  inputClass,
  labelClass,
  placeholder,
  hint,
  accept = "image/*",
  filter = "IMAGE",
  frameGrabSource,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  inputClass: string;
  labelClass: string;
  placeholder?: string;
  hint?: string;
  accept?: string;
  filter?: "IMAGE" | "ALL";
  frameGrabSource?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canGrabFrame = Boolean(frameGrabSource && isVideoUrl(frameGrabSource));
  // 远程地址可一键转存到本站媒体库（本地化后跨域视频也能抓帧）
  const isRemoteUrl = /^https?:\/\//i.test(value);

  // 转存远程文件：下载到媒体库后把字段替换为本站地址
  async function handleTransfer(): Promise<void> {
    setBusy(true);
    setError("");
    const result = await requestJsonBody<MediaFile>("/api/media/import", "POST", { url: value });
    setBusy(false);
    if (result.ok) {
      onChange(result.data.url);
    } else {
      setError(result.error.message);
    }
  }

  // 直接上传：成功后立刻回填地址
  async function handleUpload(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    setBusy(true);
    setError("");
    const result = await uploadMediaFile(file);
    setBusy(false);
    if (result.ok) {
      onChange(result.data.url);
    } else {
      setError(result.error.message);
    }
  }

  // 从视频抓帧：抓到的画面按 WebP 上传媒体库后回填地址
  async function handleGrabFrame(): Promise<void> {
    if (!frameGrabSource) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const blob = await captureVideoFrame(frameGrabSource);
      const uploaded = await uploadMediaFile(new File([blob], `banner-frame-${Date.now()}.webp`, { type: "image/webp" }));
      if (uploaded.ok) {
        onChange(uploaded.data.url);
      } else {
        setError(uploaded.error.message);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "抓帧失败，请重试");
    }
    setBusy(false);
  }

  // 选择媒体库条目
  function handleSelect(item: MediaFile): void {
    onChange(item.url);
    setPickerOpen(false);
  }

  const smallButtonClass =
    "inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 text-xs text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800";

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder ?? "/uploads/… 或外部地址"}
          className={inputClass}
        />
        <button type="button" onClick={() => setPickerOpen(true)} className={`${smallButtonClass} shrink-0`}>
          媒体库
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input ref={fileInputRef} type="file" accept={accept} className="hidden" onChange={(event) => void handleUpload(event)} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={busy} className={smallButtonClass}>
          {busy ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : <ImagePlus aria-hidden className="size-3.5" />}
          {busy ? "处理中…" : "上传"}
        </button>
        {isRemoteUrl ? (
          <button type="button" onClick={() => void handleTransfer()} disabled={busy} className={smallButtonClass}>
            <CloudDownload aria-hidden className="size-3.5" />
            转存到媒体库
          </button>
        ) : null}
        {canGrabFrame ? (
          <button type="button" onClick={() => void handleGrabFrame()} disabled={busy} className={smallButtonClass}>
            <Sparkles aria-hidden className="size-3.5" />
            从视频抓帧
          </button>
        ) : null}
        {value ? (
          <button type="button" onClick={() => onChange("")} className={smallButtonClass}>
            <Trash2 aria-hidden className="size-3.5" />
            清空
          </button>
        ) : null}
      </div>
      {hint ? <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p> : null}
      {error ? <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
      {value ? (
        <div className="mt-2">
          {isVideoUrl(value) ? (
            <video src={value} muted loop autoPlay playsInline className="h-24 w-full rounded-lg border border-zinc-200 object-cover dark:border-zinc-700" />
          ) : /\.(jpe?g|png|webp|gif|avif|svg|ico)(\?|$)/i.test(value) ? (
            // eslint-disable-next-line @next/next/no-img-element -- 预览支持任意来源地址，使用原生 img
            <img
              src={value}
              alt="预览"
              className="h-24 w-full rounded-lg border border-zinc-200 bg-zinc-50 object-contain p-1 dark:border-zinc-700 dark:bg-zinc-800"
            />
          ) : (
            <p className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <FileIcon aria-hidden className="size-3.5" />
              {value}
            </p>
          )}
        </div>
      ) : null}
      {pickerOpen ? (
        <MediaPickerDialog filter={filter} onSelect={handleSelect} onClose={() => setPickerOpen(false)} />
      ) : null}
    </div>
  );
}