import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { handleApiError } from "@/server/api/handle-api-error";
import { readJson } from "@/server/api/read-json";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { createSiteServices } from "@/server/services/service-container";
import { changePasswordSchema } from "@/server/validators/account.schema";

// 修改密码接口：校验当前密码后更新，旧会话随指纹变化失效
export async function PUT(request: NextRequest): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const parsed = changePasswordSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const { adminAccountService } = createSiteServices();
  try {
    await adminAccountService.changePassword(Number(session.user.id), parsed.data);
    return okResponse({ updated: true });
  } catch (error) {
    return handleApiError(error);
  }
}
