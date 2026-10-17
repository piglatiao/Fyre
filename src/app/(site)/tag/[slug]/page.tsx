import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryBar from "@/components/site/category-bar";
import EmptyState from "@/components/site/empty-state";
import Pagination from "@/components/site/pagination";
import PostCard from "@/components/site/post-card";
import { decodePathSegment } from "@/lib/decode-path-segment";
import { parsePageParam, POSTS_PER_PAGE } from "@/lib/pagination";
import { createSiteServices } from "@/server/services/service-container";

// 标签页 metadata：标签名
export async function generateMetadata({ params }: PageProps<"/tag/[slug]">): Promise<Metadata> {
  const { slug: encodedSlug } = await params;
  const slug = decodePathSegment(encodedSlug);
  const { tagService } = createSiteServices();
  const tag = await tagService.getBySlug(slug);
  return tag ? { title: `#${tag.name}` } : { title: "标签不存在" };
}

// 标签文章列表：分类条 + 列表模式文章卡片 + 分页
export default async function TagPage({ params, searchParams }: PageProps<"/tag/[slug]">) {
  const [{ slug: encodedSlug }, { page }] = await Promise.all([params, searchParams]);
  const slug = decodePathSegment(encodedSlug);
  const currentPage = parsePageParam(page);
  const { tagService, postService, categoryService } = createSiteServices();
  const tag = await tagService.getBySlug(slug);
  if (!tag) {
    notFound();
  }
  const [result, categories, stats] = await Promise.all([
    postService.listPublishedPage(currentPage, POSTS_PER_PAGE, { tagSlug: slug }),
    categoryService.listAllWithCounts(),
    postService.getSiteStats(),
  ]);

  return (
    <div className="flex flex-col">
      <CategoryBar categories={categories} archiveCount={stats.publishedCount} />
      <div className="card-base onload-animation mb-4 rounded-(--radius-large) px-6 py-5">
        <p className="text-xs tracking-wider text-(--primary) uppercase">标签</p>
        <h1 className="mt-1.5 text-2xl font-bold">#{tag.name}</h1>
        <p className="text-50 mt-2 text-sm">共 {result.total} 篇文章</p>
      </div>
      {result.items.length > 0 ? (
        <div className="mb-4 flex flex-col gap-4">
          {result.items.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="mb-4">
          <EmptyState title="该标签下暂无文章" description="换个标签看看，或稍后再来。" />
        </div>
      )}
      <Pagination basePath={`/tag/${tag.slug}`} page={result.page} totalPages={result.totalPages} />
    </div>
  );
}
