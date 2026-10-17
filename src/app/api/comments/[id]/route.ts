import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { handleApiError } from "@/server/api/handle-api-error";
import { readJson } from "@/server/api/read-json";
import { readRouteId } from "@/server/api/read-route-id";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { createSiteServices } from "@/server/services/service-container";
import { commentStatusUpdateSchema } from "@/server/validators/comment.schema";

// 后台评论接口：PATCH 修改审核状态，DELETE 删除评论
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const { id } = await context.params;
  const commentId = readRouteId(id);
  if (!commentId) {
    return errorResponse("invalid_params", "评论编号不正确", 400);
  }
  const parsed = commentStatusUpdateSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const { adminCommentService } = createSiteServices();
  try {
    await adminCommentService.updateStatus(commentId, parsed.data.status);
    return okResponse({ id: commentId });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const { id } = await context.params;
  const commentId = readRouteId(id);
  if (!commentId) {
    return errorResponse("invalid_params", "评论编号不正确", 400);
  }
  const { adminCommentService } = createSiteServices();
  try {
    await adminCommentService.remove(commentId);
    return okResponse({ id: commentId });
  } catch (error) {
    return handleApiError(error);
  }
}
