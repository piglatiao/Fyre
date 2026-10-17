const REQUEST_TIMEOUT_MS = 15_000;
const RETRY_DELAY_MS = 350;

// 等待指定毫秒，供外部接口失败重试使用
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 规范化 API 根地址：允许后台留空并统一移除末尾斜杠
export function normalizeApiBase(value: string, fallback: string): string {
  const trimmed = value.trim();
  return (trimmed || fallback).replace(/\/+$/, "");
}

// 请求 JSON 接口：带超时、错误信息与一次安全重试
export async function requestJson<T>(
  url: string,
  init: RequestInit,
  label: string,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let status = 0;
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      status = response.status;
      if (!response.ok) {
        throw new Error(`${label}接口返回 HTTP ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      const retryable = status === 0 || status === 429 || status >= 500;
      if (attempt === 0 && retryable) {
        await wait(RETRY_DELAY_MS);
        continue;
      }
      throw error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`${label}接口请求失败`);
}
