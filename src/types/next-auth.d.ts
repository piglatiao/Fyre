import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      nickname?: string;
      sessionFingerprint?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    nickname?: string;
    sessionFingerprint?: string;
  }
}

// 说明：Auth.js v5 的 JWT 接口定义在 @auth/core/jwt，而该包在 pnpm 下未提升到项目根，
// 无法在此做模块增强；因此 token 字段统一在 session 回调中按 typeof 收窄后赋值。
