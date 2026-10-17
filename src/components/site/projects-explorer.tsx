"use client";

import { Archive, CircleHelp, Clock3, Code2, Rocket, Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { PROJECT_STATUS_KEYS, getProjectStatusMeta } from "@/lib/project-status";
import type { Project } from "@/types/project";
import ProjectCard from "./project-card";

const statusIcons = {
  planning: Clock3,
  developing: Code2,
  published: Rocket,
  archived: Archive,
} as const;

// 项目列表：页头、关键词搜索、状态筛选与响应式卡片网格
export default function ProjectsExplorer({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState("all");

  // 搜索标题、简介与标签，并叠加状态筛选
  const visibleProjects = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return projects.filter((project) => {
      const statusMatched = activeStatus === "all" || project.status === activeStatus;
      const searchMatched =
        !keyword ||
        project.title.toLowerCase().includes(keyword) ||
        project.description.toLowerCase().includes(keyword) ||
        project.tags.some((tag) => tag.toLowerCase().includes(keyword));
      return statusMatched && searchMatched;
    });
  }, [activeStatus, projects, query]);

  return (
    <div className="flex flex-col">
      <section className="card-base onload-animation mb-4 min-h-32 overflow-hidden rounded-(--radius-large) px-5 py-6 md:px-9">
        <div className="page-heading mb-5">
          <div className="page-icon" aria-hidden>
            <Rocket className="size-8" />
          </div>
          <div>
            <h1>项目</h1>
            <p>这里展示我开发过的项目 · {projects.length} 个项目</p>
          </div>
        </div>

        <div className="relative mb-3">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索项目..."
            aria-label="搜索项目"
            className="w-full rounded-xl border border-(--line-divider) bg-transparent py-2.5 pr-4 pl-10 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-(--primary) focus:ring-1 focus:ring-(--primary) dark:text-neutral-100 dark:placeholder:text-neutral-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-active={activeStatus === "all" ? "" : undefined}
            onClick={() => setActiveStatus("all")}
            aria-pressed={activeStatus === "all"}
            className="category-pill px-3 py-1.5 text-sm font-medium"
          >
            全部
          </button>
          {PROJECT_STATUS_KEYS.map((key) => {
            const meta = getProjectStatusMeta(key);
            const Icon = statusIcons[key as keyof typeof statusIcons] ?? CircleHelp;
            return (
              <button
                key={key}
                type="button"
                data-active={activeStatus === key ? "" : undefined}
                onClick={() => setActiveStatus(key)}
                aria-pressed={activeStatus === key}
                className="category-pill inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium"
              >
                <Icon aria-hidden className="size-4" />
                {meta.label}
              </button>
            );
          })}
        </div>
      </section>

      {projects.length === 0 ? (
        <div className="card-base flex flex-col items-center justify-center rounded-(--radius-large) py-16 text-neutral-400 dark:text-neutral-500">
          <Rocket aria-hidden className="mb-4 size-16 opacity-50" />
          <p className="text-lg">暂无项目</p>
        </div>
      ) : visibleProjects.length > 0 ? (
        <div className="projects-grid">
          {visibleProjects.map((project, index) => (
            <ProjectCard key={project.id} project={project} animationDelayMs={index * 50} />
          ))}
        </div>
      ) : (
        <div className="card-base flex flex-col items-center justify-center rounded-(--radius-large) py-12 text-neutral-400 dark:text-neutral-500">
          <SearchX aria-hidden className="mb-3 size-10" />
          <p className="text-sm">没有找到匹配的项目</p>
        </div>
      )}
    </div>
  );
}
