import { notFound } from "next/navigation";

// 兜底未匹配的站内路径，让 404 页面保留前台布局、横幅与侧栏
export default function NotFoundFallback() {
  notFound();
}
