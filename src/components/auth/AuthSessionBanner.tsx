"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/src/lib/supabase";

type SessionSummary = {
  email: string;
};

export default function AuthSessionBanner() {
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);

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

  if (!sessionSummary) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex justify-center px-3">
      <div className="flex max-w-full items-center gap-2 rounded-full border border-[rgba(74,217,217,0.35)] bg-[rgba(5,10,16,0.92)] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--aq-accent)] shadow-[0_0_24px_rgba(74,217,217,0.18)] backdrop-blur-md md:text-xs">
        <ShieldCheck size={14} />
        <span>Logado como {sessionSummary.email}</span>
      </div>
    </div>
  );
}
