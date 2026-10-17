import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { handleApiError } from "@/server/api/handle-api-error";
import { readRouteId } from "@/server/api/read-route-id";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { createSiteServices } from "@/server/services/service-container";

// 单个媒体接口：DELETE 删除（同时删除磁盘文件与数据库记录）
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const { id } = await context.params;
  const mediaId = readRouteId(id);
  if (!mediaId) {
    return errorResponse("invalid_params", "媒体 id 不正确", 400);
  }
  const { adminMediaService } = createSiteServices();
  try {
    await adminMediaService.remove(mediaId);
    return okResponse({ id: mediaId });
  } catch (error) {
    return handleApiError(error);
  }
}
