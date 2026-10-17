import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { readJson } from "@/server/api/read-json";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { createSiteServices } from "@/server/services/service-container";
import { settingSchema } from "@/server/validators/setting.schema";

// 站点设置接口：GET 读取 / PUT 全量更新
export async function GET(): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const { adminSettingService } = createSiteServices();
  return okResponse(await adminSettingService.getSettings());
}

export async function PUT(request: NextRequest): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const parsed = settingSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const { adminSettingService } = createSiteServices();
  await adminSettingService.updateSettings(parsed.data);
  return okResponse({ updated: true });
}
