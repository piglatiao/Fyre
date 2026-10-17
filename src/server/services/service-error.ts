// 业务错误：携带错误码，供 API 层转换为统一错误响应
export class ServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}
