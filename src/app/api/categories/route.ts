import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { handleApiError } from "@/server/api/handle-api-error";
import { readJson } from "@/server/api/read-json";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { createSiteServices } from "@/server/services/service-container";
import { categoryUpsertSchema } from "@/server/validators/category.schema";

// 后台分类接口：GET 列表 / POST 新建
export async function GET(): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const { adminCategoryService } = createSiteServices();
  return okResponse(await adminCategoryService.list());
}

export async function POST(request: NextRequest): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const parsed = categoryUpsertSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const { adminCategoryService } = createSiteServices();
  try {
    return okResponse(await adminCategoryService.create(parsed.data));
  } catch (error) {
    return handleApiError(error);
  }
}
