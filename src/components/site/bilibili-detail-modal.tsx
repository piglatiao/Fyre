"use client";

import { CalendarDays, Eye, ExternalLink, Star, Users, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";
import { getBilibiliSeasonTypeMeta } from "@/lib/bilibili-season-type";
import type { BilibiliAnime } from "@/types/bilibili-anime";

// 数字使用中文千分位，保持服务端与客户端输出一致
function formatCount(value: number): string {
  return new Intl.NumberFormat("zh-CN").format(value);
}

// 哔哩哔哩详情弹窗：支持背景点击、Esc 关闭与移动端自适应
export default function BilibiliDetailModal({
  anime,
  onClose,
}: {
  anime: BilibiliAnime | null;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!anime) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeydown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [anime, onClose]);

  if (!anime) {
    return null;
  }

  const meta = getBilibiliSeasonTypeMeta(anime.seasonType, anime.seasonTypeName);

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bilibili-detail-title"
        className="onload-animation relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-(--line-divider) bg-(--card-bg) shadow-2xl"
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="关闭详情"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
        >
          <X aria-hidden className="size-4" />
        </button>

        <div className="flex max-h-[90vh] flex-col overflow-y-auto md:flex-row md:overflow-hidden">
          <div className="relative h-56 w-full shrink-0 overflow-hidden bg-(--muted) sm:h-72 md:h-auto md:w-64 lg:w-72">
            {anime.poster ? (
              // eslint-disable-next-line @next/next/no-img-element -- 哔哩哔哩封面为外部 CDN 地址，需禁用 Referer
              <img
                src={anime.poster}
                alt={anime.title}
                referrerPolicy="no-referrer"
                className="size-full object-cover"
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1 overflow-y-auto p-5 sm:p-6 md:max-h-[90vh]">
            <h2 id="bilibili-detail-title" className="pr-8 text-xl font-bold text-neutral-900 sm:text-2xl dark:text-neutral-100">
              {anime.title}
            </h2>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`rounded-lg px-3 py-1 text-xs font-bold text-white ${meta.badgeClass}`}>
                {meta.label}
              </span>
              {anime.rating > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <Star aria-hidden className="size-3 fill-current" />
                  {anime.rating.toFixed(1)}
                  {anime.ratingCount > 0 ? (
                    <span className="font-normal opacity-70">({formatCount(anime.ratingCount)})</span>
                  ) : null}
                </span>
              ) : null}
              {anime.epStatus ? (
                <span className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                  {anime.epStatus}
                </span>
              ) : null}
              <span className="rounded-lg border border-pink-500/20 bg-pink-500/10 px-3 py-1 text-xs font-bold text-pink-600 dark:text-pink-400">
                Bilibili
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-neutral-500 dark:text-neutral-400">
              {anime.releaseDate ? (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays aria-hidden className="size-3.5" />
                  开播 {anime.releaseDate}
                </span>
              ) : null}
              {anime.viewCount > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <Eye aria-hidden className="size-3.5" />
                  {formatCount(anime.viewCount)} 播放
                </span>
              ) : null}
              {anime.followCount > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <Users aria-hidden className="size-3.5" />
                  {formatCount(anime.followCount)} 追番
                </span>
              ) : null}
              <span>{anime.isFinished ? "已完结" : "连载中"}</span>
              {anime.progress ? <span className="text-(--primary)">看到 {anime.progress}</span> : null}
            </div>

            {anime.tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {anime.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-(--btn-regular-bg) px-2.5 py-1 text-[11px] text-(--btn-content)">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">简介</h3>
              <p className="max-h-48 overflow-y-auto text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {anime.summary || "暂无简介"}
              </p>
            </div>

            {anime.link ? (
              <a
                href={anime.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-(--primary) px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 hover:shadow-lg"
              >
                前往哔哩哔哩观看
                <ExternalLink aria-hidden className="size-4" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
