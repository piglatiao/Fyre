// 评论提交限流：同一访客在十分钟内最多提交五次，计数仅保存在进程内
const WINDOW_MS = 10 * 60 * 1000;
const MAX_SUBMISSIONS = 5;

const submissions = new Map<string, number[]>();

// 清理窗口外的旧记录，避免内存长期增长
function pruneExpired(now: number): void {
  for (const [key, timestamps] of submissions) {
    const active = timestamps.filter((timestamp) => now - timestamp < WINDOW_MS);
    if (active.length === 0) {
      submissions.delete(key);
    } else {
      submissions.set(key, active);
    }
  }
}

// 查询当前访客是否仍在限流窗口内
export function checkCommentRateLimit(key: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  pruneExpired(now);
  const timestamps = submissions.get(key) ?? [];
  if (timestamps.length < MAX_SUBMISSIONS) {
    return { allowed: true, retryAfterSeconds: 0 };
  }
  const oldest = timestamps[0] ?? now;
  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000)),
  };
}

// 记录一次成功提交，用于计算后续限流窗口
export function recordCommentSubmission(key: string): void {
  const now = Date.now();
  const timestamps = (submissions.get(key) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);
  timestamps.push(now);
  submissions.set(key, timestamps);
}
