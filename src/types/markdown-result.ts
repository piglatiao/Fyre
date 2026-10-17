import type { TocItem } from "./toc-item";

// Markdown 渲染结果：安全 HTML 与目录
export interface MarkdownResult {
  html: string;
  toc: TocItem[];
}
