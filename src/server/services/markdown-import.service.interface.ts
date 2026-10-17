import type { PostStatus } from "@/generated/prisma/client";
import type { MarkdownImportFile } from "@/types/markdown-import-file";
import type { MarkdownImportResult } from "@/types/markdown-import-result";

// Markdown 导入服务接口：把 .md 文本批量转换为文章，复用文章/标签/分类服务的既有规则
export interface MarkdownImportService {
  // files：待导入文件；defaultStatus：头部未声明 status 时的落库状态
  importDocuments(files: MarkdownImportFile[], defaultStatus: PostStatus): Promise<MarkdownImportResult>;
}
