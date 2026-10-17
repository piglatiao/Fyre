"use client";

import { CalendarDays, ChevronRight, Tag } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { formatDate } from "@/lib/format-date";
import type { Project } from "@/types/project";
import ProjectCover from "./project-cover";
import ProjectLinkIcon from "./project-link-icon";
import ProjectStatusBadge from "./project-status-badge";

// 项目卡片：封面、状态、日期、标签、简介与外部入口，布局对齐官网项目网格
export default function ProjectCard({
  project,
  animationDelayMs,
}: {
  project: Project;
  animationDelayMs?: number;
}) {
  const visibleTags = project.tags.slice(0, 2);
  const hiddenTagCount = project.tags.length - visibleTags.length;
  const animationStyle =
    animationDelayMs === undefined
      ? undefined
      : ({ animationDelay: `calc(var(--content-delay) + ${animationDelayMs}ms)` } as CSSProperties);

  return (
    <article
      className="project-card card-base onload-animation flex min-w-0 flex-col overflow-hidden rounded-(--radius-large)"
      style={animationStyle}
    >
      <Link
        href={`/projects/${project.slug}`}
        aria-label={project.title}
        className="project-card-image group relative mx-4 mt-4 block aspect-[2/1] overflow-hidden rounded-xl"
      >
        <ProjectCover
          src={project.coverUrl}
          alt={project.title}
          className="size-full"
          imageClassName="transition duration-300 group-hover:scale-110"
        />
        <span className="pointer-events-none absolute inset-0 z-10 bg-black/0 transition group-hover:bg-black/30" />
        <span className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <ChevronRight
            aria-hidden
            className="size-10 scale-50 text-white opacity-0 transition group-hover:scale-100 group-hover:opacity-100"
          />
        </span>
        {project.status ? (
          <span className="pointer-events-none absolute top-3 right-3 z-30">
            <ProjectStatusBadge status={project.status} cover />
          </span>
        ) : null}
      </Link>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <Link
          href={`/projects/${project.slug}`}
          className="line-clamp-1 min-w-0 text-[1.35rem]/[1.75rem] font-bold text-black/90 transition hover:text-(--primary) dark:text-white/90"
        >
          {project.title}
        </Link>

        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center">
            <span className="meta-icon">
              <CalendarDays aria-hidden className="size-4" />
            </span>
            <span className="text-50 text-sm font-medium">{formatDate(project.publishedAt)}</span>
          </span>
          {visibleTags.length > 0 ? (
            <span className="flex min-w-0 items-center">
              <span className="meta-icon">
                <Tag aria-hidden className="size-4" />
              </span>
              <span className="flex flex-wrap items-center gap-x-1.5 text-sm font-medium">
                {visibleTags.map((tag, index) => (
                  <span key={tag} className="flex items-center">
                    {index > 0 ? <span className="mr-1.5 text-(--meta-divider)">/</span> : null}
                    <span className="text-50 whitespace-nowrap">{tag}</span>
                  </span>
                ))}
                {hiddenTagCount > 0 ? <span className="text-50">+{hiddenTagCount}</span> : null}
              </span>
            </span>
          ) : null}
        </div>

        {project.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400" title={project.description}>
            {project.description}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          {project.links.map((link) => (
            <a
              key={`${link.label}-${link.value}`}
              href={link.value}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-(--primary)/10 px-2.5 py-1 text-xs font-medium text-(--primary) transition-colors hover:bg-(--primary)/20"
            >
              <ProjectLinkIcon icon={link.icon} label={link.label} className="size-3.5" />
              {link.label}
            </a>
          ))}
          <Link
            href={`/projects/${project.slug}`}
            className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-neutral-500 transition-colors hover:text-(--primary) dark:text-neutral-400"
          >
            查看详情
            <ChevronRight aria-hidden className="size-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
