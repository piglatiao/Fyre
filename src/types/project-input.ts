import type { ProjectLink } from "./project-link";

// 项目新增/编辑入参：日期由接口层以 YYYY-MM-DD 文本传入
export interface ProjectInput {
  title: string;
  slug: string;
  description: string;
  content: string;
  coverUrl: string;
  status: string;
  tags: string[];
  links: ProjectLink[];
  publishedAt: string;
  sortOrder: number;
  enabled: boolean;
}
