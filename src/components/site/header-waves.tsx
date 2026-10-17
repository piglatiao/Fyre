// 横幅底部波浪：四层 SVG 叠加，填充页面背景色（与官网同一条路径）
export default function HeaderWaves() {
  return (
    <div
      className="absolute -bottom-px left-0 h-[10vh] max-h-37.5 min-h-12.5 w-full md:h-[15vh]"
      aria-hidden
    >
      <svg
        className="waves-svg"
        viewBox="0 24 150 28"
        preserveAspectRatio="none"
        shapeRendering="geometricPrecision"
      >
        <defs>
          <path
            id="gentle-wave"
            d="M-160 44c30 0 58-18 88-18s58 18 88 18 58-18 88-18 58 18 88 18v48h-352z"
          />
        </defs>
        <g>
          <use href="#gentle-wave" x="-42" y="0" className="waves-layer opacity-25" />
          <use href="#gentle-wave" x="2.6" y="3" className="waves-layer waves-layer-2 opacity-50" />
          <use href="#gentle-wave" x="48.9" y="5" className="waves-layer waves-layer-3 opacity-65" />
          <use href="#gentle-wave" x="92.4" y="7" className="waves-layer waves-layer-4 opacity-75" />
        </g>
      </svg>
    </div>
  );
}
