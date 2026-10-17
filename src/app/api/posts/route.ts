import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { parseOptionalDate } from "@/lib/parse-date";
import { handleApiError } from "@/server/api/handle-api-error";
import { readJson } from "@/server/api/read-json";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { createSiteServices } from "@/server/services/service-container";
import type { PostUpsertInput } from "@/types/post-upsert-input";
import { postBulkDeleteSchema, postListQuerySchema, postUpsertSchema } from "@/server/validators/post.schema";

// 后台文章接口：GET 列表 / POST 新建 / DELETE 批量删除
export async function GET(request: NextRequest): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const parsed = postListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const { adminPostService } = createSiteServices();
  const result = await adminPostService.list(parsed.data);
  return okResponse(result);
}

export async function POST(request: NextRequest): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
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
    return okResponse(await adminPostService.create(input));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const parsed = postBulkDeleteSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const { adminPostService } = createSiteServices();
  try {
    const removed = await adminPostService.removeMany(parsed.data.ids);
    return okResponse({ removed });
  } catch (error) {
    return handleApiError(error);
  }
}
