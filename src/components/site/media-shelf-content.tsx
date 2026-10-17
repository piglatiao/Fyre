import { CloudOff, Layers, Settings2, Star } from "lucide-react";
import { formatDate } from "@/lib/format-date";
import type { MediaNsfwMode } from "@/types/media-nsfw-mode";
import type { MediaShelfResult } from "@/types/media-shelf-result";
import type { MediaShelfSource } from "@/types/media-shelf-source";
import MediaShelfExplorer from "./media-shelf-explorer";
import MediaShelfPageHeading from "./media-shelf-page-heading";
import MediaSourceIcon from "./media-source-icon";

// 通用媒体收藏内容：统一呈现同步状态、统计指标与筛选网格
export default function MediaShelfContent({
  source,
  title,
  description,
  result,
  pageSize,
  itemLabel,
  searchPlaceholder,
  emptyTitle,
  emptyDescription,
  showAllTab = false,
  showStatusFilters = true,
  nsfwMode,
  scoreLabel,
}: {
  source: MediaShelfSource;
  title: string;
  description: string;
  result: MediaShelfResult;
  pageSize: number;
  itemLabel: string;
  searchPlaceholder: string;
  emptyTitle: string;
  emptyDescription: string;
  showAllTab?: boolean;
  showStatusFilters?: boolean;
  nsfwMode: MediaNsfwMode;
  scoreLabel: string;
}) {
  const updatedLabel = formatDate(new Date(result.fetchedAt));
  const categoryCount = new Set(result.items.map((item) => item.categoryId)).size;
  const scores = result.items
    .map((item) => item.communityScore > 0 ? item.communityScore : item.score)
    .filter((score) => score > 0);
  const averageScore = scores.length > 0
    ? scores.reduce((total, score) => total + score, 0) / scores.length
    : 0;

  return (
    <section className="card-base onload-animation min-h-32 min-w-0 overflow-hidden rounded-(--radius-large) px-4 py-6 sm:px-6 md:px-9">
      <MediaShelfPageHeading
        source={source}
        title={title}
        description={description}
        updatedLabel={updatedLabel}
      />

      {result.warning ? (
        <p
          role="status"
          className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-300"
        >
          {result.warning}
        </p>
      ) : null}

      {result.status === "not-configured" ? (
        <div className="flex flex-col items-center px-4 py-16 text-center">
          <span className="mb-5 inline-flex size-16 items-center justify-center rounded-full border border-(--line-divider) bg-(--btn-regular-bg) text-(--btn-content)">
            <Settings2 aria-hidden className="size-8" />
          </span>
          <h2 className="text-xl font-semibold text-black/80 dark:text-white/80">尚未完成数据源配置</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-black/55 dark:text-white/55">
            {result.message}
          </p>
        </div>
      ) : result.status === "error" ? (
        <div className="flex flex-col items-center px-4 py-16 text-center">
          <span className="mb-5 inline-flex size-16 items-center justify-center rounded-full border border-(--line-divider) bg-(--btn-regular-bg) text-(--btn-content)">
            <CloudOff aria-hidden className="size-8" />
          </span>
          <h2 className="text-xl font-semibold text-black/80 dark:text-white/80">暂时无法读取收藏数据</h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed break-words text-black/55 dark:text-white/55">
            {result.message}
          </p>
          <p className="mt-1 text-xs text-black/40 dark:text-white/40">请稍后刷新页面重试。</p>
        </div>
      ) : result.status === "empty" ? (
        <div className="flex flex-col items-center px-4 py-16 text-center">
          <span className="mb-5 inline-flex size-16 items-center justify-center rounded-full border border-(--line-divider) bg-(--btn-regular-bg) text-(--btn-content)">
            <MediaSourceIcon source={source} className="size-8" />
          </span>
          <h2 className="text-lg font-semibold text-black/75 dark:text-white/75">{emptyTitle}</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-black/50 dark:text-white/50">
            {emptyDescription}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-4">
            <div className="rounded-xl border border-(--line-divider) bg-linear-to-br from-(--card-bg) to-(--btn-regular-bg)/40 p-2.5 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden size-9 shrink-0 items-center justify-center rounded-lg bg-(--primary)/10 text-(--primary) sm:flex sm:size-10">
                  <Layers aria-hidden className="size-4 sm:size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] text-neutral-500 sm:text-xs dark:text-neutral-400">收藏总数</span>
                  <span className="block text-lg font-bold text-neutral-900 tabular-nums sm:text-2xl dark:text-neutral-100">
                    {result.items.length}
                  </span>
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-(--line-divider) bg-linear-to-br from-(--card-bg) to-(--btn-regular-bg)/40 p-2.5 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden size-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500 sm:flex sm:size-10">
                  <MediaSourceIcon source={source} className="size-4 sm:size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] text-neutral-500 sm:text-xs dark:text-neutral-400">分类数量</span>
                  <span className="block text-lg font-bold text-neutral-900 tabular-nums sm:text-2xl dark:text-neutral-100">
                    {categoryCount}
                  </span>
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-(--line-divider) bg-linear-to-br from-(--card-bg) to-(--btn-regular-bg)/40 p-2.5 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 sm:flex sm:size-10">
                  <Star aria-hidden className="size-4 sm:size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[10px] text-neutral-500 sm:text-xs dark:text-neutral-400">{scoreLabel}均分</span>
                  <span className="block text-lg font-bold text-neutral-900 tabular-nums sm:text-2xl dark:text-neutral-100">
                    {averageScore > 0 ? averageScore.toFixed(1) : "--"}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <MediaShelfExplorer
            items={result.items}
            pageSize={pageSize}
            searchPlaceholder={searchPlaceholder}
            itemLabel={itemLabel}
            showAllTab={showAllTab}
            showStatusFilters={showStatusFilters}
            nsfwMode={nsfwMode}
          />
        </>
      )}
    </section>
  );
}
