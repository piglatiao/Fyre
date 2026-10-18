import { slug as slugifyHeading } from "github-slugger";
import type { Element, ElementContent, Root, RootContent, Text } from "hast";
import type { WikiLinkTarget } from "@/types/wiki-link-target";

// 与 Obsidian 保持一致：只处理 [[目标]]，不处理 ![[嵌入]]
const WIKI_LINK_PATTERN = /(?<!!)\[\[([^[\]\n]+)\]\]/g;
const STANDALONE_WIKI_LINK = /^\[\[([^[\]\n]+)\]\]$/;
const SKIPPED_TAGS = new Set(["a", "code", "pre", "script", "style", "textarea"]);

// Wiki Link 解析结果：目标路径、可选标题锚点与显示别名
interface ParsedWikiLink {
  contentPath: string;
  heading: string;
  alias: string;
}

// 创建文本节点
function textNode(value: string): Text {
  return { type: "text", value };
}

// 创建元素节点（属性名遵循 HAST 的 camelCase 约定）
function elementNode(
  tagName: string,
  properties: Element["properties"],
  children: ElementContent[] = [],
): Element {
  return { type: "element", tagName, properties, children };
}

// 规范化站内路径：兼容 /posts/ 前缀、Markdown 扩展名与 Windows 分隔符
function normalizeContentPath(value: string): string {
  const normalized = value
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\.?\//, "")
    .replace(/^posts\//i, "")
    .replace(/\/+$/, "")
    .replace(/\.(?:md|mdx|markdown)$/i, "");
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0 || segments.some((segment) => segment === "." || segment === "..")) {
    return "";
  }
  return segments.join("/");
}

// 解析 [[路径#标题|别名]]，路径与标题都允许留空
function parseWikiLink(value: string): ParsedWikiLink | null {
  const [destinationPart, ...aliasParts] = value.split("|");
  const [destination, ...headingParts] = destinationPart.split("#");
  const contentPath = normalizeContentPath(destination);
  const heading = headingParts.join("#").trim();
  const alias = aliasParts.join("|").trim();
  if (!contentPath && !heading) {
    return null;
  }
  return { contentPath, heading, alias };
}

// 生成站内文章地址：逐段编码以兼容中文 slug
function buildPostUrl(slug: string, heading: string): string {
  const encodedPath = slug
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `/posts/${encodedPath}${heading ? `#${slugifyHeading(heading)}` : ""}`;
}

