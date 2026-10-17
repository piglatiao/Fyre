import { requestJson } from "@/lib/api-client";
import type { ApiResult } from "@/types/api-result";
import type { MediaFile } from "@/types/media-file";

// 上传单个媒体文件到媒体库：统一走 /api/media，返回媒体记录或错误信息
export function uploadMediaFile(file: File): Promise<ApiResult<MediaFile>> {
  const form = new FormData();
  form.append("file", file);
  return requestJson<MediaFile>("/api/media", { method: "POST", body: form });
}