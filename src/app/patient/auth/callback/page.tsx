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
    <main className="min-h-screen bg-gradient-to-br from-[#f2f7ff] via-[#ecf3ff] to-[#e2edf8] text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-6 pt-10">
        <div className="mb-6 mt-2 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#3399e6] to-[#1f83d2] text-lg font-bold text-white shadow-[0_10px_24px_rgba(51,153,230,0.35)]">
            TW
          </div>
          <h1 className="text-[2rem] font-bold leading-tight text-slate-900">
            Patient Portal
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Your journey to a new beginning
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            We are confirming your secure onboarding session and preparing the patient
            portal.
          </p>
        </div>

        <section className="rounded-[28px] bg-white/95 p-4 shadow-[0_20px_40px_rgba(15,23,42,0.11)]">
          <div className="mb-4 flex rounded-2xl bg-[#eff4fa] p-1">
            <div className="flex-1 rounded-xl bg-[#3399e6] px-4 py-2 text-center text-sm font-semibold text-white">
              Login
            </div>
            <div className="flex-1 rounded-xl px-4 py-2 text-center text-sm font-semibold text-slate-500">
              Register
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)]">
            <h2 className="text-2xl font-semibold text-slate-900">Welcome Back</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
              Continue with your secure onboarding link
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{message}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
