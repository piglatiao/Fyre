import { errorResponse } from "@/lib/api-response";
import { ServiceError } from "@/server/services/service-error";
import { MediaUploadError } from "@/server/storage/media-upload-error";

// 把服务层与存储层的可预期错误转换为统一错误响应，其余错误继续向上抛出
export function handleApiError(error: unknown): Response {
  if (error instanceof ServiceError) {
    return errorResponse(error.code, error.message, 400);
  }
  if (error instanceof MediaUploadError) {
    return errorResponse("invalid_file", error.message, 400);
  }
  throw error;
}
