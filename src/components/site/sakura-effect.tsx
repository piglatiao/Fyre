"use client";

import { useEffect, useRef } from "react";
import type { SakuraPetal } from "@/types/sakura-petal";

// 在视口内随机生成一片花瓣
function createPetal(width: number, height: number): SakuraPetal {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    size: 5 + Math.random() * 8,
    rotation: Math.random() * Math.PI * 2,
    alpha: 0.35 + Math.random() * 0.5,
    speedX: -0.55 - Math.random() * 0.75,
    speedY: 0.65 + Math.random() * 1.1,
    spin: -0.012 + Math.random() * 0.024,
    phase: Math.random() * Math.PI * 2,
  };
}

// 绘制一片花瓣：贝塞尔曲线围成柔和的花瓣轮廓
function drawPetal(context: CanvasRenderingContext2D, petal: SakuraPetal): void {
  const size = petal.size;
  context.save();
  context.translate(petal.x, petal.y);
  context.rotate(petal.rotation);
  context.globalAlpha = petal.alpha;
  context.fillStyle = "#ffc2d1";
  context.beginPath();
  context.moveTo(0, -size);
  context.bezierCurveTo(size * 0.85, -size * 0.65, size * 0.9, size * 0.45, 0, size);
  context.bezierCurveTo(-size * 0.9, size * 0.45, -size * 0.85, -size * 0.65, 0, -size);
  context.fill();
  context.globalAlpha = petal.alpha * 0.55;
  context.strokeStyle = "#fff0f4";
  context.lineWidth = 0.8;
  context.beginPath();
  context.moveTo(0, -size * 0.7);
  context.lineTo(0, size * 0.65);
  context.stroke();
  context.restore();
}

// 樱花飘落特效：固定画布覆盖视口，仅负责绘制，不拦截鼠标与键盘操作
export default function SakuraEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    // 尊重访客的减少动态效果偏好，不创建持续动画
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    const canvasElement = canvas;
    const drawingContext = context;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let petals: SakuraPetal[] = [];
    let frameId = 0;

    // 按设备像素比放大画布，最多 2 倍，兼顾清晰度与手机性能
    function resize(): void {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvasElement.width = Math.round(width * ratio);
      canvasElement.height = Math.round(height * ratio);
      canvasElement.style.width = `${width}px`;
      canvasElement.style.height = `${height}px`;
      drawingContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      petals = Array.from({ length: 21 }, () => createPetal(width, height));
    }

    // 花瓣飘出视口后从顶部或左侧重新进入
    function resetPetal(petal: SakuraPetal): void {
      if (Math.random() > 0.35) {
        petal.x = Math.random() * width;
        petal.y = -petal.size * 2;
      } else {
        petal.x = width + petal.size * 2;
        petal.y = Math.random() * height * 0.7;
      }
      petal.size = 5 + Math.random() * 8;
      petal.rotation = Math.random() * Math.PI * 2;
      petal.alpha = 0.35 + Math.random() * 0.5;
      petal.speedX = -0.55 - Math.random() * 0.75;
      petal.speedY = 0.65 + Math.random() * 1.1;
    }

    // 主循环：页面隐藏时跳过绘制，切回后继续
    function frame(): void {
      frameId = window.requestAnimationFrame(frame);
      if (document.hidden) {
        return;
      }
      drawingContext.clearRect(0, 0, width, height);
      for (const petal of petals) {
        petal.phase += 0.015;
        petal.x += petal.speedX + Math.sin(petal.phase) * 0.35;
        petal.y += petal.speedY;
        petal.rotation += petal.spin;
        if (petal.y - petal.size > height || petal.x + petal.size < 0) {
          resetPetal(petal);
        }
        drawPetal(drawingContext, petal);
      }
    }

    resize();
    frameId = window.requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="sakura-canvas" />;
}
