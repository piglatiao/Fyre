// 相册照片：前台瀑布流与后台编辑共用
export interface GalleryPhoto {
  id: number;
  imageUrl: string;
  caption: string;
  sortOrder: number;
}
