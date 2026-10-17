import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { handleApiError } from "@/server/api/handle-api-error";
import { readJson } from "@/server/api/read-json";
import { readRouteId } from "@/server/api/read-route-id";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { createSiteServices } from "@/server/services/service-container";
import { categoryUpsertSchema } from "@/server/validators/category.schema";

// 单个分类接口：PUT 更新 / DELETE 删除（moveTo=数字 迁移到目标分类，moveTo=none 置为无分类）
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const { id } = await context.params;
  const categoryId = readRouteId(id);
  if (!categoryId) {
    return errorResponse("invalid_params", "分类 id 不正确", 400);
  }
  const parsed = categoryUpsertSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const { adminCategoryService } = createSiteServices();
  try {
    await adminCategoryService.update(categoryId, parsed.data);
    return okResponse({ id: categoryId });
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
  const categoryId = readRouteId(id);
  if (!categoryId) {
    return errorResponse("invalid_params", "分类 id 不正确", 400);
  }
  const moveToParam = request.nextUrl.searchParams.get("moveTo");
  let targetCategoryId: number | null | undefined;
  if (moveToParam === null) {
    targetCategoryId = undefined;
  } else if (moveToParam === "none" || moveToParam === "") {
    targetCategoryId = null;
  } else {
    const target = readRouteId(moveToParam);
    if (!target) {
      return errorResponse("invalid_params", "迁移目标分类不正确", 400);
    }
    targetCategoryId = target;
  }
  const { adminCategoryService } = createSiteServices();
  try {
    const result = await adminCategoryService.remove(categoryId, targetCategoryId);
    return okResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
