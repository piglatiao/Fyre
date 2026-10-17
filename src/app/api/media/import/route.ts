import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { handleApiError } from "@/server/api/handle-api-error";
import { readJson } from "@/server/api/read-json";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { createSiteServices } from "@/server/services/service-container";
import { mediaImportSchema } from "@/server/validators/media-import.schema";

// 远程转存接口：把外部文件地址下载到本站媒体库，便于本地引用与视频抓帧
export async function POST(request: NextRequest): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const parsed = mediaImportSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const { adminMediaService } = createSiteServices();
  try {
    return okResponse(await adminMediaService.importFromUrl(parsed.data.url));
  } catch (error) {
    return handleApiError(error);
  }
}