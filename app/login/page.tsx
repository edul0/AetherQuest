"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, KeyRound, Mail, Shield, Sparkles } from "lucide-react";
import { supabase } from "@/src/lib/supabase";

type AuthMode = "signin" | "signup";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/mesa";
  const [mode, setMode] = useState<AuthMode>("signin");
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  const signInWithPassword = async () => {
    if (!email.trim() || !password.trim()) {
      setFeedback("Preencha email e senha para entrar.");
      return;
    }

    setSending(true);
    setFeedback("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setFeedback(error.message);
      setSending(false);
      return;
    }

    router.replace(nextPath);
  };

  const signUpWithPassword = async () => {
    if (!email.trim() || !password.trim()) {
      setFeedback("Preencha email e senha para criar sua conta.");
      return;
    }

    if (password.length < 6) {
      setFeedback("Use uma senha com pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setFeedback("A confirmacao da senha nao bate.");
      return;
    }

    setSending(true);
    setFeedback("");

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login?next=${encodeURIComponent(nextPath)}`,
      },
    });

    if (error) {
      setFeedback(error.message);
      setSending(false);
      return;
    }

    setFeedback("Conta criada. Se o Supabase pedir confirmacao por email, confirme e depois entre com sua senha.");
    setMode("signin");
    setSending(false);
  };

  const enviarLinkMagico = async () => {
    if (!email.trim()) {
      setFeedback("Informe um email para receber o link.");
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

    setFeedback("Link magico enviado. Use isso so se preferir entrar sem senha.");
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

        <h1 className="text-5xl font-black leading-none text-[var(--aq-title)] md:text-7xl" style={{ fontFamily: "var(--font-cinzel)" }}>
          ENTRAR
          <br />
          <span className="text-[var(--aq-accent)]">AETHERQUEST</span>
        </h1>

        <div className="my-6 h-px w-24 self-center bg-[linear-gradient(90deg,transparent,#4ad9d9,transparent)]" />

        <p className="mx-auto max-w-xl text-sm leading-relaxed text-[var(--aq-text)] md:text-base">
          Vamos simplificar: entre com email e senha. O link magico fica como plano B, nao como fluxo principal.
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <button onClick={() => setMode("signin")} className={mode === "signin" ? "aq-button-primary" : "aq-button-secondary"}>
            Entrar
          </button>
          <button onClick={() => setMode("signup")} className={mode === "signup" ? "aq-button-primary" : "aq-button-secondary"}>
            Criar Conta
          </button>
        </div>

        <div className="mt-8 rounded-3xl border border-[var(--aq-border)] bg-[rgba(10,15,24,0.76)] p-5 text-left">
          <div className="aq-kicker">Credenciais</div>

          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] px-4 py-3">
            <Mail size={16} className="text-[var(--aq-accent)]" />
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@email.com"
              className="w-full bg-transparent text-sm text-[var(--aq-title)] outline-none placeholder:text-[var(--aq-text-subtle)]"
            />
          </div>

          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] px-4 py-3">
            <KeyRound size={16} className="text-[var(--aq-accent)]" />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === "signin" ? "Sua senha" : "Crie uma senha"}
              className="w-full bg-transparent text-sm text-[var(--aq-title)] outline-none placeholder:text-[var(--aq-text-subtle)]"
            />
          </div>

          {mode === "signup" ? (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] px-4 py-3">
              <KeyRound size={16} className="text-[var(--aq-accent)]" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirme a senha"
                className="w-full bg-transparent text-sm text-[var(--aq-title)] outline-none placeholder:text-[var(--aq-text-subtle)]"
              />
            </div>
          ) : null}

          <button
            onClick={mode === "signin" ? signInWithPassword : signUpWithPassword}
            disabled={sending}
            className="aq-button-primary mt-5 w-full justify-center disabled:opacity-60"
          >
            {sending ? "Processando..." : mode === "signin" ? "Entrar com Senha" : "Criar Conta"}
            <ChevronRight size={16} />
          </button>

          <button onClick={enviarLinkMagico} disabled={sending} className="aq-button-secondary mt-3 w-full justify-center disabled:opacity-60">
            Usar Link Magico
          </button>

          {feedback ? (
            <div className="mt-4 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] px-4 py-3 text-sm text-[var(--aq-text)]">
              {feedback}
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {[
            "Entrada por senha mais pratica",
            "Magic link fica opcional",
            "Mesma sessao para fichas e mesa",
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
