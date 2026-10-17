import { z } from "zod";

// 登录入参校验：用户名与密码均必填
export const loginSchema = z.object({
  username: z.string().trim().min(1, "请输入用户名").max(50, "用户名过长"),
  password: z.string().min(1, "请输入密码").max(200, "密码过长"),
});
