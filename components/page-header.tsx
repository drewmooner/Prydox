export function PageHeader({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="border-b border-[var(--border)] pb-8 md:pb-10">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--accent-bright)]">
        {kicker}
      </p>
      <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight text-[var(--fg)] md:text-4xl">
        {title}
      </h1>
      {children ? (
        <div className="mt-5 max-w-2xl text-[14px] leading-relaxed text-[var(--muted)] md:text-[15px]">
          {children}
        </div>
      ) : null}
    </header>
  );
}
