"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, KeyRound, Mail, Shield, Sparkles } from "lucide-react";
import { supabase } from "@/src/lib/supabase";

type AuthMode = "signin" | "signup" | "recovery";

type LoginScreenProps = {
  nextPath?: string;
  recoveryType?: string;
};

const AUTH_HANDOFF_KEY = "aq-auth-handoff";

function humanizeAuthError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("email rate limit exceeded") || lower.includes("rate limit")) {
    return "Muitos emails foram enviados em pouco tempo. Espere alguns minutos antes de tentar de novo.";
  }

  if (lower.includes("invalid login credentials")) {
    return "Email ou senha invalidos.";
  }

  if (lower.includes("email not confirmed")) {
    return "Seu email ainda nao foi confirmado. Confira sua caixa de entrada.";
  }

  if (lower.includes("user already registered")) {
    return "Ja existe uma conta com esse email.";
  }

  if (lower.includes("password should be at least")) {
    return "Use uma senha com pelo menos 6 caracteres.";
  }

  return message;
}

export default function LoginScreen({ nextPath = "/mesa", recoveryType }: LoginScreenProps) {
  const redirectingRef = useRef(false);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");

  const hasRecoveryMarker = useMemo(() => {
    if (typeof window === "undefined") {
      return recoveryType === "recovery";
    }

    return recoveryType === "recovery" || window.location.hash.includes("type=recovery");
  }, [recoveryType]);

  const goTo = (path: string) => {
    if (typeof window === "undefined") {
      return;
    }

    if (redirectingRef.current) {
      return;
    }

    redirectingRef.current = true;
    window.location.replace(path);
  };

  useEffect(() => {
    let active = true;

    if (hasRecoveryMarker) {
      setMode("recovery");
      setFeedback("Abra o link recebido e escolha sua nova senha.");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!active) {
        return;
      }

      if (event === "PASSWORD_RECOVERY") {
        setMode("recovery");
        setSending(false);
        setFeedback("Link de recuperacao validado. Agora defina sua nova senha.");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [hasRecoveryMarker]);

  const signInWithPassword = async () => {
    if (!email.trim() || !password.trim()) {
      setFeedback("Preencha email e senha para entrar.");
      return;
    }

    setSending(true);
    setFeedback("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setFeedback(humanizeAuthError(error.message));
        return;
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(AUTH_HANDOFF_KEY, String(Date.now()));
      }

      setFeedback("Login realizado. Redirecionando...");
      goTo(nextPath);
    } catch (error) {
      console.error("[login] erro inesperado no signIn", error);
      setFeedback("Nao foi possivel entrar agora. Tente novamente em instantes.");
    } finally {
      setSending(false);
    }
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

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login?next=${encodeURIComponent(nextPath)}`,
        },
      });

      if (error) {
        setFeedback(humanizeAuthError(error.message));
        return;
      }

      setFeedback("Conta criada. Se o Supabase pedir confirmacao por email, confirme e depois entre com sua senha.");
      setMode("signin");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("[login] erro inesperado no signUp", error);
      setFeedback("Nao foi possivel criar a conta agora. Tente novamente em instantes.");
    } finally {
      setSending(false);
    }
  };

  const enviarLinkMagico = async () => {
    if (!email.trim()) {
      setFeedback("Informe um email para receber o link.");
      return;
    }

    setSending(true);
    setFeedback("");

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/login?next=${encodeURIComponent(nextPath)}`,
        },
      });

      if (error) {
        setFeedback(humanizeAuthError(error.message));
        return;
      }

      setFeedback("Link magico enviado. Use isso so se preferir entrar sem senha.");
    } catch (error) {
      console.error("[login] erro inesperado no magic link", error);
      setFeedback("Nao foi possivel enviar o link agora. Tente novamente em instantes.");
    } finally {
      setSending(false);
    }
  };

  const recuperarSenha = async () => {
    if (!email.trim()) {
      setFeedback("Informe o email da conta para recuperar a senha.");
      return;
    }

    setSending(true);
    setFeedback("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login?type=recovery&next=${encodeURIComponent(nextPath)}`,
      });

      if (error) {
        setFeedback(humanizeAuthError(error.message));
        return;
      }

      setFeedback("Enviamos um email de recuperacao. Abra o link recebido para redefinir sua senha.");
    } catch (error) {
      console.error("[login] erro inesperado no reset", error);
      setFeedback("Nao foi possivel enviar o email de recuperacao agora. Tente novamente em instantes.");
    } finally {
      setSending(false);
    }
  };

  const redefinirSenha = async () => {
    if (!password.trim()) {
      setFeedback("Digite a nova senha.");
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

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setFeedback(humanizeAuthError(error.message));
        return;
      }

      await supabase.auth.signOut();
      setFeedback("Senha atualizada com sucesso. Entre novamente com a nova senha.");
      setMode("signin");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("[login] erro inesperado ao redefinir senha", error);
      setFeedback("Nao foi possivel salvar a nova senha agora. Tente novamente em instantes.");
    } finally {
      setSending(false);
    }
  };

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
          {mode === "recovery" ? "NOVA" : "ENTRAR"}
          <br />
          <span className="text-[var(--aq-accent)]">{mode === "recovery" ? "SENHA" : "AETHERQUEST"}</span>
        </h1>

        <div className="my-6 h-px w-24 self-center bg-[linear-gradient(90deg,transparent,#4ad9d9,transparent)]" />

        <p className="mx-auto max-w-xl text-sm leading-relaxed text-[var(--aq-text)] md:text-base">
          {mode === "recovery"
            ? "O link de recuperacao foi aceito. Defina sua nova senha para voltar para a mesa."
            : "Vamos simplificar: entre com email e senha. O link magico fica como plano B, nao como fluxo principal."}
        </p>

        {mode !== "recovery" ? (
          <div className="mt-8 flex justify-center gap-3">
            <button onClick={() => setMode("signin")} className={mode === "signin" ? "aq-button-primary" : "aq-button-secondary"}>
              Entrar
            </button>
            <button onClick={() => setMode("signup")} className={mode === "signup" ? "aq-button-primary" : "aq-button-secondary"}>
              Criar Conta
            </button>
          </div>
        ) : null}

        <div className="mt-8 rounded-3xl border border-[var(--aq-border)] bg-[rgba(10,15,24,0.76)] p-5 text-left">
          <div className="aq-kicker">{mode === "recovery" ? "Redefinir Senha" : "Credenciais"}</div>

          {mode !== "recovery" ? (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] px-4 py-3">
              <Mail size={16} className="text-[var(--aq-accent)]" />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@email.com"
                className="w-full bg-transparent text-sm text-[var(--aq-title)] outline-none placeholder:text-[var(--aq-text-subtle)]"
              />
            </div>
          ) : null}

          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] px-4 py-3">
            <KeyRound size={16} className="text-[var(--aq-accent)]" />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === "signin" ? "Sua senha" : mode === "signup" ? "Crie uma senha" : "Nova senha"}
              className="w-full bg-transparent text-sm text-[var(--aq-title)] outline-none placeholder:text-[var(--aq-text-subtle)]"
            />
          </div>

          {mode !== "signin" ? (
            <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] px-4 py-3">
              <KeyRound size={16} className="text-[var(--aq-accent)]" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder={mode === "recovery" ? "Confirme a nova senha" : "Confirme a senha"}
                className="w-full bg-transparent text-sm text-[var(--aq-title)] outline-none placeholder:text-[var(--aq-text-subtle)]"
              />
            </div>
          ) : null}

          <button
            onClick={mode === "signin" ? signInWithPassword : mode === "signup" ? signUpWithPassword : redefinirSenha}
            disabled={sending}
            className="aq-button-primary mt-5 w-full justify-center disabled:opacity-60"
          >
            {sending ? "Processando..." : mode === "signin" ? "Entrar com Senha" : mode === "signup" ? "Criar Conta" : "Salvar Nova Senha"}
            <ChevronRight size={16} />
          </button>

          {mode === "signin" ? (
            <button onClick={recuperarSenha} disabled={sending} className="aq-button-secondary mt-3 w-full justify-center disabled:opacity-60">
              Esqueci a Senha
            </button>
          ) : null}

          {mode === "signin" ? (
            <button onClick={enviarLinkMagico} disabled={sending} className="aq-button-secondary mt-3 w-full justify-center disabled:opacity-60">
              Usar Link Magico
            </button>
          ) : null}

          {mode === "recovery" ? (
            <button onClick={() => setMode("signin")} disabled={sending} className="aq-button-secondary mt-3 w-full justify-center disabled:opacity-60">
              Voltar ao Login
            </button>
          ) : null}

          {feedback ? (
            <div className="mt-4 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] px-4 py-3 text-sm text-[var(--aq-text)]">
              {feedback}
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {(mode === "recovery"
            ? ["Senha redefinida na propria tela", "Sem voltar para localhost", "Fluxo pronto para celular"]
            : ["Entrada por senha mais pratica", "Recuperacao por email disponivel", "Magic link fica opcional"]
          ).map((label) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-xl border border-[var(--aq-border)] bg-[rgba(10,15,24,0.84)] px-3 py-2"
            >
              <Sparkles size={11} className="text-[var(--aq-accent)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--aq-text)]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
