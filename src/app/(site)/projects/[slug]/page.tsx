import { ArrowLeft, CalendarDays, Tag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BannerPortal from "@/components/site/banner-portal";
import FloatingTocRegistrar from "@/components/site/floating-toc-registrar";
import MarkdownContent from "@/components/site/markdown-content";
import PostBannerOverlay from "@/components/site/post-banner-overlay";
import ProjectCover from "@/components/site/project-cover";
import ProjectLinkIcon from "@/components/site/project-link-icon";
import ProjectStatusBadge from "@/components/site/project-status-badge";
import SiteCategoryBar from "@/components/site/site-category-bar";
import SiteComments from "@/components/site/site-comments";
import TocPortal from "@/components/site/toc-portal";
import TocCard from "@/components/site/sidebar/toc-card";
import { decodePathSegment } from "@/lib/decode-path-segment";
import { formatDate } from "@/lib/format-date";
import { createSiteServices } from "@/server/services/service-container";

// 项目详情 metadata：标题、简介、标签与封面全部取自后台项目记录
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: encodedSlug } = await params;
  const slug = decodePathSegment(encodedSlug);
  const { projectService } = createSiteServices();
  const view = await projectService.getProjectView(slug);
  if (!view) {
    return { title: "项目不存在" };
  }
  const { project } = view;
  return {
    title: project.title,
    description: project.description,
    keywords: project.tags,
    openGraph: {
      type: "article",
      title: project.title,
      description: project.description,
      publishedTime: project.publishedAt.toISOString(),
      images: project.coverUrl ? [project.coverUrl] : undefined,
    },
  };
}

// 项目详情页：状态、元信息、外链、可放大封面与 Markdown README，目录接入右侧栏与悬浮控件
export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: encodedSlug } = await params;
  const slug = decodePathSegment(encodedSlug);
  const { projectService } = createSiteServices();
  const view = await projectService.getProjectView(slug);
  if (!view) {
    notFound();
  }
  const { project, html, toc } = view;

  return (
    <div className="flex flex-col">
      <SiteCategoryBar />
      <article className="immersive-article card-base relative mb-4 w-full rounded-(--radius-large) px-6 pt-6 pb-4 md:px-9">
        <Link
          href="/projects"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-(--primary) transition hover:underline"
        >
          <ArrowLeft aria-hidden className="size-4" />
          返回项目列表
        </Link>

        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="article-title text-3xl leading-tight font-bold text-90 md:text-[2.25rem]/[2.75rem]">
              {project.title}
            </h1>
            {project.status ? <ProjectStatusBadge status={project.status} /> : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-neutral-500 dark:text-neutral-400">
            <span className="flex items-center">
              <span className="meta-icon">
                <CalendarDays aria-hidden className="size-4" />
              </span>
              <time dateTime={project.publishedAt.toISOString()} className="text-50 text-sm font-medium">
                {formatDate(project.publishedAt)}
              </time>
            </span>
            {project.tags.length > 0 ? (
              <span className="flex min-w-0 items-center">
                <span className="meta-icon">
                  <Tag aria-hidden className="size-4" />
                </span>
                <span className="flex flex-wrap items-center gap-x-1.5 text-sm font-medium">
                  {project.tags.map((tag, index) => (
                    <span key={tag} className="flex items-center">
                      {index > 0 ? <span className="mr-1.5 text-(--meta-divider)">/</span> : null}
                      <span className="text-50 whitespace-nowrap">{tag}</span>
                    </span>
                  ))}
                </span>
              </span>
            ) : null}
          </div>

          {project.description ? (
            <p className="mt-3 line-clamp-4 leading-relaxed text-neutral-600 dark:text-neutral-400">
              {project.description}
            </p>
          ) : null}

          {project.links.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              {project.links.map((link, index) => (
                <a
                  key={`${link.label}-${link.value}`}
                  href={link.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    index === 0
                      ? "inline-flex items-center gap-2 rounded-lg bg-(--primary) px-4 py-2 text-sm font-medium text-white transition hover:bg-(--primary)/80 dark:text-black/70"
                      : "inline-flex items-center gap-2 rounded-lg border border-(--primary)/40 px-4 py-2 text-sm font-medium text-(--primary) transition hover:bg-(--primary)/10"
                  }
                >
                  <ProjectLinkIcon icon={link.icon} label={link.label} />
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}

          {project.coverUrl ? (
            <div className="mt-5">
              <ProjectCover
                src={project.coverUrl}
                alt={project.title}
                expandable
                className="w-full rounded-xl"
                imageClassName="h-auto object-contain"
              />
            </div>
          ) : null}
        </div>

        <MarkdownContent html={html} />
      </article>

      <SiteComments targetType="PROJECT" targetId={project.id} title={project.title} />

      <FloatingTocRegistrar items={toc} />
      <TocPortal>
        <TocCard items={toc} />
      </TocPortal>
      <BannerPortal>
        <PostBannerOverlay title={project.title} description={project.description} />
      </BannerPortal>
    </div>
  );
}
