import { PortalFrame } from "@/components/portal-frame";
import { signInStaff, signOut } from "@/app/actions/auth";
import { getPortalSessionSummary } from "@/lib/auth/session";
import {
  formatCenterDate,
  type FrontDeskIntakeQueueItem,
} from "@/lib/center/intake";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CenterPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getLoginErrorMessage(error?: string) {
  if (error === "invalid_credentials") {
    return "The Front Desk email or password was not accepted.";
  }

  if (error === "missing_credentials") {
    return "Enter the Front Desk email and password.";
  }

  return null;
}

async function getFrontDeskQueue(): Promise<FrontDeskIntakeQueueItem[]> {
  const supabase = await createServerSupabaseClient();
  const { data: cases, error } = await supabase
    .from("cases")
    .select(
      "case_number, roi_completed_at, stage, patient:patients(first_name, last_name), clinic:organizations!referring_clinic_id(name)",
    )
    .order("roi_completed_at", { ascending: false, nullsFirst: false });

  if (error || !cases) {
    return [];
  }

  return cases.flatMap((caseRow) => {
    if (
      caseRow.stage !== "initial-todos" ||
      !caseRow.patient ||
      !caseRow.clinic
    ) {
      return [];
    }

    const patient = Array.isArray(caseRow.patient)
      ? caseRow.patient[0]
      : caseRow.patient;
    const clinic = Array.isArray(caseRow.clinic)
      ? caseRow.clinic[0]
      : caseRow.clinic;

    if (!patient || !clinic) {
      return [];
    }

    return [
      {
        caseNumber: caseRow.case_number,
        clinicName: clinic.name,
        patientName: `${patient.first_name} ${patient.last_name}`.trim(),
        roiCompletedAt: caseRow.roi_completed_at,
        stage: "initial-todos",
      } satisfies FrontDeskIntakeQueueItem,
    ];
  });
}

function QueueRow({ item }: { item: FrontDeskIntakeQueueItem }) {
  return (
    <div className="grid gap-4 border-t border-[var(--border)] px-6 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1fr)] lg:items-center">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          {item.patientName}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)]">
          {item.caseNumber}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-sm text-[var(--foreground)]">{item.clinicName}</p>
      </div>
      <div>
        <span className="inline-flex rounded-full border border-[#d7e6f4] bg-[#f5faff] px-3 py-1 text-xs font-semibold text-[#285f87]">
          Initial TODOs
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-sm text-[var(--foreground)]">
          {formatCenterDate(item.roiCompletedAt)}
        </p>
      </div>
    </div>
  );
}

function FrontDeskQueue({
  queueItems,
}: {
  queueItems: FrontDeskIntakeQueueItem[];
}) {
  return (
    <section className="rounded-[28px] border border-[var(--border)] bg-white/90 shadow-[0_20px_60px_rgba(16,36,63,0.08)]">
      <div className="flex flex-wrap items-end justify-between gap-4 px-8 pb-6 pt-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Front Desk queue
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Intake queue
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            Read-only Milestone 2 queue. Existing RLS limits this view to cases
            already advanced to <span className="font-medium">initial-todos</span>.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[#f7faff] px-4 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Visible cases
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
            {queueItems.length}
          </p>
        </div>
      </div>

      {queueItems.length ? (
        <>
          <div className="hidden border-y border-[var(--border)] bg-[#f8fbff] px-6 py-3 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1fr)] lg:gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Patient
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Case number
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Clinic
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Stage
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              ROI completed
            </p>
          </div>

          <div>
            {queueItems.map((item, index) => (
              <div
                key={item.caseNumber}
                className={index === 0 ? "border-t border-[var(--border)] lg:border-t-0" : ""}
              >
                <QueueRow item={item} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="px-8 pb-8">
          <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-[#f8fbff] px-6 py-10 text-center">
            <p className="text-base font-medium text-[var(--foreground)]">
              No intake-ready cases
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Cases appear here only after the patient completes both ROI forms and
              reaches <span className="font-medium">initial-todos</span>.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default async function CenterPage({ searchParams }: CenterPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const session = await getPortalSessionSummary("center");
  const loginError = getLoginErrorMessage(resolvedSearchParams?.error);
  const queueItems =
    session.hasSession && session.portalMatches ? await getFrontDeskQueue() : [];

  if (!session.isConfigured) {
    return (
      <PortalFrame
        description="Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before exercising the Front Desk auth path."
        error="Supabase public credentials are not configured in this workspace."
        portal="center"
        status="Configuration required"
        title="Front Desk intake queue unavailable"
      >
        <section className="rounded-[28px] border border-[var(--border)] bg-white/90 p-8 shadow-[0_20px_60px_rgba(16,36,63,0.08)]">
          <p className="text-sm leading-6 text-[var(--muted)]">
            The center login path is implemented, but it cannot be exercised until
            the public Supabase URL and anon key are available to the app.
          </p>
        </section>
      </PortalFrame>
    );
  }

  if (!session.hasSession || !session.portalMatches) {
    return (
      <PortalFrame
        description="Sign in with the seeded Front Desk account to access the Milestone 2 intake queue."
        error={loginError}
        portal="center"
        status="Front Desk login"
        title="Front Desk intake queue"
      >
        <section className="rounded-[28px] border border-[var(--border)] bg-white/90 p-8 shadow-[0_20px_60px_rgba(16,36,63,0.08)]">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
            Sign in
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Use Supabase email and password auth for the Front Desk path. After
            sign-in, this page exposes only the read-only Milestone 2 intake queue.
          </p>

          <form action={signInStaff} className="mt-6 space-y-5">
            <input name="portal" type="hidden" value="center" />

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                Front Desk email
              </span>
              <input
                autoComplete="email"
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                name="email"
                placeholder="frontdesk+milestone2@example.com"
                required
                type="email"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                Password
              </span>
              <input
                autoComplete="current-password"
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                name="password"
                required
                type="password"
              />
            </label>

            <button
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              type="submit"
            >
              Sign in to Front Desk queue
            </button>
          </form>
        </section>
      </PortalFrame>
    );
  }

  return (
    <PortalFrame
      description="The Front Desk can review a read-only intake queue for Milestone 2. This view stops at initial-todos and does not expose case detail or write actions."
      portal="center"
      status={`Signed in as ${session.email ?? "Front Desk user"}`}
      title="Front Desk intake queue"
    >
      <section className="mb-6 rounded-[28px] border border-[var(--border)] bg-white/90 p-8 shadow-[0_20px_60px_rgba(16,36,63,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
              Active Front Desk session
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              This queue is read-only and intentionally limited to cases already at
              <span className="font-medium"> initial-todos</span>.
            </p>
          </div>

          <form action={signOut}>
            <input name="portal" type="hidden" value="center" />
            <button
              className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </div>
      </section>

      <FrontDeskQueue queueItems={queueItems} />
    </PortalFrame>
  );
}
