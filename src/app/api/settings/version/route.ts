import type { NextResponse } from "next/server";
import { okResponse } from "@/lib/api-response";
import { createSiteServices } from "@/server/services/service-container";

// 站点设置版本接口：前台页面据此判断后台是否保存过新设置并自动刷新。
// 只返回设置表最近更新时间戳，不含敏感内容，故无需鉴权
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const { settingService } = createSiteServices();
  const response = okResponse({ version: await settingService.getSettingsVersion() });
  // 版本必须实时：禁止任何中间层缓存
  response.headers.set("Cache-Control", "no-store");
  return response;
}