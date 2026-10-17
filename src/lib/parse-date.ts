// 解析接口传入的时间字符串：空值或非法值统一返回 null
export function parseOptionalDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
