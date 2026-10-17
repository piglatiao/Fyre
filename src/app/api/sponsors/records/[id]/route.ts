import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { handleApiError } from "@/server/api/handle-api-error";
import { readJson } from "@/server/api/read-json";
import { readRouteId } from "@/server/api/read-route-id";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { createSiteServices } from "@/server/services/service-container";
import { sponsorRecordUpsertSchema } from "@/server/validators/sponsor.schema";

// 单条打赏记录接口：PUT 更新 / DELETE 删除（均需登录）
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const { id } = await context.params;
  const recordId = readRouteId(id);
  if (!recordId) {
    return errorResponse("invalid_params", "打赏记录 id 不正确", 400);
  }
  const parsed = sponsorRecordUpsertSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const { adminSponsorService } = createSiteServices();
  try {
    await adminSponsorService.updateRecord(recordId, parsed.data);
    return okResponse({ id: recordId });
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
  const recordId = readRouteId(id);
  if (!recordId) {
    return errorResponse("invalid_params", "打赏记录 id 不正确", 400);
  }
  const { adminSponsorService } = createSiteServices();
  try {
    await adminSponsorService.removeRecord(recordId);
    return okResponse({ id: recordId });
  } catch (error) {
    return handleApiError(error);
  }
}
