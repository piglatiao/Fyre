import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { createSiteServices } from "@/server/services/service-container";

// 校验定时任务密钥：支持 x-cron-secret 头或 Bearer Token
function readCronSecret(request: NextRequest): string | null {
  const header = request.headers.get("x-cron-secret");
  if (header) {
    return header;
  }
  const authorization = request.headers.get("authorization");
  return authorization?.replace(/^Bearer\s+/i, "") ?? null;
}

// 定时发布兜底：把到期的定时文章转为已发布，供系统计划任务调用
async function runPublishDue(request: NextRequest): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return errorResponse("cron_disabled", "未配置 CRON_SECRET，定时发布接口已禁用", 503);
  }
  if (readCronSecret(request) !== secret) {
    return errorResponse("unauthorized", "定时任务密钥不正确", 401);
  }
  const { postService } = createSiteServices();
  const published = await postService.publishDuePosts();
  return okResponse({ published });
}

export async function GET(request: NextRequest): Promise<Response> {
  return runPublishDue(request);
}

export async function POST(request: NextRequest): Promise<Response> {
  return runPublishDue(request);
}
