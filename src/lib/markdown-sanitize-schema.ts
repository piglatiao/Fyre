import { defaultSchema } from "rehype-sanitize";
import type { Options } from "rehype-sanitize";

// 保留 remark-math 生成的公式节点类名，KaTeX 需要靠它们识别行内与块级公式
const mathClassAttribute: [string, RegExp] = ["className", /^math(?:-inline|-display)?$/];

// Markdown 白名单：沿用 GitHub 风格默认规则，仅补充公式容器类名
export const markdownSanitizeSchema: Options = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    div: [...(defaultSchema.attributes?.div ?? []), mathClassAttribute],
    span: [...(defaultSchema.attributes?.span ?? []), mathClassAttribute],
  },
};
