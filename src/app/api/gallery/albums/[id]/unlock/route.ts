import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { isSecureRequest } from "@/server/api/is-secure-request";
import { readJson } from "@/server/api/read-json";
import {
  checkGalleryUnlockLock,
  clearGalleryUnlockFailures,
  recordGalleryUnlockFailure,
} from "@/server/auth/gallery-unlock-rate-limit";
import { createGalleryUnlockToken, galleryUnlockCookieName } from "@/server/auth/gallery-unlock";
import { createSiteServices } from "@/server/services/service-container";

// 相册解锁 Cookie 有效期：1 天
const UNLOCK_MAX_AGE_SECONDS = 24 * 60 * 60;

// 相册解锁：校验访问密码，成功后在响应中写入独立解锁 Cookie
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const albumId = Number.parseInt(id, 10);
  if (!Number.isInteger(albumId) || albumId <= 0) {
    return errorResponse("invalid_params", "相册编号不正确", 400);
  }
  const body = await readJson(request);
  const password =
    typeof body === "object" && body !== null && typeof (body as Record<string, unknown>).password === "string"
      ? ((body as Record<string, unknown>).password as string)
      : "";
  if (!password) {
    return errorResponse("invalid_params", "请输入访问密码", 400);
  }
  if (checkGalleryUnlockLock(albumId).locked) {
    return errorResponse("unlock_locked", "密码错误次数过多，请稍后再试", 429);
  }

  const { galleryService } = createSiteServices();
  const result = await galleryService.verifyAlbumPassword(albumId, password);
  if (!result) {
    recordGalleryUnlockFailure(albumId);
    return errorResponse("wrong_password", "密码不正确", 400);
  }
  clearGalleryUnlockFailures(albumId);

  const response = okResponse({ unlocked: true, slug: result.slug });
  response.cookies.set(galleryUnlockCookieName(albumId), createGalleryUnlockToken(albumId, result.passwordHash), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: UNLOCK_MAX_AGE_SECONDS,
    secure: isSecureRequest(request),
  });
  return response;
}
