import { Clapperboard, CloudOff, Heart, Settings2 } from "lucide-react";
import { formatDate } from "@/lib/format-date";
import type { SiteSettings } from "@/types/site-settings";
import { createSiteServices } from "@/server/services/service-container";
import BilibiliExplorer from "./bilibili-explorer";
import BilibiliPageHeading from "./bilibili-page-heading";

// 哔哩哔哩内容服务端组件：读取收藏数据并渲染统计、状态提示与客户端筛选区
export default async function BilibiliContent({ settings }: { settings: SiteSettings }) {
  const { bilibiliService } = createSiteServices();
  const collection = await bilibiliService.getCollection(
    settings.bilibiliUid,
    settings.bilibiliCacheMinutes,
  );
  const updatedLabel = formatDate(new Date(collection.fetchedAt));

  return (
    <section className="card-base onload-animation min-h-32 overflow-hidden rounded-(--radius-large) px-5 py-6 md:px-9">
      <BilibiliPageHeading
        title={settings.bilibiliPageTitle}
        description={settings.bilibiliPageDescription}
        updatedLabel={updatedLabel}
      />

      {collection.warning ? (
        <p
          role="status"
          className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-300"
        >
          {collection.warning}
        </p>
      ) : null}

      {collection.status === "not-configured" ? (
        <div className="flex flex-col items-center px-4 py-16 text-center">
          <span className="mb-5 inline-flex size-16 items-center justify-center rounded-full border border-(--line-divider) bg-(--btn-regular-bg) text-(--btn-content)">
            <Settings2 aria-hidden className="size-8" />
          </span>
          <h2 className="text-xl font-semibold text-black/80 dark:text-white/80">尚未配置哔哩哔哩账号</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-black/55 dark:text-white/55">
            {collection.message}
          </p>
        </div>
      ) : collection.status === "error" ? (
        <div className="flex flex-col items-center px-4 py-16 text-center">
          <span className="mb-5 inline-flex size-16 items-center justify-center rounded-full border border-(--line-divider) bg-(--btn-regular-bg) text-(--btn-content)">
            <CloudOff aria-hidden className="size-8" />
          </span>
          <h2 className="text-xl font-semibold text-black/80 dark:text-white/80">暂时无法读取收藏数据</h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed break-words text-black/55 dark:text-white/55">
            {collection.message}
          </p>
          <p className="mt-1 text-xs text-black/40 dark:text-white/40">请稍后刷新页面重试。</p>
        </div>
      ) : collection.status === "empty" ? (
        <div className="py-16 text-center">
          <p className="text-base font-semibold text-black/70 dark:text-white/70">暂无追番或追剧数据</p>
          <p className="mt-1 text-sm text-black/45 dark:text-white/45">在哔哩哔哩添加收藏后，这里会自动同步。</p>
        </div>
      ) : (
        <>
          {settings.bilibiliShowStats ? (
            <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-xl border border-(--line-divider) bg-(--card-bg) p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-(--primary)/10 text-(--primary) sm:size-10">
                    <Clapperboard aria-hidden className="size-4 sm:size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] text-neutral-500 sm:text-xs dark:text-neutral-400">收藏总数</span>
                    <span className="block text-lg font-bold text-neutral-900 tabular-nums sm:text-2xl dark:text-neutral-100">
                      {collection.items.length}
                    </span>
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-(--line-divider) bg-(--card-bg) p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-pink-500/10 text-pink-500 sm:size-10">
                    <Heart aria-hidden className="size-4 sm:size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] text-neutral-500 sm:text-xs dark:text-neutral-400">Bilibili 均分</span>
                    <span className="block text-lg font-bold text-neutral-900 tabular-nums sm:text-2xl dark:text-neutral-100">
                      {collection.averageRating.toFixed(1)}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <BilibiliExplorer items={collection.items} pageSize={settings.bilibiliItemsPerPage} />
        </>
      )}
    </section>
  );
}