// 封面地址只允许站内相对路径与 HTTP(S)，防止 Wiki 元数据注入危险协议
function isSafeCoverUrl(value: string): boolean {
  const url = value.trim();
  if (!url) {
    return false;
  }
  if (url.startsWith("/") && !url.startsWith("//")) {
    return true;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// 建立 slug 与标题两套索引；标题仅在唯一时用于兜底匹配
function buildTargetIndex(targets: WikiLinkTarget[]): {
  bySlug: Map<string, WikiLinkTarget>;
  byTitle: Map<string, WikiLinkTarget>;
} {
  const bySlug = new Map<string, WikiLinkTarget>();
  const titleCandidates = new Map<string, WikiLinkTarget | null>();
  for (const target of targets) {
    bySlug.set(target.slug.toLowerCase(), target);
    const titleKey = target.title.trim().toLowerCase();
    titleCandidates.set(titleKey, titleCandidates.has(titleKey) ? null : target);
  }
  const byTitle = new Map<string, WikiLinkTarget>();
  for (const [title, target] of titleCandidates) {
    if (target) {
      byTitle.set(title, target);
    }
  }
  return { bySlug, byTitle };
}

// 按 slug 优先、标题次之解析链接目标
function resolveTarget(
  contentPath: string,
  targets: ReturnType<typeof buildTargetIndex>,
): WikiLinkTarget | null {
  const key = contentPath.toLowerCase();
  return targets.bySlug.get(key) ?? targets.byTitle.get(key) ?? null;
}

// 构造独立 Wiki Link 卡片：标题、摘要、日期、分类、标签与可选封面
function createWikiCard(target: WikiLinkTarget, alias: string): Element {
  const title = alias && alias !== target.slug ? alias : target.title;
  const info: ElementContent[] = [elementNode("div", { className: ["wlc-title"] }, [textNode(title)])];
  if (target.excerpt) {
    info.push(
      elementNode("div", { className: ["wlc-description"] }, [textNode(target.excerpt.slice(0, 180))]),
    );
  }

  const meta: ElementContent[] = [];
  if (target.publishedAt) {
    meta.push(elementNode("span", { className: ["wlc-date"] }, [textNode(target.publishedAt)]));
  }
  if (target.category) {
    meta.push(elementNode("span", { className: ["wlc-category"] }, [textNode(target.category.name)]));
  }
  if (target.tags.length > 0) {
    const tags = target.tags.slice(0, 4).map((tag) =>
      elementNode("span", { className: ["wlc-tag"] }, [textNode(`#${tag.name}`)]),
    );
    if (target.tags.length > 4) {
      tags.push(elementNode("span", { className: ["wlc-tag"] }, [textNode(`+${target.tags.length - 4}`)]));
    }
    meta.push(elementNode("span", { className: ["wlc-tags"] }, tags));
  }
  if (target.encrypted) {
    meta.push(elementNode("span", { className: ["wlc-encrypted"] }, [textNode("加密")]));
  }
  if (meta.length > 0) {
    info.push(elementNode("div", { className: ["wlc-meta"] }, meta));
  }

  const cardChildren: ElementContent[] = [
    elementNode("div", { className: ["wlc-info"] }, info),
  ];
  if (target.coverUrl && isSafeCoverUrl(target.coverUrl)) {
    cardChildren.push(
      elementNode("div", { className: ["wlc-cover"] }, [
        elementNode("img", {
          src: target.coverUrl,
          alt: "",
          loading: "lazy",
          decoding: "async",
          className: ["wlc-cover-image"],
        }),
      ]),
    );
  }

  return elementNode(
    "a",
    {
      className: ["card-wiki-link", "no-styling"],
      href: buildPostUrl(target.slug, ""),
      ariaLabel: `查看文章：${target.title}`,
    },
    cardChildren,
  );
}

// 将单个 Wiki Link 转为普通行内链接
function createInlineLink(
  parsed: ParsedWikiLink,
  target: WikiLinkTarget | null,
): Element | null {
  if (!parsed.contentPath && !parsed.heading) {
    return null;
  }
  const fallbackTitle = parsed.contentPath.split("/").at(-1) ?? parsed.heading;
  const title = target?.title ?? fallbackTitle;
  const label =
    parsed.alias && parsed.alias.toLowerCase() !== parsed.contentPath.toLowerCase()
      ? parsed.alias
      : title || parsed.heading;
  const href = parsed.contentPath
    ? buildPostUrl(target?.slug ?? parsed.contentPath, parsed.heading)
    : `#${slugifyHeading(parsed.heading)}`;
  return elementNode(
    "a",
    {
      className: ["wiki-link"],
      href,
      title: target?.title,
    },
    [textNode(parsed.heading && !parsed.alias ? `${label}#${parsed.heading}` : label)],
  );
}

// 把文本节点中的 Wiki Link 拆成文本与链接节点
function replaceInlineWikiLinks(
  value: string,
  targets: ReturnType<typeof buildTargetIndex>,
): ElementContent[] | null {
  const children: ElementContent[] = [];
  const pattern = new RegExp(WIKI_LINK_PATTERN.source, "g");
  let cursor = 0;
  let changed = false;
  for (const match of value.matchAll(pattern)) {
    const start = match.index ?? 0;
    const parsed = parseWikiLink(match[1]);
    if (!parsed) {
      continue;
    }
    if (start > cursor) {
      children.push(textNode(value.slice(cursor, start)));
    }
    const target = parsed.contentPath ? resolveTarget(parsed.contentPath, targets) : null;
    const link = createInlineLink(parsed, target);
    children.push(link ?? textNode(match[0]));
    cursor = start + match[0].length;
    changed = true;
  }
  if (!changed) {
    return null;
  }
  if (cursor < value.length) {
    children.push(textNode(value.slice(cursor)));
  }
  return children;
}

// 尝试把整段 Wiki Link 替换为文章卡片；带标题锚点时保留普通链接
function tryCreateCard(
  node: Element,
  targets: ReturnType<typeof buildTargetIndex>,
): Element | null {
  if (node.tagName !== "p" || node.children.length !== 1 || node.children[0].type !== "text") {
    return null;
  }
  const match = node.children[0].value.trim().match(STANDALONE_WIKI_LINK);
  if (!match) {
    return null;
  }
  const parsed = parseWikiLink(match[1]);
  if (!parsed || parsed.heading || !parsed.contentPath) {
    return null;
  }
  const target = resolveTarget(parsed.contentPath, targets);
  return target ? createWikiCard(target, parsed.alias) : null;
}

// 递归处理正文：跳过已有链接与代码节点，避免二次解析
function transformNode(parent: Root | Element, targets: ReturnType<typeof buildTargetIndex>): void {
  const children = parent.children as RootContent[];
  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    if (child.type === "element") {
      const card = tryCreateCard(child, targets);
      if (card) {
        children[index] = card;
        continue;
      }
      if (SKIPPED_TAGS.has(child.tagName)) {
        continue;
      }
      transformNode(child, targets);
      continue;
    }
    if (child.type !== "text") {
      continue;
    }
    const replacement = replaceInlineWikiLinks(child.value, targets);
    if (replacement) {
      children.splice(index, 1, ...replacement);
      index += replacement.length - 1;
    }
  }
}

// rehype 插件：在 HTML 消毒后生成 Wiki Link 与文章卡片，保持默认白名单不被放宽
export function rehypeWikiLinks(options: { targets?: WikiLinkTarget[] } = {}) {
  const targetIndex = buildTargetIndex(options.targets ?? []);
  return (tree: Root): void => {
    transformNode(tree, targetIndex);
  };
}
