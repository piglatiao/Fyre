// 非首页的横幅页面标题浮层：与官网一致，仅在 lg 以上把页面标题居中显示在横幅上层
export default function PageBannerOverlay({ title }: { title: string }) {
  return (
    <div className="banner-page-title-overlay pointer-events-none absolute inset-0 z-20 hidden items-center justify-center lg:flex">
      <div className="mb-0 w-4/5 text-center lg:w-3/4">
        <div className="banner-page-title inline-flex items-center justify-center gap-3 font-bold text-white">
          <span className="banner-page-title-text">{title}</span>
        </div>
      </div>
    </div>
  );
}