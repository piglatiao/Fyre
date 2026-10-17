import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toProjectLinks, toProjectTags } from "@/lib/project-json";
import type { Project } from "@/types/project";
import type { ProjectDetail } from "@/types/project-detail";
import type { ProjectRepository } from "./project.repository.interface";

// 项目列表与详情统一字段
const projectSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  coverUrl: true,
  status: true,
  tags: true,
  links: true,
  publishedAt: true,
  sortOrder: true,
} as const;

type ProjectRow = Prisma.ProjectGetPayload<{ select: typeof projectSelect }>;

// 数据库行转换为前台项目卡片
function toProject(row: ProjectRow): Project {
  return {
    ...row,
    tags: toProjectTags(row.tags),
    links: toProjectLinks(row.links),
  };
}

// 基于 Prisma 的项目前台仓储实现
export class PrismaProjectRepository implements ProjectRepository {
  async listEnabled(): Promise<Project[]> {
    const rows = await prisma.project.findMany({
      where: { enabled: true },
      orderBy: [{ sortOrder: "desc" }, { publishedAt: "desc" }, { id: "asc" }],
      select: projectSelect,
    });
    return rows.map(toProject);
  }

  async findEnabledBySlug(slug: string): Promise<ProjectDetail | null> {
    const row = await prisma.project.findFirst({
      where: { slug, enabled: true },
      select: { ...projectSelect, content: true },
    });
    return row ? { ...toProject(row), content: row.content } : null;
  }
}
