import { z } from "zod";

// 页面新增/编辑入参校验
export const pageUpsertSchema = z.object({
  title: z.string().trim().min(1, "请填写页面标题").max(200, "标题不能超过 200 字"),
  slug: z.string().trim().max(200, "slug 不能超过 200 字符").default(""),
  content: z.string().min(1, "请填写页面内容"),
  published: z.boolean().default(true),
});
