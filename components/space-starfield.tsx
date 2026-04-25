"use client";

import { useEffect, useRef } from "react";

type Star = { x: number; y: number; z: number };

function readBgColor(): string {
  if (typeof document === "undefined") return "#050608";
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue("--bg")
    .trim();
  return v || "#050608";
}

export function SpaceStarfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const g = ctx;

    let stars: Star[] = [];
    let w = 0;
    let h = 0;
    let cx = 0;
    let cy = 0;
    let focal = 400;
    let dpr = 1;
    let rafId = 0;
    let stopped = false;

    const starCount = () => (window.innerWidth < 768 ? 400 : 880);

    function resetStar(s: Star) {
      s.x = (Math.random() - 0.5) * w * 2.2;
      s.y = (Math.random() - 0.5) * h * 2.2;
      s.z = Math.random() * w * 0.9 + w * 0.25;
    }

    function init() {
      dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      c.width = w * dpr;
      c.height = h * dpr;
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);

      cx = w / 2;
      cy = h / 2;
      focal = w * 0.52;

      const n = starCount();
      stars = [];
      for (let i = 0; i < n; i++) {
        const s: Star = { x: 0, y: 0, z: 0 };
        resetStar(s);
        stars.push(s);
      }
    }

    function frame() {
      if (stopped) return;

      const bg = readBgColor();
      g.fillStyle = bg;
      g.fillRect(0, 0, w, h);

      const speed = w < 768 ? 0.9 : 1.5;

      for (const star of stars) {
        star.z -= speed;
        if (star.z <= 1) {
          resetStar(star);
        }

        const sx = (star.x / star.z) * focal + cx;
        const sy = (star.y / star.z) * focal + cy;

        const depth = 1 - star.z / (w * 1.2);
        const radius = Math.max(0.35, depth * 2.35);
        const alpha = Math.min(0.92, 0.12 + depth * 0.92);

        if (sx < -50 || sx > w + 50 || sy < -50 || sy > h + 50) {
          continue;
        }

        g.fillStyle = `rgba(255,255,255,${alpha})`;
        g.beginPath();
        g.arc(sx, sy, radius, 0, Math.PI * 2);
        g.fill();
      }

      rafId = requestAnimationFrame(frame);
    }

    function start() {
      stopped = false;
      init();
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(frame);
    }

    start();

    let resizeT: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        cancelAnimationFrame(rafId);
        start();
      }, 120);
    };

    window.addEventListener("resize", onResize);

    return () => {
      stopped = true;
      clearTimeout(resizeT);
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[0] h-full w-full"
    />
  );
}
