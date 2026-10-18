import type { Element, ElementContent, Root, RootContent, Text } from "hast";
import { visit } from "unist-util-visit";
import { buildPlantUmlSvgUrl, encodePlantUml, injectPlantUmlTheme } from "@/lib/plantuml-encode";

// 图表源码块语言标识
const MERMAID_LANGUAGE = "mermaid";
const PLANTUML_LANGUAGE = "plantuml";
// 与官网一致的 PlantUML 公共服务和暗色主题
const PLANTUML_SERVER = "https://www.plantuml.com/plantuml";
const PLANTUML_DARK_THEME = "cyborg";

// 创建文本节点
function textNode(value: string): Text {
  return { type: "text", value };
}

// 创建元素节点
function elementNode(
  tagName: string,
  properties: Element["properties"],
  children: ElementContent[] = [],
): Element {
  return { type: "element", tagName, properties, children };
}

// 读取节点下全部纯文本
function readText(node: RootContent | ElementContent): string {
  if (node.type === "text") {
    return node.value;
  }
  if (node.type !== "element") {
    return "";
  }
  return node.children.map((child) => readText(child)).join("");
}

// 从代码块 class 中读取语言名
function readLanguage(code: Element): string {
  const className = code.properties?.className;
  const values = Array.isArray(className) ? className : typeof className === "string" ? [className] : [];
  for (const value of values) {
    const match = String(value).match(/^language-(.+)$/);
    if (match) {
      return match[1].toLowerCase();
    }
  }
  return "";
}

// 构造图表工具条：缩放、复位与全屏按钮
function createToolbar(label: string): Element {
  const action = (
    name: string,
    ariaLabel: string,
    symbol: string,
  ): Element =>
    elementNode(
      "button",
      {
        type: "button",
        className: ["diagram-action"],
        "data-diagram-action": name,
        ariaLabel,
        title: ariaLabel,
      },
      [textNode(symbol)],
    );
  return elementNode("div", { className: ["diagram-toolbar"] }, [
    elementNode("span", { className: ["diagram-label"] }, [textNode(label)]),
    elementNode("div", { className: ["diagram-actions"] }, [
      action("zoom-out", "缩小图表", "−"),
      action("zoom-in", "放大图表", "+"),
      action("reset", "恢复图表大小", "↺"),
      action("fullscreen", "全屏查看图表", "全屏"),
    ]),
  ]);
}

// 构造可展开的源码块：图表加载失败时由客户端自动展开
function createSourceDetails(source: string): Element {
  return elementNode("details", { className: ["diagram-source"] }, [
    elementNode("summary", {}, [textNode("查看图表源码")]),
    elementNode("pre", { className: ["diagram-source-code"] }, [textNode(source)]),
  ]);
}

// 构造 Mermaid 容器：源码保留在 details 中，客户端仅在存在图表时按需加载渲染器
function createMermaidContainer(source: string, index: number): Element {
  return elementNode(
    "div",
    {
      className: ["diagram-container", "mermaid-diagram-container"],
      "data-diagram-kind": "mermaid",
      "data-diagram-index": String(index),
      role: "group",
      ariaLabel: "Mermaid 图表",
    },
    [
      createToolbar("Mermaid"),
      elementNode("div", { className: ["diagram-status"], role: "status" }, [
        textNode("正在渲染 Mermaid 图表…"),
      ]),
      elementNode("div", { className: ["diagram-viewport"], tabIndex: 0, ariaLabel: "Mermaid 图表画布" }, [
        elementNode("div", { className: ["diagram-stage"] }, [
          elementNode("div", { className: ["diagram-output"], role: "img", ariaLabel: "Mermaid 图表" }),
        ]),
      ]),
      createSourceDetails(source),
    ],
  );
}

// 构造 PlantUML 容器：同时生成亮色与暗色两张服务端 SVG，CSS 负责主题切换
function createPlantUmlContainer(source: string, index: number): Element {
  const darkSource = injectPlantUmlTheme(source, PLANTUML_DARK_THEME);
  const lightUrl = buildPlantUmlSvgUrl(PLANTUML_SERVER, encodePlantUml(source));
  const darkUrl =
    darkSource === source
      ? lightUrl
      : buildPlantUmlSvgUrl(PLANTUML_SERVER, encodePlantUml(darkSource));
  const alt = source.replace(/\s+/g, " ").trim().slice(0, 160) || "PlantUML 图表";
  return elementNode(
    "div",
    {
      className: ["diagram-container", "plantuml-diagram-container"],
      "data-diagram-kind": "plantuml",
      "data-diagram-index": String(index),
      role: "group",
      ariaLabel: "PlantUML 图表",
    },
    [
      createToolbar("PlantUML"),
      elementNode("div", { className: ["diagram-status"], role: "status" }, [
        textNode("正在加载 PlantUML 图表…"),
      ]),
      elementNode("div", { className: ["diagram-viewport"], tabIndex: 0, ariaLabel: "PlantUML 图表画布" }, [
        elementNode("div", { className: ["diagram-stage"] }, [
          elementNode("img", {
            className: ["plantuml-image", "plantuml-image-light"],
            "data-plantuml-theme": "light",
            src: lightUrl,
            alt,
            loading: "lazy",
            decoding: "async",
          }),
          elementNode("img", {
            className: ["plantuml-image", "plantuml-image-dark"],
            "data-plantuml-theme": "dark",
            src: darkUrl,
            alt,
            loading: "lazy",
            decoding: "async",
          }),
        ]),
      ]),
      createSourceDetails(source),
    ],
  );
}

// rehype 插件：把 mermaid / plantuml 围栏代码转换为可交互图表容器
export function rehypeMarkdownDiagrams() {
  return (tree: Root): void => {
    let diagramIndex = 0;
    visit(tree, "element", (node) => {
      if (node.tagName !== "pre") {
        return;
      }
      const code = node.children.find(
        (child): child is Element => child.type === "element" && child.tagName === "code",
      );
      if (!code) {
        return;
      }
      const language = readLanguage(code);
      const source = readText(code).replace(/\n$/, "");
      if (!source.trim()) {
        return;
      }
      const container =
        language === MERMAID_LANGUAGE
          ? createMermaidContainer(source, diagramIndex)
          : language === PLANTUML_LANGUAGE
            ? createPlantUmlContainer(source, diagramIndex)
            : null;
      if (!container) {
        return;
      }
      diagramIndex += 1;
      node.tagName = container.tagName;
      node.properties = container.properties;
      node.children = container.children;
    });
  };
}
