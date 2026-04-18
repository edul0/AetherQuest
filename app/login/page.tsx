"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Cinzel } from "next/font/google";
import { ChevronRight, Scroll, Shield, Sparkles, Swords } from "lucide-react";
import { supabase } from "@/src/lib/supabase";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/mesa");
      } else {
        setChecking(false);
      }
    };

    checkSession();
  }, [router]);

  if (checking) {
    return (
      <div className="aq-page flex items-center justify-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.4em] text-[var(--aq-accent)] animate-pulse">
          Verificando sessao...
        </span>
      </div>
    );
  }

  return (
    <main className="aq-page flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div className="aq-orb aq-orb-cyan" />
      <div className="aq-orb aq-orb-indigo" />

      <div className="aq-panel relative z-10 flex max-w-3xl flex-col items-center px-8 py-10 text-center md:px-14 md:py-14">
        <div className="mb-8 flex items-center gap-2 rounded-full border border-[var(--aq-border-strong)] bg-[rgba(74,217,217,0.08)] px-4 py-2">
          <Sparkles size={10} className="text-[var(--aq-accent)]" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--aq-accent)]">
            Virtual Tabletop | RPG
          </span>
        </div>

        <h1
          className={`${cinzel.className} text-6xl font-black leading-none text-[var(--aq-title)] md:text-8xl`}
          style={{ textShadow: "0 0 60px rgba(74,217,217,0.12)", letterSpacing: "0.05em" }}
        >
          AETHER
          <br />
          <span className="text-[var(--aq-accent)]">QUEST</span>
        </h1>

        <div className="my-6 h-px w-24 bg-[linear-gradient(90deg,transparent,#4ad9d9,transparent)]" />

        <p className="max-w-xl text-sm leading-relaxed text-[var(--aq-text)] md:text-base">
          Fichas inteligentes. Mesas sincronizadas. Um cockpit tatico para campanhas em tempo real.
        </p>

        <button onClick={() => router.push("/mesa")} className="aq-button-primary mt-10">
          Entrar na Mesa
          <ChevronRight size={16} />
        </button>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {[
            { icon: Scroll, label: "Fichas Dinamicas" },
            { icon: Shield, label: "Ordem Paranormal" },
            { icon: Swords, label: "D&D 5e" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-xl border border-[var(--aq-border)] bg-[rgba(10,15,24,0.84)] px-3 py-2"
            >
              <Icon size={11} className="text-[var(--aq-accent)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--aq-text)]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
