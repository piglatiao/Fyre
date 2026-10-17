import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { handleApiError } from "@/server/api/handle-api-error";
import { readJson } from "@/server/api/read-json";
import { readRouteId } from "@/server/api/read-route-id";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { createSiteServices } from "@/server/services/service-container";
import { tagUpsertSchema } from "@/server/validators/tag.schema";

// 单个标签接口：PUT 更新 / DELETE 删除
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const { id } = await context.params;
  const tagId = readRouteId(id);
  if (!tagId) {
    return errorResponse("invalid_params", "标签 id 不正确", 400);
  }
  const parsed = tagUpsertSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const { adminTagService } = createSiteServices();
  try {
    await adminTagService.update(tagId, parsed.data);
    return okResponse({ id: tagId });
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
  const tagId = readRouteId(id);
  if (!tagId) {
    return errorResponse("invalid_params", "标签 id 不正确", 400);
  }
  const { adminTagService } = createSiteServices();
  try {
    await adminTagService.remove(tagId);
    return okResponse({ id: tagId });
  } catch (error) {
    return handleApiError(error);
  }
}
