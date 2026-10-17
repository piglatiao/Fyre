// 媒体上传校验失败：由 API 层捕获并转换为统一错误响应
export class MediaUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaUploadError";
  }
}
