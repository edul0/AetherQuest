"use client";

import { useEffect, useRef, useState } from "react";
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
  const initialCheckCompleteRef = useRef(false);

  useEffect(() => {
    let active = true;
    let redirected = false;
    initialCheckCompleteRef.current = false;
    const nextPath = pathname || "/mesa";
    const loginUrl = `/login?next=${encodeURIComponent(nextPath)}`;

    const redirectToLogin = () => {
      if (!active || redirected || typeof window === "undefined") {
        return;
      }

      redirected = true;
      clearAuthHandoff();
      setStatus("Sessao nao encontrada. Redirecionando...");
      setChecking(false);
      window.location.replace(loginUrl);
    };

    const markReady = () => {
      if (!active || redirected) {
        return;
      }

      clearAuthHandoff();
      setChecking(false);
      setStatus("Acesso validado.");
    };

    const waitForSessionAfterHandoff = async () => {
      const deadline = Date.now() + AUTH_HANDOFF_WINDOW_MS;

      while (active && !redirected && Date.now() < deadline) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          initialCheckCompleteRef.current = true;
          markReady();
          return true;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 350));
      }

      return false;
    };

    const timeout = window.setTimeout(() => {
      if (redirected || !active) {
        return;
      }

      console.warn("[RequireAuth] session check timed out");
      setStatus("Nao foi possivel validar a sessao. Redirecionando...");
      redirectToLogin();
    }, hasRecentAuthHandoff() ? AUTH_HANDOFF_WINDOW_MS + 1000 : 5000);

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
          initialCheckCompleteRef.current = true;
          redirectToLogin();
          return;
        }

        if (session) {
          initialCheckCompleteRef.current = true;
          window.clearTimeout(timeout);
          markReady();
          return;
        }

        if (hasRecentAuthHandoff()) {
          setStatus("Finalizando entrada...");
          const resolved = await waitForSessionAfterHandoff();
          initialCheckCompleteRef.current = true;
          if (resolved) {
            window.clearTimeout(timeout);
            return;
          }
        } else {
          initialCheckCompleteRef.current = true;
        }

        redirectToLogin();
      } catch (error) {
        console.error("[RequireAuth] unexpected session error", error);
        initialCheckCompleteRef.current = true;
        redirectToLogin();
      }
    };

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active || redirected) {
        return;
      }

      if (!initialCheckCompleteRef.current) {
        return;
      }

      if (session) {
        window.clearTimeout(timeout);
        markReady();
        return;
      }

      if (hasRecentAuthHandoff()) {
        setStatus("Finalizando entrada...");
        return;
      }

      redirectToLogin();
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
