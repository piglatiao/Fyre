import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import EmptyState from "@/components/site/empty-state";
import SiteCategoryBar from "@/components/site/site-category-bar";
import { formatDate } from "@/lib/format-date";
import { createSiteServices } from "@/server/services/service-container";

export const metadata: Metadata = { title: "搜索" };

// 从 searchParams 中取出搜索关键词（兼容数组形式）
function readKeyword(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : (value ?? "")).trim();
}

// 搜索页：无 JS 也可用的 GET 表单 + 结果列表
export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q } = await searchParams;
  const keyword = readKeyword(q);
  const { postService } = createSiteServices();
  const hits = keyword ? await postService.search(keyword) : [];

  return (
    <div className="flex flex-col">
      <SiteCategoryBar />
      <div className="card-base onload-animation mb-4 rounded-(--radius-large) px-6 py-5">
        <h1 className="text-2xl font-bold">搜索</h1>
        <form action="/search" method="get" role="search" className="mt-4 flex gap-2">
          <label htmlFor="search-input" className="sr-only">
            搜索关键词
          </label>
          <input
            id="search-input"
            name="q"
            type="search"
            defaultValue={keyword}
            placeholder="输入标题或正文关键词"
            autoComplete="off"
            className="h-11 min-w-0 flex-1 rounded-full border border-(--line-color) bg-(--card-bg) px-4 text-sm outline-none transition placeholder:text-black/30 focus:border-(--primary) dark:placeholder:text-white/30"
          />
          <button
            type="submit"
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-(--btn-content) px-5 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Search aria-hidden className="size-4" />
            搜索
          </button>
        </form>
      </div>

      {keyword ? (
        <section className="flex flex-col gap-4">
          <p className="text-50 px-2 text-sm">
            「{keyword}」共找到 {hits.length} 条结果（最多显示 20 条）
          </p>
          {hits.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {hits.map((hit) => (
                <li key={hit.id}>
                  <Link
                    href={`/posts/${hit.slug}`}
                    className="card-base onload-animation group block rounded-(--radius-large) px-5 py-4 transition"
                  >
                    <time dateTime={hit.publishedAt.toISOString()} className="text-30 text-xs">
                      {formatDate(hit.publishedAt)}
                    </time>
                    <h2 className="mt-1.5 text-base font-bold transition group-hover:text-(--primary)">
                      {hit.title}
                    </h2>
                    <p className="text-50 mt-1 line-clamp-2 text-sm">{hit.excerpt}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="没有找到相关文章" description="换个关键词再试试。" />
          )}
        </section>
      ) : (
        <p className="text-30 px-2 text-sm">输入关键词后回车即可搜索。</p>
      )}
    </div>
  );
}
