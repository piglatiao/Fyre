import type { ProjectLink } from "./project-link";

// 项目仓储写入数据：日期已转换为 Date
export interface ProjectWriteInput {
  title: string;
  slug: string;
  description: string;
  content: string;
  coverUrl: string;
  status: string;
  tags: string[];
  links: ProjectLink[];
  publishedAt: Date;
  sortOrder: number;
  enabled: boolean;
}
