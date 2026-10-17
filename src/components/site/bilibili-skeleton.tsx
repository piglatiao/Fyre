// 哔哩哔哩数据加载骨架：保持页头、统计与媒体网格布局稳定，避免布局跳变
export default function BilibiliSkeleton({ title, description }: { title: string; description: string }) {
  return (
    <section
      aria-busy="true"
      aria-label="正在同步哔哩哔哩收藏"
      className="card-base min-h-32 overflow-hidden rounded-(--radius-large) px-5 py-6 md:px-9"
    >
      <div className="page-heading mb-6">
        <div className="page-icon animate-pulse bg-(--btn-regular-bg)" aria-hidden />
        <div className="min-w-0">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <p className="page-updated">
          <span>数据更新日期</span>
          <span>正在同步…</span>
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4">
        {[0, 1].map((item) => (
          <div key={item} className="rounded-xl border border-(--line-divider) bg-(--card-bg) p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <span className="size-10 shrink-0 animate-pulse rounded-lg bg-(--btn-regular-bg)" />
              <span className="space-y-2">
                <span className="block h-2.5 w-16 animate-pulse rounded-full bg-(--btn-regular-bg)" />
                <span className="block h-5 w-12 animate-pulse rounded-full bg-(--btn-regular-bg)" />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 space-y-3">
        <div className="h-10 animate-pulse rounded-xl bg-(--btn-regular-bg)" />
        <div className="h-10 animate-pulse rounded-lg bg-(--btn-regular-bg)" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-(--line-divider) bg-(--card-bg)">
            <div className="aspect-[2/3] animate-pulse bg-(--btn-regular-bg)" />
            <div className="space-y-2 p-3">
              <div className="h-4 w-4/5 animate-pulse rounded-full bg-(--btn-regular-bg)" />
              <div className="h-3 w-2/5 animate-pulse rounded-full bg-(--btn-regular-bg)" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
