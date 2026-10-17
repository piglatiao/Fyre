// Markdown 导入：单个待导入文件（文件名用于标题兜底与错误提示）
export interface MarkdownImportFile {
  fileName: string;
  content: string;
}
