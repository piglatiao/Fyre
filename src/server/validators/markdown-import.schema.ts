import { z } from "zod";

// Markdown 导入入参校验：单次最多 50 个文件，单文件文本上限约 2MB
export const markdownImportSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  files: z
    .array(
      z.object({
        fileName: z.string().trim().min(1, "文件名不能为空").max(200, "文件名过长"),
        content: z.string().min(1, "文件内容不能为空").max(2_000_000, "单个文件内容过大"),
      }),
    )
    .min(1, "请选择要导入的 Markdown 文件")
    .max(50, "单次最多导入 50 个文件"),
});
