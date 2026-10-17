import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { handleApiError } from "@/server/api/handle-api-error";
import { readJson } from "@/server/api/read-json";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { createSiteServices } from "@/server/services/service-container";
import { tagMergeSchema } from "@/server/validators/tag.schema";

// 标签合并接口：把 source 标签的关联迁移到 target 后删除 source
export async function POST(request: NextRequest): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const parsed = tagMergeSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const { adminTagService } = createSiteServices();
  try {
    await adminTagService.merge(parsed.data.sourceId, parsed.data.targetId);
    return okResponse({ merged: true });
  } catch (error) {
    return handleApiError(error);
  }
}
