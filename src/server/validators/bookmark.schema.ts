import { z } from "zod";

// 书签分组新增/编辑校验：slug 用作前台锚点，只允许小写字母、数字与连字符
export const bookmarkGroupUpsertSchema = z.object({
  name: z.string().trim().min(1, "请填写分组名称").max(100, "分组名称不能超过 100 字"),
  slug: z
    .string()
    .trim()
    .min(1, "请填写分组标识")
    .max(100, "分组标识不能超过 100 字")
    .regex(/^[a-z0-9][a-z0-9-]*$/, "分组标识只能使用小写字母、数字和连字符"),
  icon: z.string().trim().max(500, "分组图标地址过长").default(""),
  description: z.string().trim().max(300, "分组描述不能超过 300 字").default(""),
  weight: z.coerce.number().int().min(-9999).max(9999).default(0),
  enabled: z.coerce.boolean().default(true),
});

// 书签条目新增/编辑校验
export const bookmarkItemUpsertSchema = z.object({
  groupId: z.coerce.number().int().positive("请选择书签分组"),
  title: z.string().trim().min(1, "请填写书签名称").max(100, "书签名称不能超过 100 字"),
  url: z.url("书签地址格式不正确").max(500, "书签地址过长"),
  description: z.string().trim().max(300, "描述不能超过 300 字").default(""),
  icon: z.string().trim().max(500, "图标地址过长").default(""),
  weight: z.coerce.number().int().min(-9999).max(9999).default(0),
  enabled: z.coerce.boolean().default(true),
});
