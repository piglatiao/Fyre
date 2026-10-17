import type { Metadata } from "next";
import PostEditor from "@/components/admin/post-editor";

export const metadata: Metadata = {
  title: "新建文章",
};

// 新建文章：复用文章编辑器
export default function AdminPostNewPage() {
  return <PostEditor />;
}
