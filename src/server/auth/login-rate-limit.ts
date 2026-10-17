// 登录失败限流：内存实现，适用于单实例部署；服务重启后计数清零
const MAX_FAILURES = 5;
const LOCK_DURATION_MS = 10 * 60 * 1000;
const ENTRY_TTL_MS = LOCK_DURATION_MS;

interface AttemptRecord {
  failures: number;
  lockedUntil: number | null;
  updatedAt: number;
}

const attempts = new Map<string, AttemptRecord>();

function normalize(username: string): string {
  return username.trim().toLowerCase();
}

function pruneExpired(now: number): void {
  for (const [key, record] of attempts) {
    if (now - record.updatedAt > ENTRY_TTL_MS) {
      attempts.delete(key);
    }
  }
}

// 查询账号是否处于锁定期，并返回剩余锁定秒数
export function checkLoginLock(username: string): { locked: boolean; remainSeconds: number } {
  const now = Date.now();
  pruneExpired(now);
  const key = normalize(username);
  const record = attempts.get(key);
  if (!record?.lockedUntil) {
    return { locked: false, remainSeconds: 0 };
  }
  if (record.lockedUntil <= now) {
    attempts.delete(key);
    return { locked: false, remainSeconds: 0 };
  }
  return { locked: true, remainSeconds: Math.ceil((record.lockedUntil - now) / 1000) };
}

// 记录一次登录失败；达到阈值后锁定账号
export function recordLoginFailure(username: string): void {
  const now = Date.now();
  const key = normalize(username);
  const record = attempts.get(key) ?? { failures: 0, lockedUntil: null, updatedAt: now };
  record.failures += 1;
  record.updatedAt = now;
  if (record.failures >= MAX_FAILURES) {
    record.lockedUntil = now + LOCK_DURATION_MS;
    record.failures = 0;
  }
  attempts.set(key, record);
}

// 登录成功后清除失败记录
export function clearLoginFailures(username: string): void {
  attempts.delete(normalize(username));
}
