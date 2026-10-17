import type { Project } from "./project";

// 前台项目详情：在卡片字段基础上补充 Markdown 正文
export interface ProjectDetail extends Project {
  content: string;
}
