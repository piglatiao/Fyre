import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/server/validators/auth.schema";
import { checkLoginLock, clearLoginFailures, recordLoginFailure } from "./login-rate-limit";
import { createSessionFingerprint } from "./session-fingerprint";

// Auth.js v5 主配置：Credentials 登录 + JWT 会话，供 proxy 与后台布局共用
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" },
      },
      // 校验账号密码：包含失败限流与账号锁定
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }
        const { username, password } = parsed.data;
        if (checkLoginLock(username).locked) {
          return null;
        }
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
          recordLoginFailure(username);
          return null;
        }
        const matched = await compare(password, user.passwordHash);
        if (!matched) {
          recordLoginFailure(username);
          return null;
        }
        clearLoginFailures(username);
        return {
          id: String(user.id),
          name: user.username,
          nickname: user.nickname ?? undefined,
          role: user.role,
          sessionFingerprint: createSessionFingerprint(user.passwordHash),
        };
      },
    }),
  ],
  callbacks: {
    // 第一道拦截：未登录访问 /admin/* 时由 Auth.js 重定向到登录页
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname === "/admin/login") {
        return true;
      }
      return Boolean(auth?.user);
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.nickname = user.nickname;
        token.sessionFingerprint = user.sessionFingerprint;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        // JWT 载荷由本项目写入，此处按类型收窄后再交给会话，避免把非字符串值透传到前端
        session.user.id = typeof token.id === "string" ? token.id : "";
        session.user.role = typeof token.role === "string" ? token.role : "admin";
        session.user.nickname = typeof token.nickname === "string" ? token.nickname : undefined;
        session.user.sessionFingerprint =
          typeof token.sessionFingerprint === "string" ? token.sessionFingerprint : undefined;
      }
      return session;
    },
  },
});
