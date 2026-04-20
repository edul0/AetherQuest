"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

const AUTH_HANDOFF_KEY = "aq-auth-handoff";
const AUTH_HANDOFF_WINDOW_MS = 8000;

function hasRecentAuthHandoff() {
  if (typeof window === "undefined") {
    return false;
  }

  const raw = window.sessionStorage.getItem(AUTH_HANDOFF_KEY);
  if (!raw) {
    return false;
  }

  const timestamp = Number(raw);
  if (!Number.isFinite(timestamp)) {
    window.sessionStorage.removeItem(AUTH_HANDOFF_KEY);
    return false;
  }

  const recent = Date.now() - timestamp < AUTH_HANDOFF_WINDOW_MS;
  if (!recent) {
    window.sessionStorage.removeItem(AUTH_HANDOFF_KEY);
  }

  return recent;
}

function clearAuthHandoff() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(AUTH_HANDOFF_KEY);
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

    const redirectToLogin = async () => {
      if (!active || redirected || typeof window === "undefined") {
        return;
      }

      redirected = true;
      setStatus("Sessao nao encontrada. Redirecionando...");
      setChecking(false);
      clearAuthHandoff();

      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch (error) {
        console.error("[RequireAuth] local signOut error", error);
      }

      window.location.replace(loginUrl);
    };

    const timeout = window.setTimeout(() => {
      console.warn("[RequireAuth] session check timed out");
      setStatus("Nao foi possivel validar a sessao. Redirecionando...");
      void redirectToLogin();
    }, hasRecentAuthHandoff() ? AUTH_HANDOFF_WINDOW_MS : 4000);

    const markReady = () => {
      if (!active || redirected) {
        return;
      }

      window.clearTimeout(timeout);
      clearAuthHandoff();
      setChecking(false);
      setStatus("Acesso validado.");
    };

    const retryAfterHandoff = async () => {
      const deadline = Date.now() + AUTH_HANDOFF_WINDOW_MS;

      while (active && !redirected && Date.now() < deadline) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          markReady();
          return true;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 350));
      }

      return false;
    };

    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!active || redirected) {
          return;
        }

        if (error) {
          console.error("[RequireAuth] getSession error", error);
          await redirectToLogin();
          return;
        }

        if (session) {
          markReady();
          return;
        }

        if (hasRecentAuthHandoff()) {
          setStatus("Finalizando entrada...");
          const resolved = await retryAfterHandoff();
          if (resolved) {
            return;
          }
        }

        await redirectToLogin();
      } catch (error) {
        console.error("[RequireAuth] unexpected session error", error);
        await redirectToLogin();
      }
    };

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active || redirected) {
        return;
      }

      if (!session) {
        if (hasRecentAuthHandoff()) {
          setStatus("Finalizando entrada...");
          return;
        }

        void redirectToLogin();
        return;
      }

      markReady();
    });

    return () => {
      active = false;
      window.clearTimeout(timeout);
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
