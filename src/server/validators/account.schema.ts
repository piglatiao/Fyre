import { z } from "zod";

// 修改密码入参校验
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "请输入当前密码").max(200, "密码过长"),
  newPassword: z.string().min(6, "新密码至少 6 位").max(200, "密码过长"),
});

// 修改昵称入参校验
export const updateProfileSchema = z.object({
  nickname: z.string().trim().max(50, "昵称不能超过 50 字").default(""),
});
