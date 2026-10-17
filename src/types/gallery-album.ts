// 前台相册卡片：不包含密码哈希等敏感字段
export interface GalleryAlbum {
  id: number;
  title: string;
  slug: string;
  description: string;
  coverUrl: string;
  eventDate: Date | null;
  location: string;
  tags: string[];
  encrypted: boolean;
  photoCount: number;
}
