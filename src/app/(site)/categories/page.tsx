import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, FolderOpen } from "lucide-react";
import BannerPortal from "@/components/site/banner-portal";
import CategoryBar from "@/components/site/category-bar";
import EmptyState from "@/components/site/empty-state";
import PageBannerOverlay from "@/components/site/page-banner-overlay";
import { createSiteServices } from "@/server/services/service-container";

export const metadata: Metadata = { title: "分类" };

// 分类总览：标题卡片 + 分类卡片网格（图标 / 名称 / 文章数），视觉对齐官网
export default async function CategoriesPage() {
  const { categoryService, postService } = createSiteServices();
  const [categories, stats] = await Promise.all([
    categoryService.listAllWithCounts(),
    postService.getSiteStats(),
  ]);

  return (
    <div className="flex flex-col">
      <CategoryBar categories={categories} archiveCount={stats.publishedCount} />
      <div className="card-base onload-animation mb-4 rounded-(--radius-large) px-8 py-6">
        <h1 className="text-2xl font-bold text-(--primary) mb-2">分类</h1>
        <p className="text-30 text-sm">全部分类 · {stats.publishedCount} 篇文章</p>
      </div>
      {categories.length > 0 ? (
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="card-base onload-animation group flex items-center gap-4 p-6"
              style={{ animationDelay: `calc(var(--content-delay) + ${index * 50}ms)` }}
            >
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-(--primary)/10 transition-colors group-hover:bg-(--primary)/20">
                <FolderOpen aria-hidden className="size-7 text-(--primary)" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-90 truncate text-lg font-bold transition-colors group-hover:text-(--primary)">
                  {category.name}
                </h2>
                <p className="text-30 mt-1 text-sm transition-colors group-hover:text-(--primary)/60">
                  {category.postCount} 篇文章
                </p>
              </div>
              <ChevronRight
                aria-hidden
                className="text-30 size-6 shrink-0 transition-colors group-hover:text-(--primary)"
              />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="还没有分类" description="在后台创建分类并归类文章后会显示在这里。" />
      )}
      <BannerPortal>
        <PageBannerOverlay title="分类" />
      </BannerPortal>
    </div>
  );
}
