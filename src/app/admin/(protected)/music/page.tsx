import type { Metadata } from "next";
import AdminPageHeader from "@/components/admin/admin-page-header";
import MusicManager from "@/components/admin/music-manager";
import { createSiteServices } from "@/server/services/service-container";

export const metadata: Metadata = {
  title: "音乐管理",
};

// 音乐管理：维护前台播放器的本地曲库（服务端取列表，客户端负责增删改）
export default async function AdminMusicPage() {
  const { musicService } = createSiteServices();
  const items = await musicService.listForAdmin();

  return (
    <section className="space-y-6">
      <AdminPageHeader
        title="音乐管理"
        description="维护博客播放器的本地曲库：曲目、歌手、音频与封面；保存后前台导航栏与左侧栏「音乐」卡片即时生效。"
      />
      <MusicManager items={items} />
    </section>
  );
}
