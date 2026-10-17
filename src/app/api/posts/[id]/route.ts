import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { parseOptionalDate } from "@/lib/parse-date";
import { handleApiError } from "@/server/api/handle-api-error";
import { readJson } from "@/server/api/read-json";
import { readRouteId } from "@/server/api/read-route-id";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { createSiteServices } from "@/server/services/service-container";
import type { PostUpsertInput } from "@/types/post-upsert-input";
import { postUpsertSchema } from "@/server/validators/post.schema";

// 单篇文章接口：GET 详情 / PUT 更新 / DELETE 删除
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const { id } = await context.params;
  const postId = readRouteId(id);
  if (!postId) {
    return errorResponse("invalid_params", "文章 id 不正确", 400);
  }
  const { adminPostService } = createSiteServices();
  const detail = await adminPostService.getById(postId);
  if (!detail) {
    return errorResponse("post_not_found", "文章不存在或已被删除", 404);
  }
  return okResponse(detail);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const { id } = await context.params;
  const postId = readRouteId(id);
  if (!postId) {
    return errorResponse("invalid_params", "文章 id 不正确", 400);
  }
  const parsed = postUpsertSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const input: PostUpsertInput = {
    ...parsed.data,
    publishedAt: parseOptionalDate(parsed.data.publishedAt),
    scheduledAt: parseOptionalDate(parsed.data.scheduledAt),
  };
  const { adminPostService } = createSiteServices();
  try {
    await adminPostService.update(postId, input);
    return okResponse({ id: postId });
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
  const postId = readRouteId(id);
  if (!postId) {
    return errorResponse("invalid_params", "文章 id 不正确", 400);
  }
  const { adminPostService } = createSiteServices();
  try {
    const removed = await adminPostService.removeMany([postId]);
    return okResponse({ removed });
  } catch (error) {
    return handleApiError(error);
  }
}
