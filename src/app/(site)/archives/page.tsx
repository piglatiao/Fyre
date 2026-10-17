import type { Metadata } from "next";
import Link from "next/link";
import ArchivePanel from "@/components/site/archive-panel";
import BannerPortal from "@/components/site/banner-portal";
import CategoryBar from "@/components/site/category-bar";
import EmptyState from "@/components/site/empty-state";
import PageBannerOverlay from "@/components/site/page-banner-overlay";
import { createSiteServices } from "@/server/services/service-container";

export const metadata: Metadata = { title: "归档" };

// 归档页：分类条 + 按年份分组的时间线；支持 ?category=slug 与 ?tag=slug 过滤
export default async function ArchivesPage({ searchParams }: PageProps<"/archives">) {
  const { category, tag } = await searchParams;
  const categorySlug = Array.isArray(category) ? category[0] : category;
  const tagSlug = Array.isArray(tag) ? tag[0] : tag;
  const { postService, categoryService, tagService } = createSiteServices();
  const [groups, categories, stats, filterCategory, filterTag] = await Promise.all([
    postService.listArchiveGroups(),
    categoryService.listAllWithCounts(),
    postService.getSiteStats(),
    categorySlug ? categoryService.getBySlug(categorySlug) : Promise.resolve(null),
    tagSlug ? tagService.getBySlug(tagSlug) : Promise.resolve(null),
  ]);

  // 按查询参数过滤归档条目
  const filteredGroups = groups
    .map((group) => ({
      ...group,
      entries: group.entries.filter((entry) => {
        if (filterCategory && entry.category?.slug !== filterCategory.slug) {
          return false;
        }
        if (filterTag && !entry.tags.some((item) => item.slug === filterTag.slug)) {
          return false;
        }
        return true;
      }),
    }))
    .filter((group) => group.entries.length > 0);
  const total = filteredGroups.reduce((sum, group) => sum + group.entries.length, 0);
  const filterLabel = filterCategory
    ? `分类：${filterCategory.name}`
    : filterTag
      ? `标签：#${filterTag.name}`
      : "";

  return (
    <div className="flex flex-col">
      {/* 归档页没有可见标题，与官网一致保留仅供屏幕阅读器的标题 */}
      <h1 className="sr-only">归档</h1>
      <CategoryBar
        categories={categories}
        activeSlug={filterCategory?.slug}
        archiveCount={stats.publishedCount}
      />
      {filterLabel ? (
        <div className="card-base onload-animation mb-4 flex flex-wrap items-center gap-2 rounded-(--radius-large) px-5 py-3 text-sm">
          <span className="text-50">{filterLabel}</span>
          <span className="font-semibold text-(--primary)">共 {total} 篇文章</span>
          <Link href="/archive" className="text-50 ml-auto transition hover:text-(--primary)">
            清除筛选
          </Link>
        </div>
      ) : null}
      {filteredGroups.length > 0 ? (
        <ArchivePanel groups={filteredGroups} />
      ) : (
        <EmptyState title="还没有可归档的文章" description="发布文章后，这里会按年份整理。" />
      )}
      <BannerPortal>
        <PageBannerOverlay title="归档" />
      </BannerPortal>
    </div>
  );
}
