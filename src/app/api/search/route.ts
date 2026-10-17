import type { NextRequest } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { createSiteServices } from "@/server/services/service-container";
import { searchQuerySchema } from "@/server/validators/search.schema";

// 站内搜索接口：GET /api/search?q=关键词
export async function GET(request: NextRequest): Promise<Response> {
  const parsed = searchQuerySchema.safeParse({
    q: request.nextUrl.searchParams.get("q") ?? "",
  });
  if (!parsed.success) {
    return errorResponse("invalid_query", parsed.error.issues[0]?.message ?? "搜索参数不合法", 400);
  }

  const { postService } = createSiteServices();
  const hits = await postService.search(parsed.data.q);
  return okResponse(hits);
}
