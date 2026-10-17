import { z } from "zod";

// 标签新增/编辑入参校验
export const tagUpsertSchema = z.object({
  name: z.string().trim().min(1, "请填写标签名称").max(50, "标签名称不能超过 50 字"),
  slug: z.string().trim().max(100, "slug 不能超过 100 字符").default(""),
});

// 标签合并入参校验
export const tagMergeSchema = z.object({
  sourceId: z.number().int().positive("请选择待合并标签"),
  targetId: z.number().int().positive("请选择目标标签"),
});
