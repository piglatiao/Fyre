// 从纯 UID 或哔哩哔哩空间链接中提取数字 UID；无法识别时返回空串
export function normalizeBilibiliUid(value: string): string {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed.match(/space\.bilibili\.com\/(\d+)/i)?.[1] ?? "";
}
