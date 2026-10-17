// 阅读统计：估算正文字数与阅读时长（中文按字、英文按词，约 400 字/分钟）

// 统计正文字数：去掉代码块与 Markdown 标记后计数
export function countContentLength(markdown: string): number {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~|-]/g, " ");
  const cjk = plain.match(/[\u4e00-\u9fa5\u3040-\u30ff]/g)?.length ?? 0;
  const words = plain.replace(/[\u4e00-\u9fa5\u3040-\u30ff]/g, " ").match(/[A-Za-z0-9]+/g)?.length ?? 0;
  return cjk + words;
}

// 估算阅读时长（分钟），至少 1 分钟
export function estimateReadingMinutes(length: number): number {
  return Math.max(1, Math.round(length / 400));
}