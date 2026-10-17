import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { handleApiError } from "@/server/api/handle-api-error";
import { readJson } from "@/server/api/read-json";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { createSiteServices } from "@/server/services/service-container";
import { galleryAlbumUpsertSchema } from "@/server/validators/gallery.schema";

// 相册接口：POST 新建相册（需登录）
export async function POST(request: NextRequest): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const parsed = galleryAlbumUpsertSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const { adminGalleryService } = createSiteServices();
  try {
    return okResponse(await adminGalleryService.create(parsed.data));
  } catch (error) {
    return handleApiError(error);
  }
}
