import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { handleApiError } from "@/server/api/handle-api-error";
import { readJson } from "@/server/api/read-json";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { createSiteServices } from "@/server/services/service-container";
import { updateProfileSchema } from "@/server/validators/account.schema";

// 修改昵称接口：昵称留空表示清空
export async function PUT(request: NextRequest): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const parsed = updateProfileSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const { adminAccountService } = createSiteServices();
  try {
    await adminAccountService.updateProfile(Number(session.user.id), {
      nickname: parsed.data.nickname || null,
    });
    return okResponse({ updated: true });
  } catch (error) {
    return handleApiError(error);
  }
}
