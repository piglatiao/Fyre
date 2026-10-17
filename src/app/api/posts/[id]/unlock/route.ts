import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { readJson } from "@/server/api/read-json";
import { createUnlockToken, unlockCookieName } from "@/server/auth/post-unlock";
import { checkUnlockLock, clearUnlockFailures, recordUnlockFailure } from "@/server/auth/post-unlock-rate-limit";
import { createSiteServices } from "@/server/services/service-container";

// 解锁 Cookie 有效期：1 天
const UNLOCK_MAX_AGE_SECONDS = 24 * 60 * 60;

// 文章解锁：校验访问密码，成功后在响应中写入解锁 Cookie
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const postId = Number.parseInt(id, 10);
  if (!Number.isInteger(postId) || postId <= 0) {
    return errorResponse("invalid_params", "文章编号不正确", 400);
  }
  const body = await readJson(request);
  const password = typeof body === "object" && body !== null && typeof (body as Record<string, unknown>).password === "string"
    ? ((body as Record<string, unknown>).password as string)
    : "";
  if (!password) {
    return errorResponse("invalid_params", "请输入访问密码", 400);
  }
  if (checkUnlockLock(postId).locked) {
    return errorResponse("unlock_locked", "密码错误次数过多，请稍后再试", 429);
  }

  const { postService } = createSiteServices();
  const result = await postService.verifyPostPassword(postId, password);
  if (!result || !result.passwordHash) {
    recordUnlockFailure(postId);
    return errorResponse("wrong_password", "密码不正确", 400);
  }
  clearUnlockFailures(postId);

  const response = okResponse({ unlocked: true, slug: result.slug });
  response.cookies.set(unlockCookieName(postId), createUnlockToken(postId, result.passwordHash), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: UNLOCK_MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}