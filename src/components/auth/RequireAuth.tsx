"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

const SESSION_RETRY_WINDOW_MS = 4000;
const SESSION_RETRY_INTERVAL_MS = 250;

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState("Validando acesso...");

  useEffect(() => {
    let active = true;
    let redirected = false;
    const nextPath = pathname || "/mesa";
    const loginUrl = `/login?next=${encodeURIComponent(nextPath)}`;

    const markReady = () => {
      if (!active || redirected) {
        return;
      }

      setStatus("Acesso validado.");
      setChecking(false);
    };

    const redirectToLogin = () => {
      if (!active || redirected || typeof window === "undefined") {
        return;
      }

      redirected = true;
      setStatus("Sessao nao encontrada. Redirecionando...");
      setChecking(false);
      window.location.replace(loginUrl);
    };

    const waitForStableSession = async () => {
      const deadline = Date.now() + SESSION_RETRY_WINDOW_MS;

      while (active && !redirected && Date.now() < deadline) {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("[RequireAuth] getSession error", error);
        }

        if (session) {
          markReady();
          return true;
        }

        setStatus("Finalizando entrada...");
        await wait(SESSION_RETRY_INTERVAL_MS);
      }

      return false;
    };

    const checkSession = async () => {
      try {
        const resolved = await waitForStableSession();

        if (!resolved) {
          redirectToLogin();
        }
      } catch (error) {
        console.error("[RequireAuth] unexpected session error", error);
        redirectToLogin();
      }
    };

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || redirected) {
        return;
      }

      if (event === "SIGNED_OUT") {
        redirectToLogin();
        return;
      }

      if (session) {
        markReady();
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [pathname]);

  if (checking) {
    return (
      <div className="aq-page flex items-center justify-center px-6 text-center">
        <div className="animate-pulse font-mono text-xs uppercase tracking-[0.35em] text-[var(--aq-accent)]">
          {status}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
