import { visit } from "unist-util-visit";
import type { Element, Root } from "hast";

// 把一个 Shiki 行节点（span[data-line]）改造成官方 Expressive Code 的行结构：
// 左侧 ec-gutter 渲染行号，右侧 ec-code 承载原行内容，两栏之间的分隔线由 CSS 绘制
function toEcLine(line: Element, lineNumber: number): Element {
  const lineProperties: Element["properties"] = {
    className: ["ec-line"],
    "data-line": "",
  };
  if ("data-highlighted-line" in (line.properties ?? {})) {
    lineProperties["data-highlighted-line"] = "";
  }
  return {
    type: "element",
    tagName: "div",
    properties: lineProperties,
    children: [
      {
        type: "element",
        tagName: "div",
        properties: { className: ["ec-gutter"] },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["ln"] },
            children: [{ type: "text", value: String(lineNumber) }],
          },
        ],
      },
      {
        type: "element",
        tagName: "div",
        properties: { className: ["ec-code"] },
        children: line.children,
      },
    ],
  };
}

// 代码块行结构插件：给 rehype-pretty-code 的输出补上官方主题的行号栏与代码列，
// 同时去掉它注入的 display:grid 内联样式，并把带标题的 figcaption 包装成标签页结构
export function rehypeEcLines() {
  return (tree: Root): void => {
    visit(tree, "element", (figure: Element) => {
      if (figure.tagName !== "figure" || !("data-rehype-pretty-code-figure" in (figure.properties ?? {}))) {
        return;
      }
      // 标题标签页：标题文本包一层 span，figure 上标记 data-ec-title 供 CSS 定位徽标与复制按钮
      const title = figure.children.find(
        (child): child is Element =>
          child.type === "element" &&
          child.tagName === "figcaption" &&
          "data-rehype-pretty-code-title" in (child.properties ?? {}),
      );
      if (title) {
        figure.properties["data-ec-title"] = "";
        title.children = [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["code-title"] },
            children: title.children,
          },
        ];
      }
      const pre = figure.children.find(
        (child): child is Element => child.type === "element" && child.tagName === "pre",
      );
      const code = pre?.children.find(
        (child): child is Element => child.type === "element" && child.tagName === "code",
      );
      if (!code) {
        return;
      }
      // 拆除 rehype-pretty-code 的 display:grid：行结构改由本插件生成
      if (code.properties) {
        delete code.properties.style;
      }
      let lineNumber = 0;
      code.children = code.children.map((child) => {
        if (child.type !== "element" || child.tagName !== "span" || !("data-line" in (child.properties ?? {}))) {
          return child;
        }
        lineNumber += 1;
        return toEcLine(child, lineNumber);
      });
    });
  };
}