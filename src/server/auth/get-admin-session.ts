import { prisma } from "@/lib/prisma";
import { auth } from "./auth";
import { createSessionFingerprint } from "./session-fingerprint";

// 后台鉴权入口：校验登录状态；若密码已变更导致指纹不匹配，则判定旧会话失效
// 昵称等可变资料从数据库读取，保证修改昵称后无需重新登录即可生效
export async function getAdminSession() {
  const session = await auth();
  const user = session?.user;
  const userId = Number(user?.id);
  if (!user || !Number.isInteger(userId) || userId <= 0) {
    return null;
  }
  const record = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, nickname: true },
  });
  if (!record) {
    return null;
  }
  if (!user.sessionFingerprint || user.sessionFingerprint !== createSessionFingerprint(record.passwordHash)) {
    return null;
  }
  return {
    ...session,
    user: { ...session.user, nickname: record.nickname ?? undefined },
  };
}
