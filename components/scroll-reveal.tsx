"use client";

import { type ReactNode, useEffect, useRef } from "react";

export function ScrollReveal({
  children,
  className = "",
  delayClass = "",
}: {
  children: ReactNode;
  className?: string;
  delayClass?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("reveal-visible");
          }
        }
      },
      { threshold: 0.12 },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal-item ${className} ${delayClass}`.trim()}
    >
      {children}
    </div>
  );
}
