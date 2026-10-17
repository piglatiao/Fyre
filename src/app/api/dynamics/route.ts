import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { handleApiError } from "@/server/api/handle-api-error";
import { readJson } from "@/server/api/read-json";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { createSiteServices } from "@/server/services/service-container";
import { dynamicListQuerySchema, dynamicUpsertSchema } from "@/server/validators/dynamic.schema";

// 动态接口：GET 公开列表（仅发布时间已到的条目）/ POST 新建（需登录）
export async function GET(request: NextRequest): Promise<Response> {
  const parsed = dynamicListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const { dynamicService } = createSiteServices();
  return okResponse(await dynamicService.list(parsed.data));
}

export async function POST(request: NextRequest): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const parsed = dynamicUpsertSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const { adminDynamicService } = createSiteServices();
  try {
    return okResponse(await adminDynamicService.create(parsed.data));
  } catch (error) {
    return handleApiError(error);
  }
}