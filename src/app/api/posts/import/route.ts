import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { handleApiError } from "@/server/api/handle-api-error";
import { readJson } from "@/server/api/read-json";
import { getAdminSession } from "@/server/auth/get-admin-session";
import { createSiteServices } from "@/server/services/service-container";
import { markdownImportSchema } from "@/server/validators/markdown-import.schema";

// 文章批量导入：POST /api/posts/import
// 前端读取本地 .md 文件文本后统一以 JSON 提交（避免额外引入 multipart 解析）
export async function POST(request: NextRequest): Promise<Response> {
  const session = await getAdminSession();
  if (!session) {
    return errorResponse("unauthorized", "请先登录", 401);
  }
  const parsed = markdownImportSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return errorResponse("invalid_params", parsed.error.issues[0]?.message ?? "参数不合法", 400);
  }
  const { markdownImportService } = createSiteServices();
  try {
    return okResponse(await markdownImportService.importDocuments(parsed.data.files, parsed.data.status));
  } catch (error) {
    return handleApiError(error);
  }
}
