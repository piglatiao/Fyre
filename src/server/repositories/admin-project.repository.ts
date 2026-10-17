import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toProjectLinks, toProjectTags } from "@/lib/project-json";
import type { AdminProject } from "@/types/admin-project";
import type { ProjectWriteInput } from "@/types/project-write-input";
import type { AdminProjectRepository } from "./admin-project.repository.interface";

// 后台项目查询字段
const adminProjectSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  content: true,
  coverUrl: true,
  status: true,
  tags: true,
  links: true,
  publishedAt: true,
  sortOrder: true,
  enabled: true,
  createdAt: true,
  updatedAt: true,
} as const;

type AdminProjectRow = Prisma.ProjectGetPayload<{ select: typeof adminProjectSelect }>;

// 数据库行转换为后台项目
function toAdminProject(row: AdminProjectRow): AdminProject {
  return {
    ...row,
    tags: toProjectTags(row.tags),
    links: toProjectLinks(row.links),
  };
}

// 入参转换为 Prisma 写入数据
function toWriteData(input: ProjectWriteInput) {
  return {
    title: input.title,
    slug: input.slug,
    description: input.description,
    content: input.content,
    coverUrl: input.coverUrl,
    status: input.status,
    tags: input.tags as unknown as Prisma.InputJsonValue,
    links: input.links as unknown as Prisma.InputJsonValue,
    publishedAt: input.publishedAt,
    sortOrder: input.sortOrder,
    enabled: input.enabled,
  };
}

// 基于 Prisma 的项目后台仓储实现
export class PrismaAdminProjectRepository implements AdminProjectRepository {
  async listAll(): Promise<AdminProject[]> {
    const rows = await prisma.project.findMany({
      orderBy: [{ sortOrder: "desc" }, { publishedAt: "desc" }, { id: "asc" }],
      select: adminProjectSelect,
    });
    return rows.map(toAdminProject);
  }

  async findById(id: number): Promise<AdminProject | null> {
    const row = await prisma.project.findUnique({ where: { id }, select: adminProjectSelect });
    return row ? toAdminProject(row) : null;
  }

  async findBySlug(slug: string): Promise<{ id: number } | null> {
    return prisma.project.findUnique({ where: { slug }, select: { id: true } });
  }

  async create(input: ProjectWriteInput): Promise<{ id: number }> {
    return prisma.project.create({ data: toWriteData(input), select: { id: true } });
  }

  async update(id: number, input: ProjectWriteInput): Promise<void> {
    await prisma.project.update({ where: { id }, data: toWriteData(input) });
  }

  async remove(id: number): Promise<void> {
    await prisma.project.delete({ where: { id } });
  }
}
