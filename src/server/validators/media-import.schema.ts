import { z } from "zod";

// 远程文件转存参数校验
export const mediaImportSchema = z.object({
  url: z.url("请输入合法的文件地址").max(2000),
});