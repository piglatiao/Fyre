import CategoryBar from "@/components/site/category-bar";
import { createSiteServices } from "@/server/services/service-container";

// 服务端分类栏：统一读取分类与归档统计，供内容页复用
export default async function SiteCategoryBar({ activeSlug }: { activeSlug?: string }) {
  const { categoryService, postService } = createSiteServices();
  const [categories, stats] = await Promise.all([
    categoryService.listAllWithCounts(),
    postService.getSiteStats(),
  ]);
  return (
    <CategoryBar
      categories={categories}
      activeSlug={activeSlug}
      archiveCount={stats.publishedCount}
    />
  );
}
