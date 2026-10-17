// 相册解锁状态：仅服务端内部使用，passwordHash 不进入页面 props
export interface GalleryAlbumAccess {
  id: number;
  encrypted: boolean;
  passwordHash: string | null;
}
