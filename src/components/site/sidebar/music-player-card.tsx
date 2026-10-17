import MusicPlayerPanel from "../music-player-panel";
import WidgetCard from "./widget-card";

// 音乐卡：左侧栏常驻播放器（与官网「公告 → 音乐 → 分类 → 标签」顺序一致）
export default function MusicPlayerCard({ delay = 100 }: { delay?: number }) {
  return (
    <WidgetCard title="音乐" delay={delay}>
      <MusicPlayerPanel />
    </WidgetCard>
  );
}
