import { PortalFrame } from "@/components/portal-frame";
import { ClinicReferralForm } from "@/components/clinic-referral-form";
import { signInStaff, signOut } from "@/app/actions/auth";
import { getPortalSessionSummary } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type ClinicPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function getLoginErrorMessage(error?: string) {
  if (error === "invalid_credentials") {
    return "The clinic email or password was not accepted.";
  }

  if (error === "missing_credentials") {
    return "Enter the clinic email and password.";
  }

  return null;
}

export default async function ClinicPage({ searchParams }: ClinicPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const session = await getPortalSessionSummary("clinic");
  const loginError = getLoginErrorMessage(resolvedSearchParams?.error);

  if (!session.isConfigured) {
    return (
      <PortalFrame
        description="Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before exercising the clinic auth path."
        error="Supabase public credentials are not configured in this workspace."
        portal="clinic"
        status="Configuration required"
        title="Clinic login unavailable"
      >
        <section className="rounded-[28px] border border-[var(--border)] bg-white/90 p-8 shadow-[0_20px_60px_rgba(16,36,63,0.08)]">
          <p className="text-sm leading-6 text-[var(--muted)]">
            The login path is implemented, but it cannot be exercised until the public
            Supabase URL and anon key are available to the app.
          </p>
        </section>
      </PortalFrame>
    );
  }

  if (!session.hasSession || !session.portalMatches) {
    return (
      <PortalFrame
        description="Sign in with the clinic seed account to access referral submission for Milestone 2."
        error={loginError}
        portal="clinic"
        status="Clinic login"
        title="Clinic referral intake"
      >
        <section className="rounded-[28px] border border-[var(--border)] bg-white/90 p-8 shadow-[0_20px_60px_rgba(16,36,63,0.08)]">
          <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
            Sign in
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Use Supabase email and password auth for the clinic path. After sign-in,
            this page exposes only the step-5 referral form and manual onboarding-link
            handoff.
          </p>

          <form action={signInStaff} className="mt-6 space-y-5">
            <input name="portal" type="hidden" value="clinic" />

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                Clinic email
              </span>
              <input
                autoComplete="email"
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                name="email"
                placeholder="clinic.dusw+milestone2@example.com"
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
              Sign in to clinic portal
            </button>
          </form>
        </section>
      </PortalFrame>
    );
  }

  return (
    <PortalFrame
      description="This step implements clinic authentication, referral creation, and the manual onboarding-link success state only."
      portal="clinic"
      status={`Signed in as ${session.email ?? "clinic user"}`}
      title="Clinic referral intake"
    >
      <section className="mb-6 rounded-[28px] border border-[var(--border)] bg-white/90 p-8 shadow-[0_20px_60px_rgba(16,36,63,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
              Active clinic session
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Referral submission is available. The clinic referrals list remains
              deferred to step 7.
            </p>
          </div>

          <form action={signOut}>
            <input name="portal" type="hidden" value="clinic" />
            <button
              className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)]"
              type="submit"
            >
              Sign out
            </button>
          </form>
        </div>
      </section>

      <ClinicReferralForm />
    </PortalFrame>
  );
}
