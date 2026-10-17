import type { Metadata } from "next";
import Link from "next/link";
import BannerPortal from "@/components/site/banner-portal";
import EmptyState from "@/components/site/empty-state";
import PageBannerOverlay from "@/components/site/page-banner-overlay";
import SiteCategoryBar from "@/components/site/site-category-bar";
import TagChip from "@/components/site/tag-chip";
import { createSiteServices } from "@/server/services/service-container";

export const metadata: Metadata = { title: "标签" };

// 标签云：标题卡片 + 全部标签（名称与已发布文章数量）+ Top 10 排行，视觉对齐官网
export default async function TagsPage() {
  const { tagService } = createSiteServices();
  const tags = await tagService.listAll();
  // 热度排行：按已发布文章数降序取前 10（并列时按名称升序），进度条以最高计数为 100%
  const topTags = [...tags]
    .sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name))
    .slice(0, 10);
  const maxCount = topTags[0]?.postCount ?? 0;

  return (
    <div className="onload-animation flex flex-col">
      <SiteCategoryBar />
      {/* 整块淡入：与官网 #content-wrapper 一致 */}
      <div className="card-base mb-4 rounded-(--radius-large) px-8 py-6">
        <h1 className="text-2xl font-bold text-(--primary) mb-2">标签</h1>
        <p className="text-30 text-sm">全部标签 · {tags.length} 个标签</p>
      </div>
      {tags.length > 0 ? (
        <>
          <div className="card-base mb-4 rounded-(--radius-large) px-9 py-6">
            <div className="flex flex-wrap gap-2.5">
              {tags.map((tag) => (
                <TagChip key={tag.slug} tag={tag} count={tag.postCount} />
              ))}
            </div>
          </div>
          <div className="card-base rounded-(--radius-large) px-8 py-6">
            <h2 className="text-lg font-bold text-75 mb-4">Top 10</h2>
            <div className="flex flex-col gap-3">
              {topTags.map((tag, index) => (
                <Link
                  key={tag.slug}
                  href={`/tag/${tag.slug}`}
                  className="group hover:bg-(--btn-card-bg-hover) -mx-3 flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
                >
                  <span className="text-sm font-bold text-(--primary) w-5 shrink-0 text-right">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-50 truncate transition-colors group-hover:text-(--primary)">
                        #{tag.name}
                      </span>
                      <span className="text-xs text-(--primary) ml-2 shrink-0">{tag.postCount} 篇文章</span>
                    </div>
                    <div className="bg-(--primary)/10 h-2 overflow-hidden rounded-full">
                      <div
                        className="bg-(--primary) h-full rounded-full transition-all duration-500"
                        style={{ width: `${maxCount > 0 ? (tag.postCount / maxCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : (
        <EmptyState title="还没有标签" description="给文章添加标签后会显示在这里。" />
      )}
      <BannerPortal>
        <PageBannerOverlay title="标签" />
      </BannerPortal>
    </div>
  );
}
