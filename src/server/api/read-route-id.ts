// 解析路由参数中的数字 id：非正整数返回 null
export function readRouteId(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}
