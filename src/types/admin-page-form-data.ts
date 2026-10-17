// 后台页面表单数据（客户端视角：时间字段为 ISO 字符串）
export interface AdminPageFormData {
  id: number;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  updatedAt: string;
}
