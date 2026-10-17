import type { ProjectLink } from "./project-link";

// 前台项目卡片：仅包含列表所需字段
export interface Project {
  id: number;
  title: string;
  slug: string;
  description: string;
  coverUrl: string;
  status: string;
  tags: string[];
  links: ProjectLink[];
  publishedAt: Date;
  sortOrder: number;
}
