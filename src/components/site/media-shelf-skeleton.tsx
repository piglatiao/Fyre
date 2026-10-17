import type { MediaShelfSource } from "@/types/media-shelf-source";
import MediaSourceIcon from "./media-source-icon";

// 媒体列表骨架屏：固定页头、统计、筛选与五列海报网格的空间占位
export default function MediaShelfSkeleton({
  source,
  title,
  description,
}: {
  source: MediaShelfSource;
  title: string;
  description: string;
}) {
  return (
    <section
      aria-busy="true"
      aria-label={`正在同步${title}收藏`}
      className="card-base min-h-32 overflow-hidden rounded-(--radius-large) px-4 py-6 sm:px-6 md:px-9"
    >
      <div className="page-heading mb-6">
        <div className="page-icon" aria-hidden>
          <MediaSourceIcon source={source} className="size-8" />
        </div>
        <div className="min-w-0">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <p className="page-updated">
          <span>数据更新日期</span>
          <span>正在同步…</span>
        </p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-4">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="rounded-xl border border-(--line-divider) bg-(--card-bg) p-2.5 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden size-9 shrink-0 animate-pulse rounded-lg bg-(--btn-regular-bg) sm:block" />
              <span className="min-w-0 flex-1 space-y-2">
                <span className="block h-2.5 w-14 animate-pulse rounded-full bg-(--btn-regular-bg)" />
                <span className="block h-5 w-10 animate-pulse rounded-full bg-(--btn-regular-bg)" />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-5 space-y-3 border-b border-(--line-divider) pb-4">
        <div className="h-5 w-2/3 animate-pulse rounded-full bg-(--btn-regular-bg)" />
        <div className="h-10 animate-pulse rounded-xl bg-(--btn-regular-bg)" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-(--line-divider) bg-(--card-bg)">
            <div className="aspect-[2/3] animate-pulse bg-(--btn-regular-bg)" />
          </div>
        ))}
      </div>
    </section>
  );
}
