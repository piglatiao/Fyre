// 分类新增/编辑入参
export interface CategoryUpsertInput {
  name: string;
  slug: string;
  description: string | null;
  sort: number;
}
