import type { NextResponse } from "next/server";
import { errorResponse, okResponse } from "@/lib/api-response";
import { resolveDevVersionStamp } from "@/lib/dev-version";

// 开发期强制动态渲染，保证版本戳每次实时计算
export const dynamic = "force-dynamic";

// 开发期版本接口：返回当前源码版本戳，供过期页面自检刷新（生产环境不存在）
export async function GET(): Promise<NextResponse> {
  if (process.env.NODE_ENV === "production") {
    return errorResponse("not_found", "接口不存在", 404);
  }
  const stamp = await resolveDevVersionStamp();
  return okResponse({ stamp });
}