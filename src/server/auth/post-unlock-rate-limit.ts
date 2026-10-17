// 文章解锁失败限流：内存实现，按文章计数；服务重启后计数清零
const MAX_FAILURES = 5;
const LOCK_DURATION_MS = 10 * 60 * 1000;
const ENTRY_TTL_MS = LOCK_DURATION_MS;

interface AttemptRecord {
  failures: number;
  lockedUntil: number | null;
  updatedAt: number;
}

const attempts = new Map<number, AttemptRecord>();

function pruneExpired(now: number): void {
  for (const [key, record] of attempts) {
    if (now - record.updatedAt > ENTRY_TTL_MS) {
      attempts.delete(key);
    }
  }
}

// 查询文章是否处于解锁锁定期
export function checkUnlockLock(postId: number): { locked: boolean } {
  const now = Date.now();
  pruneExpired(now);
  const record = attempts.get(postId);
  if (!record?.lockedUntil) {
    return { locked: false };
  }
  if (record.lockedUntil <= now) {
    attempts.delete(postId);
    return { locked: false };
  }
  return { locked: true };
}

// 记录一次解锁失败；达到阈值后锁定
export function recordUnlockFailure(postId: number): void {
  const now = Date.now();
  const record = attempts.get(postId) ?? { failures: 0, lockedUntil: null, updatedAt: now };
  record.failures += 1;
  record.updatedAt = now;
  if (record.failures >= MAX_FAILURES) {
    record.lockedUntil = now + LOCK_DURATION_MS;
    record.failures = 0;
  }
  attempts.set(postId, record);
}

// 解锁成功后清除失败记录
export function clearUnlockFailures(postId: number): void {
  attempts.delete(postId);
}