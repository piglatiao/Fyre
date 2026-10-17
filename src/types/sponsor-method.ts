// 前台打赏方式
export interface SponsorMethod {
  id: number;
  name: string;
  icon: string;
  qrCodeUrl: string;
  linkUrl: string;
  description: string;
  sortOrder: number;
}
