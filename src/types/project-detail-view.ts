import type { ProjectDetail } from "./project-detail";
import type { TocItem } from "./toc-item";

// 项目详情视图：项目数据与渲染后的安全 HTML、目录
export interface ProjectDetailView {
  project: ProjectDetail;
  html: string;
  toc: TocItem[];
}
