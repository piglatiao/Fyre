import type { ApiResult } from "@/types/api-result";

// 后台接口调用封装：统一解析 { ok, data } / { ok, error } 响应结构
export async function requestJson<T>(input: string, init?: RequestInit): Promise<ApiResult<T>> {
  let payload: unknown;
  try {
    const response = await fetch(input, init);
    payload = await response.json();
  } catch {
    return { ok: false, error: { code: "network_error", message: "网络请求失败，请稍后重试" } };
  }
  if (typeof payload !== "object" || payload === null || !("ok" in payload)) {
    return { ok: false, error: { code: "invalid_response", message: "服务器返回内容无法解析" } };
  }
  return payload as ApiResult<T>;
}

// JSON 请求快捷方法：自动附带 Content-Type 并序列化请求体
export function requestJsonBody<T>(
  input: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<ApiResult<T>> {
  return requestJson<T>(input, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
