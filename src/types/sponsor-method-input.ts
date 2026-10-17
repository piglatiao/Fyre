// 打赏方式新增/编辑入参
export interface SponsorMethodInput {
  name: string;
  icon: string;
  qrCodeUrl: string;
  linkUrl: string;
  description: string;
  sortOrder: number;
  enabled: boolean;
}
