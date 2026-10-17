// 后台页面列表行（客户端视角：时间字段为 ISO 字符串）
export interface AdminPageRow {
  id: number;
  title: string;
  slug: string;
  published: boolean;
  updatedAt: string;
}
