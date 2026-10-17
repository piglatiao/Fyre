import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { handleApiError } from "@/server/api/handle-api-error";
import { readJson } from "@/server/api/read-json";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { createSiteServices } from "@/server/services/service-container";
import { musicTrackUpsertSchema } from "@/server/validators/music-track.schema";

// 音乐接口：GET 公开播放列表（前台使用）/ POST 新建曲目（需登录）
export async function GET(): Promise<Response> {
  const { musicService } = createSiteServices();
  return okResponse(await musicService.listPublic());
}

export async function POST(request: NextRequest): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const parsed = musicTrackUpsertSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const { musicService } = createSiteServices();
  try {
    return okResponse(await musicService.create(parsed.data));
  } catch (error) {
    return handleApiError(error);
  }
}
