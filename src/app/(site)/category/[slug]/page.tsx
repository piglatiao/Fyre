import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryBar from "@/components/site/category-bar";
import EmptyState from "@/components/site/empty-state";
import Pagination from "@/components/site/pagination";
import PostCard from "@/components/site/post-card";
import { decodePathSegment } from "@/lib/decode-path-segment";
import { parsePageParam, POSTS_PER_PAGE } from "@/lib/pagination";
import { createSiteServices } from "@/server/services/service-container";

// 分类页 metadata：分类名与描述
export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug: encodedSlug } = await params;
  const slug = decodePathSegment(encodedSlug);
  const { categoryService } = createSiteServices();
  const category = await categoryService.getBySlug(slug);
  if (!category) {
    return { title: "分类不存在" };
  }
  return { title: category.name, description: category.description ?? undefined };
}

// 分类文章列表：分类条 + 列表模式文章卡片 + 分页
export default async function CategoryPage({ params, searchParams }: PageProps<"/category/[slug]">) {
  const [{ slug: encodedSlug }, { page }] = await Promise.all([params, searchParams]);
  const slug = decodePathSegment(encodedSlug);
  const currentPage = parsePageParam(page);
  const { categoryService, postService } = createSiteServices();
  const category = await categoryService.getBySlug(slug);
  if (!category) {
    notFound();
  }
  const [result, categories, stats] = await Promise.all([
    postService.listPublishedPage(currentPage, POSTS_PER_PAGE, { categorySlug: slug }),
    categoryService.listAllWithCounts(),
    postService.getSiteStats(),
  ]);

  return (
    <div className="flex flex-col">
      <CategoryBar categories={categories} activeSlug={category.slug} archiveCount={stats.publishedCount} />
      <div className="card-base onload-animation mb-4 rounded-(--radius-large) px-6 py-5">
        <p className="text-xs tracking-wider text-(--primary) uppercase">分类</p>
        <h1 className="mt-1.5 text-2xl font-bold">{category.name}</h1>
        {category.description ? <p className="text-50 mt-2 text-sm">{category.description}</p> : null}
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
          <EmptyState title="该分类下暂无文章" description="换个分类看看，或稍后再来。" />
        </div>
      )}
      <Pagination basePath={`/category/${category.slug}`} page={result.page} totalPages={result.totalPages} />
    </div>
  );
}
