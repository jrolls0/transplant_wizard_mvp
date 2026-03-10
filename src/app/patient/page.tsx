import { getPortalSessionSummary } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function PatientPage() {
  const session = await getPortalSessionSummary("patient");

  return (
    <main className="portal-shell">
      <section className="portal-card">
        <p className="portal-kicker">Patient Portal</p>
        <h1 className="portal-title">Milestone 2 foundation only</h1>
        <p className="portal-copy">
          This route exists to confirm patient-route availability and the magic-link
          session foundation before onboarding screens are implemented.
        </p>

        <ul className="status-list">
          <li className="status-row">
            <span className="status-label">Expected portal</span>
            <span className="status-value">patient</span>
          </li>
          <li className="status-row">
            <span className="status-label">Supabase configured</span>
            <span className="status-value">{String(session.isConfigured)}</span>
          </li>
          <li className="status-row">
            <span className="status-label">Active session</span>
            <span className="status-value">{String(session.hasSession)}</span>
          </li>
          <li className="status-row">
            <span className="status-label">Portal metadata</span>
            <span className="status-value">{session.portalType ?? "none"}</span>
          </li>
          <li className="status-row">
            <span className="status-label">Portal match</span>
            <span className="status-value">{String(session.portalMatches)}</span>
          </li>
          <li className="status-row">
            <span className="status-label">User email</span>
            <span className="status-value">{session.email ?? "none"}</span>
          </li>
        </ul>

        <div className="status-note">
          Patient onboarding and ROI screens are intentionally deferred to the next
          batch.
        </div>
      </section>
    </main>
  );
}
