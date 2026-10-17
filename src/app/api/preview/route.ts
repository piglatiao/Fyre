import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { renderMarkdown } from "@/lib/markdown";
import { readJson } from "@/server/api/read-json";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { previewSchema } from "@/server/validators/preview.schema";

// 编辑器预览接口：用与前台一致的渲染链返回 HTML 与目录
export async function POST(request: NextRequest): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const parsed = previewSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const rendered = await renderMarkdown(parsed.data.content);
  return okResponse(rendered);
}
