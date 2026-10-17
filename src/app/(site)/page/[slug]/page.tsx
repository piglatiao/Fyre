import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BannerPortal from "@/components/site/banner-portal";
import FloatingTocRegistrar from "@/components/site/floating-toc-registrar";
import MarkdownContent from "@/components/site/markdown-content";
import PageBannerOverlay from "@/components/site/page-banner-overlay";
import SiteCategoryBar from "@/components/site/site-category-bar";
import TocPortal from "@/components/site/toc-portal";
import TocCard from "@/components/site/sidebar/toc-card";
import { decodePathSegment } from "@/lib/decode-path-segment";
import { formatDate } from "@/lib/format-date";
import { createSiteServices } from "@/server/services/service-container";

// 自定义页面 metadata：页面标题
export async function generateMetadata({ params }: PageProps<"/page/[slug]">): Promise<Metadata> {
  const { slug: encodedSlug } = await params;
  const slug = decodePathSegment(encodedSlug);
  const { pageService } = createSiteServices();
  const view = await pageService.getPublishedBySlug(slug);
  return view ? { title: view.page.title } : { title: "页面不存在" };
}

// 自定义页面（关于我等）：卡片式正文 + 目录（右侧栏 / 悬浮）
export default async function CustomPage({ params }: PageProps<"/page/[slug]">) {
  const { slug: encodedSlug } = await params;
  const slug = decodePathSegment(encodedSlug);
  const { pageService } = createSiteServices();
  const view = await pageService.getPublishedBySlug(slug);
  if (!view) {
    notFound();
  }

  return (
    <div className="flex flex-col">
      <SiteCategoryBar />
      <article className="immersive-article card-base relative mb-4 w-full rounded-(--radius-large) px-6 pt-6 pb-4 md:px-9">
        <h1 className="article-title mb-3 text-3xl font-bold text-90 md:text-[2.25rem]/[2.75rem]">
          {view.page.title}
        </h1>
        <p className="text-30 mb-5 text-sm">最后更新：{formatDate(view.page.updatedAt)}</p>
        <MarkdownContent html={view.html} />
      </article>
      <FloatingTocRegistrar items={view.toc} />
      <TocPortal>
        <TocCard items={view.toc} />
      </TocPortal>
      <BannerPortal>
        <PageBannerOverlay title={view.page.title} />
      </BannerPortal>
    </div>
  );
}
