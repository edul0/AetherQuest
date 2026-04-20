"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    const nextPath = pathname || "/mesa";
    const loginUrl = `/login?next=${encodeURIComponent(nextPath)}`;

    const redirectToLogin = () => {
      if (!active) {
        return;
      }
      setChecking(false);
      router.replace(loginUrl);
    };

    const timeout = window.setTimeout(() => {
      console.warn("[RequireAuth] session check timed out");
      redirectToLogin();
    }, 5000);

    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!active) {
          return;
        }

        if (error) {
          console.error("[RequireAuth] getSession error", error);
          redirectToLogin();
          return;
        }

        if (!session) {
          redirectToLogin();
          return;
        }

        window.clearTimeout(timeout);
        setChecking(false);
      } catch (error) {
        console.error("[RequireAuth] unexpected session error", error);
        redirectToLogin();
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      if (!session) {
        redirectToLogin();
        return;
      }

      window.clearTimeout(timeout);
      setChecking(false);
    });

    return () => {
      active = false;
      window.clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="aq-page flex items-center justify-center">
        <div className="animate-pulse font-mono text-xs uppercase tracking-[0.35em] text-[var(--aq-accent)]">
          Validando acesso...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
