import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { handleApiError } from "@/server/api/handle-api-error";
import { readJson } from "@/server/api/read-json";
import { readRouteId } from "@/server/api/read-route-id";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { createSiteServices } from "@/server/services/service-container";
import { pageUpsertSchema } from "@/server/validators/page.schema";

// 单个页面接口：GET 详情 / PUT 更新 / DELETE 删除
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const { id } = await context.params;
  const pageId = readRouteId(id);
  if (!pageId) {
    return errorResponse("invalid_params", "页面 id 不正确", 400);
  }
  const { adminPageService } = createSiteServices();
  const detail = await adminPageService.getById(pageId);
  if (!detail) {
    return errorResponse("page_not_found", "页面不存在或已被删除", 404);
  }
  return okResponse(detail);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const { id } = await context.params;
  const pageId = readRouteId(id);
  if (!pageId) {
    return errorResponse("invalid_params", "页面 id 不正确", 400);
  }
  const parsed = pageUpsertSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const { adminPageService } = createSiteServices();
  try {
    await adminPageService.update(pageId, parsed.data);
    return okResponse({ id: pageId });
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
  const pageId = readRouteId(id);
  if (!pageId) {
    return errorResponse("invalid_params", "页面 id 不正确", 400);
  }
  const { adminPageService } = createSiteServices();
  try {
    await adminPageService.remove(pageId);
    return okResponse({ id: pageId });
  } catch (error) {
    return handleApiError(error);
  }
}
