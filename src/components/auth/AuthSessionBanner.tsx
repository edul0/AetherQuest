"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";
import { supabase } from "@/src/lib/supabase";

type SessionSummary = {
  email: string;
};

function formatEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) {
    return email;
  }

  const shortName = name.length > 10 ? `${name.slice(0, 10)}...` : name;
  return `${shortName}@${domain}`;
}

export default function AuthSessionBanner() {
  const pathname = usePathname();
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    const applySession = (email?: string | null) => {
      if (!active) {
        return;
      }

      if (!email) {
        setSessionSummary(null);
        return;
      }

      setSessionSummary({ email });
    };

    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      applySession(session?.user?.email ?? null);
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session?.user?.email ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const compactEmail = useMemo(() => {
    if (!sessionSummary?.email) {
      return "";
    }

    return formatEmail(sessionSummary.email);
  }, [sessionSummary?.email]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (!sessionSummary || pathname?.startsWith("/mesa")) {
    return null;
  }

  return (
    <div className="fixed bottom-3 right-3 z-[100] md:bottom-4 md:right-4">
      <div className="flex items-center gap-2 rounded-full border border-[rgba(74,217,217,0.22)] bg-[rgba(5,10,16,0.78)] px-2.5 py-2 text-[10px] text-[var(--aq-text)] shadow-[0_0_14px_rgba(74,217,217,0.08)] backdrop-blur-md md:px-3">
        <span className="flex items-center gap-2 text-[var(--aq-accent)]">
          <ShieldCheck size={13} />
          <span className="max-w-[110px] truncate font-semibold md:max-w-[140px]">{compactEmail}</span>
        </span>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-1 rounded-full border border-[var(--aq-border)] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--aq-text-muted)] transition-colors hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-title)] disabled:opacity-60"
        >
          <LogOut size={11} />
          {signingOut ? "Saindo" : "Sair"}
        </button>
      </div>
    </div>
  );
}
