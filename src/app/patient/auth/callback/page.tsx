"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function buildErrorRedirect(code: string) {
  return `/patient?error=${code}`;
}

function readHashParam(hash: string, key: string) {
  const parsedHash = new URLSearchParams(hash.replace(/^#/, ""));
  return parsedHash.get(key);
}

export default function PatientAuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Securing your patient session...");

  useEffect(() => {
    let isCancelled = false;

    async function completeCallback() {
      const supabase = createBrowserSupabaseClient();
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const accessToken = readHashParam(window.location.hash, "access_token");
      const refreshToken = readHashParam(window.location.hash, "refresh_token");

      if (url.searchParams.get("error_description")) {
        startTransition(() => {
          router.replace(buildErrorRedirect("magic_link_exchange_failed"));
        });
        return;
      }

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }
        } else {
          startTransition(() => {
            router.replace(buildErrorRedirect("magic_link_missing"));
          });
          return;
        }

        if (!isCancelled) {
          setMessage("Session ready. Redirecting to onboarding...");
        }

        startTransition(() => {
          router.replace("/patient");
        });
      } catch {
        startTransition(() => {
          router.replace(buildErrorRedirect("magic_link_exchange_failed"));
        });
      }
    }

    void completeCallback();

    return () => {
      isCancelled = true;
    };
  }, [router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#f2f7ff] via-[#ecf3ff] to-[#e2edf8]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-6 pt-10">
        <div className="mb-7 mt-3 flex flex-col items-center gap-3 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#3399e6] shadow-[0_10px_24px_rgba(51,153,230,0.35)]">
            <svg
              aria-hidden="true"
              className="h-10 w-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 20.4 4.8 13.7C3 12.1 2 10.7 2 8.8 2 6.1 4 4 6.7 4c1.5 0 3 .7 4 1.9C11.7 4.7 13.2 4 14.7 4 17.4 4 19.4 6.1 19.4 8.8c0 1.9-1 3.3-2.8 4.9L12 20.4Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-[31px] font-bold tracking-tight text-slate-900">
              Patient Portal
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Your journey to a new beginning
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-full bg-white p-1 shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
          <div className="grid grid-cols-2 gap-1">
            <div className="rounded-full bg-[#3399e6] px-4 py-2.5 text-center text-sm font-semibold text-white">
              Sign In
            </div>
            <div className="rounded-full px-4 py-2.5 text-center text-sm font-semibold text-slate-500">
              Register
            </div>
          </div>
        </div>

        <section className="min-h-0 flex-1 overflow-hidden rounded-[24px] bg-white/95 p-4 shadow-[0_20px_40px_rgba(15,23,42,0.11)]">
          <div className="h-full overflow-y-auto pr-1">
            <div className="space-y-4">
              <div className="rounded-xl bg-[#edf5ff] px-3 py-2 text-xs text-[#2a6ead]">
                Continue with your secure onboarding link.
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-slate-900">
                  Welcome Back
                </h2>
                <p className="text-sm text-slate-500">
                  We are confirming your secure onboarding session.
                </p>
              </div>

              <div className="rounded-xl border border-[#d8e4f1] bg-white px-4 py-4 text-sm leading-relaxed text-slate-600">
                {message}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
