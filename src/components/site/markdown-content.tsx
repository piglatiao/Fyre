"use client";

import { useRef } from "react";
import ArticleCodeCopy from "./article-code-copy";
import ArticleDiagramRenderer from "./article-diagram-renderer";
import ArticleImageLightbox from "./article-image-lightbox";

// Markdown 渲染结果容器：HTML 已在服务端经 rehype-sanitize 过滤，样式由 globals.css 的 .article-body 提供
// 代码块顶部条在服务端生成，这里额外挂载复制按钮、图表渲染与正文图片灯箱
export default function MarkdownContent({ html, className }: { html: string; className?: string }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <div
        ref={bodyRef}
        className={className ? `article-body ${className}` : "article-body"}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <ArticleCodeCopy rootRef={bodyRef} contentKey={html} />
      <ArticleDiagramRenderer containerRef={bodyRef} contentKey={html} />
      <ArticleImageLightbox containerRef={bodyRef} contentKey={html} />
    </>
  );
}
