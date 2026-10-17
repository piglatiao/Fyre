import EmptyState from "@/components/site/empty-state";
import CategoryBar from "@/components/site/category-bar";
import Pagination from "@/components/site/pagination";
import PostCard from "@/components/site/post-card";
import { parsePageParam, POSTS_PER_PAGE } from "@/lib/pagination";
import { createSiteServices } from "@/server/services/service-container";

// 首页：分类条 + 置顶优先的列表模式文章卡片流 + 分页
export default async function SiteHomePage({ searchParams }: PageProps<"/">) {
  const { page } = await searchParams;
  const currentPage = parsePageParam(page);
  const { postService, categoryService, settingService } = createSiteServices();
  const [result, categories, stats, settings] = await Promise.all([
    postService.listPublishedPage(currentPage, POSTS_PER_PAGE),
    categoryService.listAllWithCounts(),
    postService.getSiteStats(),
    settingService.getSiteSettings(),
  ]);

  return (
    <div className="flex flex-col">
      {/* 首页没有可见标题，与官网一致保留仅供屏幕阅读器的站点标题 */}
      <h1 className="sr-only">{settings.siteName}</h1>
      <CategoryBar categories={categories} archiveCount={stats.publishedCount} />
      {result.items.length > 0 ? (
        <div id="post-list-container" className="mb-4 flex flex-col gap-4">
          {/* 文章列表容器：与官网一致，窄屏由 globals.css 切换为网格布局；卡片逐项延迟入场 */}
          {result.items.map((post, index) => (
            <PostCard key={post.id} post={post} animationDelayMs={index * 50} />
          ))}
        </div>
      ) : (
        <div className="mb-4">
          <EmptyState title="还没有发布的文章" description="登录后台发布第一篇文章后，这里就会热闹起来。" />
        </div>
      )}
      <Pagination basePath="/" page={result.page} totalPages={result.totalPages} />
    </div>
  );
}