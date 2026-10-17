"use server";

import { signOut } from "@/server/auth/auth";

// 退出登录：清除会话并返回登录页
export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/admin/login" });
}
