import type { CustomPage } from "./custom-page";
import type { TocItem } from "./toc-item";

// 自定义页面视图：页面数据与渲染后的安全 HTML、目录
export interface CustomPageView {
  page: CustomPage;
  html: string;
  toc: TocItem[];
}
