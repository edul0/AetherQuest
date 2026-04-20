"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Cinzel } from "next/font/google";
import { ChevronRight, Mail, Shield, Sparkles } from "lucide-react";
import { supabase } from "@/src/lib/supabase";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/mesa";
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace(nextPath);
      } else {
        setChecking(false);
      }
    };

    checkSession();
  }, [nextPath, router]);

  const enviarLink = async () => {
    if (!email.trim()) {
      setFeedback("Informe um email para entrar.");
      return;
    }

    setSending(true);
    setFeedback("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/login?next=${encodeURIComponent(nextPath)}`,
      },
    });

    if (error) {
      setFeedback(error.message);
      setSending(false);
      return;
    }

    setFeedback("Link de acesso enviado. Abra o email e volte para entrar.");
    setSending(false);
  };

  if (checking) {
    return (
      <div className="aq-page flex items-center justify-center">
        <span className="animate-pulse font-mono text-[11px] uppercase tracking-[0.4em] text-[var(--aq-accent)]">
          Verificando sessao...
        </span>
      </div>
    );
  }

  return (
    <main className="aq-page flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="aq-orb aq-orb-cyan" />
      <div className="aq-orb aq-orb-indigo" />

      <div className="aq-panel relative z-10 flex w-full max-w-2xl flex-col px-8 py-10 text-center md:px-14 md:py-14">
        <div className="mb-8 flex items-center justify-center gap-2 rounded-full border border-[var(--aq-border-strong)] bg-[rgba(74,217,217,0.08)] px-4 py-2">
          <Shield size={10} className="text-[var(--aq-accent)]" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--aq-accent)]">
            Acesso Protegido
          </span>
        </div>

        <h1 className={`${cinzel.className} text-5xl font-black leading-none text-[var(--aq-title)] md:text-7xl`}>
          ENTRAR
          <br />
          <span className="text-[var(--aq-accent)]">AETHERQUEST</span>
        </h1>

        <div className="my-6 h-px w-24 self-center bg-[linear-gradient(90deg,transparent,#4ad9d9,transparent)]" />

        <p className="mx-auto max-w-xl text-sm leading-relaxed text-[var(--aq-text)] md:text-base">
          O link da ficha e da mesa agora exige autenticacao. Entre com seu email para receber um link magico e abrir sua sessao.
        </p>

        <div className="mt-8 rounded-3xl border border-[var(--aq-border)] bg-[rgba(10,15,24,0.76)] p-5 text-left">
          <div className="aq-kicker">Email</div>
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] px-4 py-3">
            <Mail size={16} className="text-[var(--aq-accent)]" />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@email.com"
              className="w-full bg-transparent text-sm text-[var(--aq-title)] outline-none placeholder:text-[var(--aq-text-subtle)]"
            />
          </div>

          <button onClick={enviarLink} disabled={sending} className="aq-button-primary mt-5 w-full justify-center disabled:opacity-60">
            {sending ? "Enviando..." : "Receber Link de Entrada"}
            <ChevronRight size={16} />
          </button>

          {feedback ? (
            <div className="mt-4 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] px-4 py-3 text-sm text-[var(--aq-text)]">
              {feedback}
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {[
            "Fichas protegidas por sessao",
            "Mesa restrita a usuarios logados",
            "Links publicos sem acesso anonimo",
          ].map((label) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-xl border border-[var(--aq-border)] bg-[rgba(10,15,24,0.84)] px-3 py-2"
            >
              <Sparkles size={11} className="text-[var(--aq-accent)]" />
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

function LoginFallback() {
  return (
    <div className="aq-page flex items-center justify-center">
      <span className="animate-pulse font-mono text-[11px] uppercase tracking-[0.4em] text-[var(--aq-accent)]">
        Preparando acesso...
      </span>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
