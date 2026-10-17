import type { GalleryPhotoInput } from "./gallery-photo-input";

// 相册新增/编辑入参：密码为空时新建为公开、编辑时保留原密码
export interface GalleryAlbumInput {
  title: string;
  slug: string;
  description: string;
  coverUrl: string;
  eventDate: string;
  location: string;
  tags: string[];
  password: string;
  passwordHint: string;
  clearPassword: boolean;
  sortOrder: number;
  enabled: boolean;
  photos: GalleryPhotoInput[];
}
