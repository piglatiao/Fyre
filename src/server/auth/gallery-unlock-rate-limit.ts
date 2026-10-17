// 相册解锁失败限流：独立内存表，避免与文章编号冲突；服务重启后计数清零
const MAX_FAILURES = 5;
const LOCK_DURATION_MS = 10 * 60 * 1000;
const ENTRY_TTL_MS = LOCK_DURATION_MS;

interface GalleryAttemptRecord {
  failures: number;
  lockedUntil: number | null;
  updatedAt: number;
}

const attempts = new Map<number, GalleryAttemptRecord>();

// 清理超过有效期的限流记录
function pruneExpired(now: number): void {
  for (const [key, record] of attempts) {
    if (now - record.updatedAt > ENTRY_TTL_MS) {
      attempts.delete(key);
    }
  }
}

// 查询相册是否处于密码错误锁定期
export function checkGalleryUnlockLock(albumId: number): { locked: boolean } {
  const now = Date.now();
  pruneExpired(now);
  const record = attempts.get(albumId);
  if (!record?.lockedUntil) {
    return { locked: false };
  }
  if (record.lockedUntil <= now) {
    attempts.delete(albumId);
    return { locked: false };
  }
  return { locked: true };
}

// 记录一次密码错误；达到阈值后锁定十分钟
export function recordGalleryUnlockFailure(albumId: number): void {
  const now = Date.now();
  const record = attempts.get(albumId) ?? { failures: 0, lockedUntil: null, updatedAt: now };
  record.failures += 1;
  record.updatedAt = now;
  if (record.failures >= MAX_FAILURES) {
    record.lockedUntil = now + LOCK_DURATION_MS;
    record.failures = 0;
  }
  attempts.set(albumId, record);
}

// 解锁成功后清除失败记录
export function clearGalleryUnlockFailures(albumId: number): void {
  attempts.delete(albumId);
}
