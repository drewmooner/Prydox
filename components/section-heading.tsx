import type { ReactNode } from "react";

/**
 * Section title with a subtle, static highlight (no motion) for readability on dark UI.
 */
export function SectionHeading({
  title,
  subtitle,
  titleClassName = "",
}: {
  title: ReactNode;
  subtitle?: string;
  titleClassName?: string;
}) {
  return (
    <div>
      <div className="relative inline-block max-w-full">
        <div
          className="pointer-events-none absolute -inset-x-5 -inset-y-4 -z-10 rounded-2xl bg-[radial-gradient(ellipse_95%_90%_at_50%_45%,rgba(255,255,255,0.045)_0%,transparent_68%)]"
          aria-hidden
        />
        <h2
          className={`font-display relative text-[clamp(28px,3.8vw,46px)] font-bold leading-[1.12] tracking-tight text-[var(--fg)] ${titleClassName}`}
        >
          {title}
        </h2>
      </div>
      {subtitle ? (
        <p className="mt-5 max-w-[560px] text-[15px] leading-[1.75] text-[var(--muted)]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
