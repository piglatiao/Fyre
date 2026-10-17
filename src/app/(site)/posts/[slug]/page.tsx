import { Copyright, BookOpen, CalendarDays, ChevronLeft, ChevronRight, Clock, Eye, FileText, Link2, Tag } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import BannerPortal from "@/components/site/banner-portal";
import CategoryBar from "@/components/site/category-bar";
import FloatingTocRegistrar from "@/components/site/floating-toc-registrar";
import MarkdownContent from "@/components/site/markdown-content";
import PostBannerOverlay from "@/components/site/post-banner-overlay";
import PostUnlock from "@/components/site/post-unlock";
import RelatedPostsCard from "@/components/site/related-posts-card";
import SeriesNavCard from "@/components/site/series-nav-card";
import SiteComments from "@/components/site/site-comments";
import TocPortal from "@/components/site/toc-portal";
import TocCard from "@/components/site/sidebar/toc-card";
import { decodePathSegment } from "@/lib/decode-path-segment";
import { formatDate } from "@/lib/format-date";
import { toPlainText } from "@/lib/plain-text";
import { countContentLength, estimateReadingMinutes } from "@/lib/reading-stats";
import { getSiteUrl } from "@/lib/site-url";
import { unlockCookieName, verifyUnlockToken } from "@/server/auth/post-unlock";
import { createSiteServices } from "@/server/services/service-container";

// 更新与发布间隔超过一天时展示「更新于」
const UPDATE_HINT_THRESHOLD_MS = 24 * 60 * 60 * 1000;
// 文章页「相关文章」推荐条数
const RELATED_POST_COUNT = 5;

// 逐页 metadata：优先使用文章 SEO 字段，其次回退标题与正文摘要
export async function generateMetadata({ params }: PageProps<"/posts/[slug]">): Promise<Metadata> {
  const { slug: encodedSlug } = await params;
  const slug = decodePathSegment(encodedSlug);
  const { postService } = createSiteServices();
  const post = await postService.findPublishedDetail(slug);
  if (!post) {
    return { title: "文章不存在" };
  }
  // 加密文章不通过描述泄露正文
  const description = post.encrypted
    ? (post.seoDescription ?? "该文章已加密，需要密码访问。")
    : (post.seoDescription ?? toPlainText(post.content, 160));
  return {
    title: post.seoTitle ?? post.title,
    description,
    keywords: post.seoKeywords
      ? post.seoKeywords
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : post.tags.map((tag) => tag.name),
    openGraph: {
      type: "article",
      title: post.seoTitle ?? post.title,
      description,
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: post.coverUrl ? [post.coverUrl] : undefined,
    },
  };
}

