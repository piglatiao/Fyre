// 后台打赏方式：补充启停状态与时间
export interface AdminSponsorMethod {
  id: number;
  name: string;
  icon: string;
  qrCodeUrl: string;
  linkUrl: string;
  description: string;
  sortOrder: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
