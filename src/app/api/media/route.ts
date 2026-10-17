import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { handleApiError } from "@/server/api/handle-api-error";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { createSiteServices } from "@/server/services/service-container";
import { mediaListQuerySchema } from "@/server/validators/media.schema";

// 媒体接口：GET 分页列表 / POST 上传（multipart/form-data，字段名 file）
export async function GET(request: NextRequest): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const parsed = mediaListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const { adminMediaService } = createSiteServices();
  return okResponse(await adminMediaService.list(parsed.data));
}

export async function POST(request: NextRequest): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse("invalid_params", "请求体不是合法的上传表单", 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return errorResponse("invalid_params", "请选择要上传的文件", 400);
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const { adminMediaService } = createSiteServices();
  try {
    const item = await adminMediaService.upload({
      buffer,
      originalName: file.name,
      mimeType: file.type,
    });
    return okResponse(item);
  } catch (error) {
    return handleApiError(error);
  }
}
