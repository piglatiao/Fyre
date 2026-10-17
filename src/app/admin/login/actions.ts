"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/server/auth/auth";
import { checkLoginLock } from "@/server/auth/login-rate-limit";
import type { LoginState } from "@/types/login-state";

// 登录 Server Action：先检查锁定状态，再交由 Auth.js 校验密码
export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "请输入用户名和密码" };
  }

  const lock = checkLoginLock(username);
  if (lock.locked) {
    return { error: `失败次数过多，请 ${lock.remainSeconds} 秒后再试` };
  }

  try {
    await signIn("credentials", { username, password, redirectTo: "/admin" });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        const after = checkLoginLock(username);
        return after.locked
          ? { error: `失败次数过多，请 ${after.remainSeconds} 秒后再试` }
          : { error: "用户名或密码错误" };
      }
      return { error: "登录失败，请稍后重试" };
    }
    // 包含登录成功后的 NEXT_REDIRECT，必须原样抛出
    throw error;
  }
}
