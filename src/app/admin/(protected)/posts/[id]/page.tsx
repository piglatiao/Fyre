import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PostEditor from "@/components/admin/post-editor";

export const metadata: Metadata = {
  title: "编辑文章",
};

// 编辑文章：id 非法时交由 404 处理
export default async function AdminPostEditPage({ params }: PageProps<"/admin/posts/[id]">) {
  const { id } = await params;
  const postId = Number.parseInt(id, 10);
  if (!Number.isInteger(postId) || postId <= 0) {
    notFound();
  }
  return <PostEditor postId={postId} />;
}
