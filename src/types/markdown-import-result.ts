// Markdown 导入结果：成功创建的文章摘要与失败明细
export interface MarkdownImportCreated {
  id: number;
  title: string;
  slug: string;
}

export interface MarkdownImportFailure {
  fileName: string;
  reason: string;
}

export interface MarkdownImportResult {
  created: MarkdownImportCreated[];
  failed: MarkdownImportFailure[];
}