// 文章详情页：字数/阅读时长、正文、目录、上下篇、版权说明与评论区预留挂载位
export default async function PostDetailPage({ params }: PageProps<"/posts/[slug]">) {
  const { slug: encodedSlug } = await params;
  const slug = decodePathSegment(encodedSlug);
  const { postService, settingService, categoryService } = createSiteServices();
  const unlockState = await postService.getPublishedUnlockState(slug);
  if (!unlockState) {
    notFound();
  }
  const [settings, categories, stats] = await Promise.all([
    settingService.getSiteSettings(),
    categoryService.listAllWithCounts(),
    postService.getSiteStats(),
  ]);

  // 加密文章：未携带有效解锁 Cookie 时只展示密码框，正文不渲染不下发
  if (unlockState.encrypted) {
    const cookieStore = await cookies();
    const token = cookieStore.get(unlockCookieName(unlockState.id))?.value ?? "";
    const unlocked = unlockState.passwordHash
      ? verifyUnlockToken(unlockState.id, unlockState.passwordHash, token)
      : false;
    if (!unlocked) {
      const preview = await postService.findPublishedDetail(slug);
      if (!preview) {
        notFound();
      }
      return (
        <div className="flex flex-col">
          <CategoryBar categories={categories} activeSlug={preview.category?.slug} archiveCount={stats.publishedCount} />
          <article className="card-base relative mb-4 w-full rounded-(--radius-large) px-6 pt-6 pb-4 md:px-9">
            <h1 className="article-title mb-3 text-3xl font-bold text-90 md:text-4xl">{preview.title}</h1>
            <div className="text-50 mb-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span className="flex items-center gap-1.5">
                <CalendarDays aria-hidden className="size-4" />
                {formatDate(preview.publishedAt)}
              </span>
            </div>
            <PostUnlock postId={preview.id} />
          </article>
          <BannerPortal>
            <PostBannerOverlay title={preview.title} description="" />
          </BannerPortal>
        </div>
      );
    }
  }

  const [detail, relatedPosts] = await Promise.all([
    postService.getPublishedDetail(slug),
    postService.listRelatedPosts(slug, RELATED_POST_COUNT),
  ]);
  if (!detail) {
    notFound();
  }

  const seriesPosts = detail.post.series ? await postService.listSeriesPosts(detail.post.series) : [];
  const { post, html, toc, neighbors } = detail;
  const length = countContentLength(post.content);
  const minutes = estimateReadingMinutes(length);
  const authorName = settings.authorName || settings.siteName;
  const postUrl = `${getSiteUrl()}/posts/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription ?? toPlainText(post.content, 160),
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: authorName },
    mainEntityOfPage: postUrl,
    image: post.coverUrl ?? undefined,
  };

  return (
    <div className="flex flex-col">
      <CategoryBar categories={categories} activeSlug={post.category?.slug} archiveCount={stats.publishedCount} />

      <article className="immersive-article card-base relative mb-4 w-full rounded-(--radius-large) px-6 pt-6 pb-4 md:px-9">
        <div className="text-30 mb-3 flex flex-row flex-wrap gap-x-5 gap-y-2">
          <span className="flex flex-row items-center">
            <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-md bg-black/5 text-black/50 dark:bg-white/10 dark:text-white/50">
              <FileText aria-hidden className="size-4" />
            </span>
            <span className="text-sm">{length} 字</span>
          </span>
          <span className="flex flex-row items-center">
            <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-md bg-black/5 text-black/50 dark:bg-white/10 dark:text-white/50">
              <Clock aria-hidden className="size-4" />
            </span>
            <span className="text-sm">{minutes} 分钟</span>
          </span>
          <span className="flex flex-row items-center">
            <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-md bg-black/5 text-black/50 dark:bg-white/10 dark:text-white/50">
              <Eye aria-hidden className="size-4" />
            </span>
            <span className="text-sm">{post.viewCount} 次阅读</span>
          </span>
        </div>

        <h1 className="article-title mb-3 text-3xl font-bold text-90 md:text-[2.25rem]/[2.75rem]">{post.title}</h1>

        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center">
            <CalendarDays aria-hidden className="meta-icon size-4" />
            <span className="text-50 text-sm font-medium">{formatDate(post.publishedAt)}</span>
          </span>
          {post.category ? (
            <span className="flex items-center">
              <BookOpen aria-hidden className="meta-icon size-4" />
              <Link
                href={`/category/${post.category.slug}`}
                className="text-50 text-sm font-medium whitespace-nowrap transition hover:text-(--primary)"
              >
                {post.category.name}
              </Link>
            </span>
          ) : null}
          {post.tags.length > 0 ? (
            <span className="flex items-center">
              <Tag aria-hidden className="meta-icon size-4" />
              <span className="flex flex-row flex-wrap items-center">
                {post.tags.map((tag, index) => (
                  <span key={tag.slug} className="flex items-center">
                    {index > 0 ? <span className="mx-1.5 text-sm text-(--meta-divider)">/</span> : null}
                    <Link
                      href={`/tag/${tag.slug}`}
                      className="text-50 text-sm font-medium whitespace-nowrap transition hover:text-(--primary)"
                    >
                      {tag.name}
                    </Link>
                  </span>
                ))}
              </span>
            </span>
          ) : null}
          {post.updatedAt.getTime() - post.publishedAt.getTime() > UPDATE_HINT_THRESHOLD_MS ? (
            <span className="text-30 text-sm">更新于 {formatDate(post.updatedAt)}</span>
          ) : null}
        </div>

        {post.series && seriesPosts.length > 0 ? (
          <SeriesNavCard series={post.series} posts={seriesPosts} currentSlug={post.slug} />
        ) : null}

        {post.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 封面来自后台上传或外链，原生 img 避免远程域名白名单限制
          <img src={post.coverUrl} alt={post.title} className="mb-6 w-full rounded-xl object-cover" />
        ) : null}

        <MarkdownContent html={html} />
      </article>

      {neighbors.prev || neighbors.next ? (
        <div className="mb-4 flex w-full flex-col justify-between gap-4 overflow-hidden md:flex-row">
          {neighbors.prev ? (
            <Link href={`/posts/${neighbors.prev.slug}`} rel="prev" className="w-full overflow-hidden font-bold active:scale-95">
              <span className="btn-card flex h-15 w-full max-w-full items-center justify-start gap-4 rounded-2xl px-4">
                <ChevronLeft aria-hidden className="size-8 shrink-0 text-(--primary)" />
                <span className="text-75 max-w-[calc(100%-3rem)] overflow-hidden text-ellipsis whitespace-nowrap transition">
                  {neighbors.prev.title}
                </span>
              </span>
            </Link>
          ) : (
            <span aria-hidden className="hidden w-full md:block" />
          )}
          {neighbors.next ? (
            <Link href={`/posts/${neighbors.next.slug}`} rel="next" className="w-full overflow-hidden font-bold active:scale-95">
              <span className="btn-card flex h-15 w-full max-w-full items-center justify-end gap-4 rounded-2xl px-4">
                <span className="text-75 max-w-[calc(100%-3rem)] overflow-hidden text-ellipsis whitespace-nowrap transition">
                  {neighbors.next.title}
                </span>
                <ChevronRight aria-hidden className="size-8 shrink-0 text-(--primary)" />
              </span>
            </Link>
          ) : null}
        </div>
      ) : null}

      {/* 相关文章：与官网文章页一致，按同标签/同分类相关度推荐 */}
      <RelatedPostsCard posts={relatedPosts} />

      {/* 版权说明卡 */}
      <section className="card-base mb-4 flex flex-col rounded-(--radius-large) p-5 md:p-6">
        <div className="mb-3 flex items-center gap-2 border-b border-(--line-divider) pb-3">
          <Copyright aria-hidden className="size-5 text-(--primary)" />
          <span className="text-75 text-base font-bold">版权说明</span>
        </div>
        <div className="space-y-2 rounded-lg p-4 text-sm" style={{ backgroundColor: "var(--license-block-bg)" }}>
          <p className="flex flex-wrap items-center gap-1.5">
            <span className="text-50">文章作者：</span>
            <span className="text-75 font-medium">{authorName}</span>
          </p>
          <p className="flex flex-wrap items-center gap-1.5">
            <span className="text-50 flex items-center gap-1">
              <Link2 aria-hidden className="size-4" />
              文章链接：
            </span>
            <span className="text-75 break-all">{postUrl}</span>
          </p>
          <p className="text-50">
            版权声明：本博客所有文章除特别声明外，均采用 CC BY-NC-SA 4.0 许可协议。转载请注明来自 {settings.siteName}！
          </p>
        </div>
      </section>

      <SiteComments
        targetType="POST"
        targetId={post.id}
        title={post.title}
      />

      <BannerPortal>
        <PostBannerOverlay title={post.title} description={post.seoDescription ?? toPlainText(post.content, 120)} />
      </BannerPortal>

      <FloatingTocRegistrar items={toc} />
      <TocPortal>
        <TocCard items={toc} />
      </TocPortal>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </div>
  );
}
