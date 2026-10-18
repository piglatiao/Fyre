import type { WikiLinkTarget } from "./wiki-link-target";

// Markdown 渲染上下文：不在文章详情页时可不传，Wiki Link 会退化为普通站内链接
export interface MarkdownRenderOptions {
  wikiLinkTargets?: WikiLinkTarget[];
}
