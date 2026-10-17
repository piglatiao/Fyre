// 后台接口统一响应（客户端使用）：成功 data，失败 error
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };
