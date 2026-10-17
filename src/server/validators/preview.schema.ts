import { z } from "zod";

// 编辑器预览入参校验：正文允许较长，但仍需限制上限防止滥用
export const previewSchema = z.object({
  content: z.string().max(200000, "正文过长，无法预览"),
});
