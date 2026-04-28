"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, KeyRound, Mail, Shield, Sparkles } from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { PageLayout, PageShell, Card, CardContent, Button, Input, Alert, H1, Body } from "@/src/components/ui";

type AuthMode = "signin" | "signup" | "recovery";

type LoginScreenProps = {
  nextPath?: string;
  recoveryType?: string;
};

const AUTH_HANDOFF_KEY = "aq-auth-handoff";
const DEFAULT_AFTER_LOGIN_PATH = "/fichas";

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

  if (lower.includes("jwt expired") || lower.includes("refresh token")) {
    return "Sua sessao antiga expirou. Entre novamente para continuar.";
  }

  return message;
}

function setAuthHandoff() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(AUTH_HANDOFF_KEY, String(Date.now()));
}

function clearAuthHandoff() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(AUTH_HANDOFF_KEY);
}

function getSafeNextPath(nextPath?: string) {
  if (!nextPath || !nextPath.startsWith("/")) return DEFAULT_AFTER_LOGIN_PATH;
  if (nextPath.startsWith("/login")) return DEFAULT_AFTER_LOGIN_PATH;
  return nextPath;
}

export default function LoginScreen({ nextPath = DEFAULT_AFTER_LOGIN_PATH, recoveryType }: LoginScreenProps) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const redirectingRef = useRef(false);

  const destinationPath = useMemo(() => getSafeNextPath(nextPath), [nextPath]);

  const hasRecoveryMarker = useMemo(() => {
    if (typeof window === "undefined") return recoveryType === "recovery";
    return recoveryType === "recovery" || window.location.hash.includes("type=recovery");
  }, [recoveryType]);

  const goTo = useCallback((path: string) => {
    if (typeof window === "undefined" || redirectingRef.current) return;
    redirectingRef.current = true;
    window.location.assign(new URL(path, window.location.origin).toString());
  }, []);

  const getValidSession = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) return null;

    const expiresAt = data.session.expires_at ? data.session.expires_at * 1000 : 0;
    const mustRefresh = !expiresAt || expiresAt - Date.now() < 60_000;

    if (!mustRefresh) return data.session;

    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error || !refreshed.data.session) {
      await supabase.auth.signOut();
      clearAuthHandoff();
      return null;
    }

    return refreshed.data.session;
  }, []);

  const validateAndRedirect = useCallback(
    async (message = "Sessao encontrada. Abrindo destino...") => {
      if (hasRecoveryMarker || redirectingRef.current) return;

      try {
        const session = await getValidSession();
        if (!session) {
          setHasActiveSession(false);
          setFeedback((current) => current || "");
          return;
        }

        setHasActiveSession(true);
        clearAuthHandoff();
        setFeedback(message);
        goTo(destinationPath);
      } catch (error) {
        console.error("[login] sessao invalida", error);
        await supabase.auth.signOut();
        clearAuthHandoff();
        setHasActiveSession(false);
        setFeedback("Sua sessao antiga expirou. Entre novamente para continuar.");
      }
    },
    [destinationPath, getValidSession, goTo, hasRecoveryMarker],
  );

  useEffect(() => {
    let active = true;

    if (hasRecoveryMarker) {
      setMode("recovery");
      setFeedback("Abra o link recebido e escolha sua nova senha.");
    } else {
      void validateAndRedirect();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "PASSWORD_RECOVERY") {
        redirectingRef.current = false;
        setMode("recovery");
        setSending(false);
        setFeedback("Link de recuperacao validado. Agora defina sua nova senha.");
        return;
      }

      if (event === "SIGNED_OUT" || !session) {
        redirectingRef.current = false;
        setHasActiveSession(false);
        return;
      }

      if (!hasRecoveryMarker) {
        void validateAndRedirect("Login realizado. Abrindo destino...");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [hasRecoveryMarker, validateAndRedirect]);

  const signInWithPassword = async () => {
    if (!email.trim() || !password.trim()) {
      setFeedback("Preencha email e senha para entrar.");
      return;
    }

    setSending(true);
    setFeedback("");
    redirectingRef.current = false;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        clearAuthHandoff();
        setFeedback(humanizeAuthError(error.message));
        return;
      }

      if (!data.session) {
        clearAuthHandoff();
        setFeedback("O login foi aceito, mas nenhuma sessao foi retornada pelo Supabase.");
        return;
      }

      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });

      setHasActiveSession(true);
      setAuthHandoff();
      setFeedback("Login realizado. Abrindo destino...");
      goTo(destinationPath);
    } catch (error) {
      console.error("[login] erro inesperado no signIn", error);
      clearAuthHandoff();
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
          emailRedirectTo: `${window.location.origin}/login?next=${encodeURIComponent(destinationPath)}`,
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
          emailRedirectTo: `${window.location.origin}/login?next=${encodeURIComponent(destinationPath)}`,
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
        redirectTo: `${window.location.origin}/login?type=recovery&next=${encodeURIComponent(destinationPath)}`,
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
      clearAuthHandoff();
      redirectingRef.current = false;
      setHasActiveSession(false);
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
    <PageLayout>
      <PageShell>
        <div className="min-h-screen flex items-center justify-center py-12 px-4">
          <Card glass className="w-full max-w-md">
            <CardContent className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full border border-aq-strong bg-aq-accent-soft">
                  <Shield size={16} className="text-aq-accent" />
                  <span className="text-xs font-bold uppercase tracking-wider text-aq-accent">
                    {hasActiveSession ? "Sessão Validada" : "Acesso Protegido"}
                  </span>
                </div>

                <H1 className="text-3xl mb-2">
                  {mode === "recovery" ? "Nova Senha" : "AetherQuest"}
                </H1>
                <Body className="text-aq-text-muted">
                  {mode === "recovery"
                    ? "Defina sua nova senha"
                    : mode === "signin"
                    ? "Bem-vindo de volta"
                    : "Crie sua conta"}
                </Body>
              </div>

              {/* Alerts */}
              {feedback && (
                <Alert
                  variant={
                    feedback.includes("erro") || feedback.includes("invalido")
                      ? "error"
                      : feedback.includes("sucesso") || feedback.includes("realizado")
                      ? "success"
                      : "info"
                  }
                  title={
                    feedback.includes("erro") || feedback.includes("invalido")
                      ? "Erro"
                      : "Info"
                  }
                  description={feedback}
                  className="mb-6"
                  onClose={() => setFeedback("")}
                />
              )}

              {/* Mode Toggle */}
              {mode !== "recovery" && (
                <div className="flex gap-2 mb-6">
                  <Button
                    variant={mode === "signin" ? "primary" : "secondary"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setMode("signin")}
                  >
                    Entrar
                  </Button>
                  <Button
                    variant={mode === "signup" ? "primary" : "secondary"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setMode("signup")}
                  >
                    Criar
                  </Button>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4 mb-6">
                {mode !== "recovery" && (
                  <Input
                    label="Email"
                    type="email"
                    icon={<Mail size={18} />}
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={sending}
                  />
                )}

                <Input
                  label={mode === "recovery" ? "Nova Senha" : "Senha"}
                  type="password"
                  icon={<KeyRound size={18} />}
                  placeholder={mode === "signin" ? "Sua senha" : "Crie uma senha"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={sending}
                />

                {mode !== "signin" && (
                  <Input
                    label="Confirmar Senha"
                    type="password"
                    icon={<KeyRound size={18} />}
                    placeholder="Confirme a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={sending}
                  />
                )}
              </div>

              {/* Primary Action */}
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                loading={sending}
                onClick={mode === "signin" ? signInWithPassword : mode === "signup" ? signUpWithPassword : redefinirSenha}
              >
                {sending
                  ? "Processando..."
                  : mode === "signin"
                  ? "Entrar"
                  : mode === "signup"
                  ? "Criar Conta"
                  : "Salvar Senha"}
              </Button>

              {/* Secondary Actions */}
              {mode === "signin" && (
                <>
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full mt-3"
                    onClick={recuperarSenha}
                    disabled={sending}
                  >
                    Esqueci a Senha
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full mt-2"
                    onClick={enviarLinkMagico}
                    disabled={sending}
                  >
                    Usar Link Mágico
                  </Button>
                </>
              )}

              {mode === "recovery" && (
                <Button
                  variant="secondary"
                  size="md"
                  className="w-full mt-3"
                  onClick={() => setMode("signin")}
                  disabled={sending}
                >
                  Voltar ao Login
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </PageShell>
    </PageLayout>
  );
}
