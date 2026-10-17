import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { handleApiError } from "@/server/api/handle-api-error";
import { readJson } from "@/server/api/read-json";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { createSiteServices } from "@/server/services/service-container";
import { musicTrackUpsertSchema } from "@/server/validators/music-track.schema";

// 解析路由参数中的曲目 id：非法值直接视为不存在
function readId(value: string): number {
  const id = Number.parseInt(value, 10);
  return Number.isFinite(id) && id > 0 ? id : 0;
}

// 单条曲目接口：PUT 更新 / DELETE 删除（均需登录）
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const { id: rawId } = await context.params;
  const id = readId(rawId);
  if (id === 0) {
    return errorResponse("invalid_params", "曲目不存在或已被删除", 400);
  }
  const parsed = musicTrackUpsertSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const { musicService } = createSiteServices();
  try {
    await musicService.update(id, parsed.data);
    return okResponse({ id });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const { id: rawId } = await context.params;
  const id = readId(rawId);
  if (id === 0) {
    return errorResponse("invalid_params", "曲目不存在或已被删除", 400);
  }
  const { musicService } = createSiteServices();
  try {
    await musicService.remove(id);
    return okResponse({ id });
  } catch (error) {
    return handleApiError(error);
  }
}
