import ArticleCodeCopy from "./article-code-copy";

// Markdown 渲染结果容器：HTML 已在服务端经 rehype-sanitize 过滤，样式由 globals.css 的 .article-body 提供
// 代码块顶部条在服务端生成，这里额外挂载客户端的复制按钮
export default function MarkdownContent({ html, className }: { html: string; className?: string }) {
  return (
    <>
      <div
        className={className ? `article-body ${className}` : "article-body"}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <ArticleCodeCopy />
    </>
  );
}