import type { NextRequest } from "next/server";

// 读取并解析 JSON 请求体：格式非法时返回 null，由调用方转换为统一错误响应
export async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
