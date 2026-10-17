import { z } from "zod";
import { nullableText } from "@/lib/zod-fields";

// 分类新增/编辑入参校验
export const categoryUpsertSchema = z.object({
  name: z.string().trim().min(1, "请填写分类名称").max(50, "分类名称不能超过 50 字"),
  slug: z.string().trim().max(100, "slug 不能超过 100 字符").default(""),
  description: nullableText(300, "描述不能超过 300 字"),
  sort: z.number().int().min(0, "排序不能为负数").max(9999, "排序过大").default(0),
});
