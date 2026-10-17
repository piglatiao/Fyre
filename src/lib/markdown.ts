import GithubSlugger from "github-slugger";
import { toString } from "mdast-util-to-string";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import type { Root } from "mdast";
import { rehypeEcLines } from "@/lib/rehype-ec-lines";
import type { MarkdownResult } from "@/types/markdown-result";
import type { TocItem } from "@/types/toc-item";

// 提取目录：与 rehype-slug 使用同一 slug 算法，保证锚点 id 一致
function extractToc(tree: Root): TocItem[] {
  const slugger = new GithubSlugger();
  const toc: TocItem[] = [];
  visit(tree, "heading", (node) => {
    const text = toString(node);
    const id = slugger.slug(text);
    if (node.depth >= 2 && node.depth <= 3) {
      toc.push({ id, text, level: node.depth });
    }
  });
  return toc;
}

// 渲染 Markdown：白名单过滤防 XSS，代码高亮使用官方同款 one-light / one-dark-pro 主题，
// 行结构由 rehypeEcLines 转换为官方 Expressive Code 形式（行号栏 + 代码列 + 右上角语言徽标）
export async function renderMarkdown(markdown: string): Promise<MarkdownResult> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSanitize)
    .use(rehypeSlug)
    .use(rehypePrettyCode, {
      theme: { light: "one-light", dark: "one-dark-pro" },
      keepBackground: false,
    })
    .use(rehypeEcLines)
    .use(rehypeStringify);

  const processed = String(await processor.process(markdown));
  const html = processed.replace(/<img\s/g, "<img loading=\"lazy\" decoding=\"async\" ");
  const toc = extractToc(unified().use(remarkParse).use(remarkGfm).parse(markdown));
  return { html, toc };
}