import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { handleApiError } from "@/server/api/handle-api-error";
import { readJson } from "@/server/api/read-json";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { createSiteServices } from "@/server/services/service-container";
import { tagUpsertSchema } from "@/server/validators/tag.schema";

// 后台标签接口：GET 列表 / POST 新建
export async function GET(): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const { adminTagService } = createSiteServices();
  return okResponse(await adminTagService.list());
}

export async function POST(request: NextRequest): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const parsed = tagUpsertSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const { adminTagService } = createSiteServices();
  try {
    return okResponse(await adminTagService.create(parsed.data));
  } catch (error) {
    return handleApiError(error);
  }
}
