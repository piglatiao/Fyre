import type { Metadata } from "next";
import BannerPortal from "@/components/site/banner-portal";
import EmptyState from "@/components/site/empty-state";
import PageBannerOverlay from "@/components/site/page-banner-overlay";
import SeriesAccordionList from "@/components/site/series-accordion-list";
import SiteCategoryBar from "@/components/site/site-category-bar";
import { createSiteServices } from "@/server/services/service-container";

export const metadata: Metadata = { title: "系列" };

// 系列总览：按系列聚合已发布文章，展开后可顺序阅读同一主题内容
export default async function SeriesPage() {
  const { postService } = createSiteServices();
  const series = await postService.listSeries();
  const postCount = series.reduce((total, group) => total + group.posts.length, 0);

  return (
    <div className="onload-animation flex flex-col">
      <SiteCategoryBar />
      <div className="card-base mb-4 rounded-(--radius-large) px-8 py-6">
        <h1 className="mb-2 text-2xl font-bold text-(--primary)">系列</h1>
        <p className="text-30 text-sm">
          全部系列 · {postCount} 篇文章
        </p>
      </div>
      {series.length > 0 ? (
        <SeriesAccordionList series={series} />
      ) : (
        <EmptyState title="还没有系列文章" description="在后台为文章设置所属系列后，这里会按系列聚合展示。" />
      )}
      <BannerPortal>
        <PageBannerOverlay title="系列" />
      </BannerPortal>
    </div>
  );
}
