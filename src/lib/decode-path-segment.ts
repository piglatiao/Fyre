// 解码 Next.js 动态路由段；Next 16 可能将非 ASCII 参数以 URL 编码形式传入页面
export function decodePathSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    // 非法百分号编码保持原值，交给上层按未找到处理
    return value;
  }
}
