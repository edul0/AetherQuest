"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

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
    }, 4000);

    const markReady = () => {
      if (!active || redirected) {
        return;
      }

      window.clearTimeout(timeout);
      setChecking(false);
      setStatus("Acesso validado.");
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

        if (error || !session) {
          if (error) {
            console.error("[RequireAuth] getSession error", error);
          }
          await redirectToLogin();
          return;
        }

        markReady();
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
