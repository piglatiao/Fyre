import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { readClientIp } from "@/server/api/read-client-ip";
import { handleApiError } from "@/server/api/handle-api-error";
import { readJson } from "@/server/api/read-json";
import { checkCommentRateLimit, recordCommentSubmission } from "@/server/comments/comment-rate-limit";
import { createSiteServices } from "@/server/services/service-container";
import { commentListQuerySchema, commentSubmissionSchema } from "@/server/validators/comment.schema";

// 公开评论接口：GET 分页读取已通过评论，POST 提交新评论
export async function GET(request: NextRequest): Promise<Response> {
  const parsed = commentListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const { commentService } = createSiteServices();
  try {
    const result = await commentService.listApproved(
      parsed.data.targetType,
      parsed.data.targetId,
      parsed.data.page,
      parsed.data.pageSize,
    );
    const response = okResponse(result);
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

// 访客提交评论：校验目标、内容与频率后写入本站数据库
export async function POST(request: NextRequest): Promise<Response> {
  const parsed = commentSubmissionSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const rateKey = `${readClientIp(request)}:${parsed.data.targetType}:${parsed.data.targetId ?? "page"}`;
  const rate = checkCommentRateLimit(rateKey);
  if (!rate.allowed) {
    const response = errorResponse("too_many_requests", "提交过于频繁，请稍后再试", 429);
    response.headers.set("Retry-After", String(rate.retryAfterSeconds));
    return response;
  }
  const { commentService } = createSiteServices();
  try {
    const result = await commentService.create(parsed.data);
    recordCommentSubmission(rateKey);
    return okResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
