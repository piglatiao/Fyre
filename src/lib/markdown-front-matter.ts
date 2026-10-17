// Markdown 头部信息（--- 包裹的简单 key: value）解析与生成工具

// 解析结果：data 为头部键值对，content 为去掉头部后的正文
export interface MarkdownDocument {
  data: Record<string, string>;
  content: string;
}

// 头部行解析：支持 key: value、带引号的值与 [a, b] 形式的列表
function parseHeaderLine(line: string): [string, string] | null {
  const separator = line.indexOf(":");
  if (separator <= 0) {
    return null;
  }
  const key = line.slice(0, separator).trim().toLowerCase();
  let value = line.slice(separator + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1).trim();
  }
  if (!key) {
    return null;
  }
  return [key, value];
}

// 解析 Markdown 文本：识别开头由 --- 包裹的头部；无头部时 data 为空
export function parseFrontMatter(raw: string): MarkdownDocument {
  const text = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  if (!text.startsWith("---")) {
    return { data: {}, content: text };
  }
  const lines = text.split("\n");
  const endIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (endIndex < 0) {
    return { data: {}, content: text };
  }
  const data: Record<string, string> = {};
  for (const line of lines.slice(1, endIndex)) {
    const parsed = parseHeaderLine(line);
    if (parsed) {
      data[parsed[0]] = parsed[1];
    }
  }
  return { data, content: lines.slice(endIndex + 1).join("\n").replace(/^\n+/, "") };
}

// 读取行内列表值：支持 [a, b] 与 a, b 两种写法
export function readListValue(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  const inner = value.startsWith("[") && value.endsWith("]") ? value.slice(1, -1) : value;
  return inner
    .split(",")
    .map((item) => item.trim().replace(/^["']|["']$/g, ""))
    .filter((item) => item.length > 0);
}

// 生成带头部的 Markdown 文档；空字段自动省略
export function buildFrontMatter(fields: Record<string, string>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(fields)) {
    if (value) {
      lines.push(`${key}: ${value}`);
    }
  }
  return lines.length > 0 ? `---\n${lines.join("\n")}\n---\n\n` : "";
}