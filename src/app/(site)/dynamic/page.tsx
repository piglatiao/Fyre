import { CalendarDays, MapPin, Pin, Search } from "lucide-react";
import type { Metadata } from "next";
import BannerPortal from "@/components/site/banner-portal";
import DynamicGallery from "@/components/site/dynamic-gallery";
import EmptyState from "@/components/site/empty-state";
import MarkdownContent from "@/components/site/markdown-content";
import PageBannerOverlay from "@/components/site/page-banner-overlay";
import Pagination from "@/components/site/pagination";
import SiteCategoryBar from "@/components/site/site-category-bar";
import SiteComments from "@/components/site/site-comments";
import { formatDateTimeSeconds } from "@/lib/dynamic-time";
import { parsePageParam } from "@/lib/pagination";
import { createSiteServices } from "@/server/services/service-container";

export const metadata: Metadata = { title: "动态" };

// 每页动态条数
const DYNAMICS_PER_PAGE = 10;

// 从 searchParams 读取文本参数（兼容数组形式）
function readText(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : (value ?? "")).trim();
}

// 从 searchParams 读取年份（非法值忽略）
function readYear(value: string | string[] | undefined): number | undefined {
  const year = Number.parseInt(readText(value), 10);
  return Number.isInteger(year) && year >= 2000 && year <= 2999 ? year : undefined;
}

// 动态列表页：搜索 + 年份筛选 + 条目卡（正文服务端渲染，配图可点击放大）
export default async function DynamicPage({ searchParams }: PageProps<"/dynamic">) {
  const params = await searchParams;
  const keyword = readText(params.q);
  const year = readYear(params.year);
  const currentPage = parsePageParam(params.page);
  const { dynamicService, settingService } = createSiteServices();
  const [result, settings] = await Promise.all([
    dynamicService.list({
      page: currentPage,
      pageSize: DYNAMICS_PER_PAGE,
      year,
      keyword: keyword || undefined,
    }),
    settingService.getSiteSettings(),
  ]);
  const authorName = settings.authorName || settings.siteName;
  const avatar = settings.authorAvatar || settings.siteLogo;
  const paginationQuery: Record<string, string> = {
    ...(keyword ? { q: keyword } : {}),
    ...(year ? { year: String(year) } : {}),
  };

  return (
    <div className="flex flex-col">
      <SiteCategoryBar />
      <div className="card-base onload-animation mb-4 rounded-(--radius-large) px-6 py-5 md:px-8 md:py-6">
        <h1 className="text-2xl font-bold text-(--primary) mb-1.5">动态</h1>
        <p className="text-30 text-sm">
          随手记下此刻的想法与日常 · 共 {result.total} 条动态
        </p>
        <form action="/dynamic" method="get" className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="dynamic-search" className="sr-only">
            搜索动态
          </label>
          <input
            id="dynamic-search"
            name="q"
            type="search"
            defaultValue={keyword}
            placeholder="搜索动态..."
            autoComplete="off"
            className="h-10 min-w-0 flex-1 rounded-lg border border-(--line-color) bg-(--card-bg) px-3.5 text-sm outline-none transition placeholder:text-black/30 focus:border-(--primary) dark:placeholder:text-white/30"
          />
          <label htmlFor="dynamic-year" className="sr-only">
            按年份筛选
          </label>
          <select
            id="dynamic-year"
            name="year"
            defaultValue={year ? String(year) : ""}
            className="h-10 rounded-lg border border-(--line-color) bg-(--card-bg) px-3 text-sm outline-none transition focus:border-(--primary)"
          >
            <option value="">全部年份</option>
            {result.years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-(--btn-content) px-5 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Search aria-hidden className="size-4" />
            筛选
          </button>
        </form>
      </div>

      {result.items.length > 0 ? (
        <div className="mb-4 flex flex-col gap-4">
          {result.items.map((entry) => (
            <article key={entry.id} className="card-base onload-animation rounded-(--radius-large) px-6 py-5">
              <header className="flex items-center gap-3">
                {avatar ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- 头像来自后台设置，地址任意 */
                  <img src={avatar} alt="" className="size-10 shrink-0 rounded-full object-cover" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                    {authorName}
                    {entry.pinned ? (
                      <span className="flex items-center gap-0.5 rounded-md bg-(--btn-regular-bg) px-1.5 py-0.5 text-xs font-bold text-(--btn-content)">
                        <Pin aria-hidden className="size-3" />
                        置顶
                      </span>
                    ) : null}
                  </p>
                  <p className="text-30 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="flex items-center gap-1">
                      <CalendarDays aria-hidden className="size-3.5" />
                      {formatDateTimeSeconds(entry.publishedAt)} UTC+8
                    </span>
                    {entry.location ? (
                      <span className="flex items-center gap-1">
                        <MapPin aria-hidden className="size-3.5" />
                        {entry.location}
                      </span>
                    ) : null}
                  </p>
                </div>
              </header>
              <MarkdownContent html={entry.html} className="mt-3" />
              <DynamicGallery images={entry.images} />
              <SiteComments
                targetType="DYNAMIC"
                targetId={entry.id}
                title="动态评论"
                collapsible
              />
            </article>
          ))}
        </div>
      ) : (
        <div className="mb-4">
          <EmptyState
            title={keyword || year ? "没有匹配的动态" : "还没有动态"}
            description={keyword || year ? "换个关键词或年份再试试。" : "登录后台发布第一条动态后，这里就会热闹起来。"}
          />
        </div>
      )}

      <Pagination basePath="/dynamic" page={currentPage} totalPages={Math.max(1, Math.ceil(result.total / DYNAMICS_PER_PAGE))} query={paginationQuery} />
      <BannerPortal>
        <PageBannerOverlay title="动态" />
      </BannerPortal>
    </div>
  );
}
