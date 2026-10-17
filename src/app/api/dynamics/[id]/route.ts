import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { handleApiError } from "@/server/api/handle-api-error";
import { readJson } from "@/server/api/read-json";
import { readRouteId } from "@/server/api/read-route-id";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { createSiteServices } from "@/server/services/service-container";
import { dynamicUpsertSchema } from "@/server/validators/dynamic.schema";

// 单条动态接口：PATCH 更新 / DELETE 删除（均需登录）
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const { id } = await context.params;
  const dynamicId = readRouteId(id);
  if (!dynamicId) {
    return errorResponse("invalid_params", "动态 id 不正确", 400);
  }
  const parsed = dynamicUpsertSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const { adminDynamicService } = createSiteServices();
  try {
    await adminDynamicService.update(dynamicId, parsed.data);
    return okResponse({ id: dynamicId });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const { id } = await context.params;
  const dynamicId = readRouteId(id);
  if (!dynamicId) {
    return errorResponse("invalid_params", "动态 id 不正确", 400);
  }
  const { adminDynamicService } = createSiteServices();
  try {
    await adminDynamicService.remove(dynamicId);
    return okResponse({ id: dynamicId });
  } catch (error) {
    return handleApiError(error);
  }
}