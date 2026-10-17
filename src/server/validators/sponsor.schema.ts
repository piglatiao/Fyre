import { z } from "zod";

// 可选资源地址：空串、站内相对地址或合法外部 URL 均允许
function optionalResourceUrl(message: string) {
  return z
    .string()
    .trim()
    .max(500, "地址过长")
    .refine(
      (value) => value.length === 0 || (value.startsWith("/") && !value.startsWith("//")) || z.url().safeParse(value).success,
      message,
    );
}

// 打赏方式新增/编辑校验：二维码与跳转链接至少填一个
export const sponsorMethodUpsertSchema = z
  .object({
    name: z.string().trim().min(1, "请填写打赏方式名称").max(100, "名称不能超过 100 字"),
    icon: z.string().trim().max(500, "图标地址过长").default(""),
    qrCodeUrl: optionalResourceUrl("收款码地址格式不正确").default(""),
    linkUrl: optionalResourceUrl("打赏链接格式不正确").default(""),
    description: z.string().trim().max(300, "描述不能超过 300 字").default(""),
    sortOrder: z.coerce.number().int().min(-9999).max(9999).default(0),
    enabled: z.coerce.boolean().default(true),
  })
  .superRefine((value, context) => {
    if (!value.qrCodeUrl && !value.linkUrl) {
      context.addIssue({ code: "custom", message: "收款码或打赏链接至少填写一项", path: ["qrCodeUrl"] });
    }
  });

// 打赏记录新增/编辑校验
export const sponsorRecordUpsertSchema = z.object({
  name: z.string().trim().min(1, "请填写打赏者名称").max(100, "名称不能超过 100 字"),
  avatarUrl: z.string().trim().max(500, "头像地址过长").default(""),
  amount: z.string().trim().max(50, "金额文本过长").default(""),
  message: z.string().trim().max(300, "留言不能超过 300 字").default(""),
  sponsoredAt: z
    .string()
    .trim()
    .max(10)
    .refine((value) => value.length === 0 || /^\d{4}-\d{2}-\d{2}$/.test(value), "日期格式应为 YYYY-MM-DD"),
  sortOrder: z.coerce.number().int().min(-9999).max(9999).default(0),
  enabled: z.coerce.boolean().default(true),
});
