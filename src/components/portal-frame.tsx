type PortalFrameProps = {
  children: React.ReactNode;
  description: string;
  error?: string | null;
  portal: "center" | "clinic" | "patient";
  status: string;
  title: string;
};

export function PortalFrame({
  children,
  description,
  error,
  portal,
  status,
  title,
}: PortalFrameProps) {
  return (
    <main className="min-h-screen px-6 py-10 text-[var(--foreground)]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 rounded-[28px] border border-[var(--border)] bg-white/85 p-8 shadow-[0_24px_80px_rgba(22,50,79,0.08)] backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[var(--border)] bg-[#eef6fc] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              /{portal}
            </span>
            <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
              {status}
            </span>
          </div>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
            {description}
          </p>

          {error ? (
            <p className="mt-5 rounded-2xl border border-[#f4c6cb] bg-[#fff3f5] px-4 py-3 text-sm text-[#8a2133]">
              {error}
            </p>
          ) : null}
        </div>

        {children}
      </div>
    </main>
  );
}
