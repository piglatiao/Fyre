import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { handleApiError } from "@/server/api/handle-api-error";
import { readJson } from "@/server/api/read-json";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { createSiteServices } from "@/server/services/service-container";
import { sponsorRecordUpsertSchema } from "@/server/validators/sponsor.schema";

// 打赏记录接口：POST 新建（需登录）
export async function POST(request: NextRequest): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const parsed = sponsorRecordUpsertSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const { adminSponsorService } = createSiteServices();
  try {
    return okResponse(await adminSponsorService.createRecord(parsed.data));
  } catch (error) {
    return handleApiError(error);
  }
}
