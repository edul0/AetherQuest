"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Cinzel, Inter } from "next/font/google";
import { ArrowLeft, Crosshair, Eye, KeyRound, Layers3, Link2, Menu, Plus, ScrollText, Sparkles, Trash2, Users, X } from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { FichaVTTSnapshot, SceneViewPreferences, Token } from "@/src/lib/types";
import { DEFAULT_SCENE_VIEW_PREFERENCES, normalizeScenePreferences } from "@/src/lib/vttScenePreferences";

const VTTCanvas = dynamic(() => import("@/src/components/vtt/VTTCanvas"), { ssr: false });
const SceneNav = dynamic(() => import("@/src/components/vtt/SceneNav"), { ssr: false });
const VTTControls = dynamic(() => import("@/src/components/vtt/VTTControls"), { ssr: false });
const TokenPanel = dynamic(() => import("@/src/components/vtt/Tokenpanel"), { ssr: false });
const Chat = dynamic(() => import("@/src/components/vtt/Chat"), { ssr: false });

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

type MesaRole = "mestre" | "jogador" | null;

type Sala = {
  id: string;
  nome: string;
  user_id?: string | null;
};

type Cena = {
  id: string;
  sala_id: string;
  nome: string;
  mapa_url?: string | null;
  grid_size?: number | null;
  grid_opacity?: number | null;
  show_grid?: boolean | null;
  map_scale?: number | null;
  map_offset_x?: number | null;
  map_offset_y?: number | null;
  snap_to_grid?: boolean | null;
};

type FichaListItem = {
  id: string;
  nome_personagem: string;
  sistema_preset: string;
};

type MesaClientProps = {
  inviteCode?: string;
};

function roomCode(id: string) {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function normalizeCode(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function findSalaByCode(salas: Sala[], value: string) {
  const code = normalizeCode(value);
  if (!code) return null;
  return salas.find((sala) => sala.id.replace(/-/g, "").toUpperCase() === code || roomCode(sala.id) === code) ?? null;
}

function errorMessage(error: unknown) {
  return error && typeof error === "object" && "message" in error ? String((error as { message?: string }).message) : "";
}

function isJwtExpired(error: unknown) {
  const message = errorMessage(error).toLowerCase();
  return message.includes("jwt expired") || message.includes("token has expired") || message.includes("refresh token");
}

function sceneToPreferences(cena: Cena | null, current: SceneViewPreferences): SceneViewPreferences {
  return normalizeScenePreferences({
    ...current,
    gridSize: cena?.grid_size ?? DEFAULT_SCENE_VIEW_PREFERENCES.gridSize,
    gridOpacity: cena?.grid_opacity ?? DEFAULT_SCENE_VIEW_PREFERENCES.gridOpacity,
    showGrid: cena?.show_grid ?? DEFAULT_SCENE_VIEW_PREFERENCES.showGrid,
    mapScale: cena?.map_scale ?? DEFAULT_SCENE_VIEW_PREFERENCES.mapScale,
    mapOffsetX: cena?.map_offset_x ?? DEFAULT_SCENE_VIEW_PREFERENCES.mapOffsetX,
    mapOffsetY: cena?.map_offset_y ?? DEFAULT_SCENE_VIEW_PREFERENCES.mapOffsetY,
    snapToGrid: cena?.snap_to_grid ?? DEFAULT_SCENE_VIEW_PREFERENCES.snapToGrid,
    toolMode: current.toolMode,
  });
}

function scenePatch(preferences: SceneViewPreferences) {
  return {
    grid_size: preferences.gridSize,
    grid_opacity: preferences.gridOpacity,
    show_grid: preferences.showGrid,
    map_scale: preferences.mapScale,
    map_offset_x: preferences.mapOffsetX,
    map_offset_y: preferences.mapOffsetY,
    snap_to_grid: preferences.snapToGrid,
  };
}

export default function MesaClient({ inviteCode }: MesaClientProps) {
  const router = useRouter();
  const [salas, setSalas] = useState<Sala[]>([]);
  const [cenas, setCenas] = useState<Cena[]>([]);
  const [fichas, setFichas] = useState<FichaListItem[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [role, setRole] = useState<MesaRole>(inviteCode ? "jogador" : null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [salaAtiva, setSalaAtiva] = useState<Sala | null>(null);
  const [cenaAtiva, setCenaAtiva] = useState<Cena | null>(null);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [fichasMap, setFichasMap] = useState<Record<string, FichaVTTSnapshot>>({});
  const [scenePreferences, setScenePreferences] = useState<SceneViewPreferences>(DEFAULT_SCENE_VIEW_PREFERENCES);
  const [joinCode, setJoinCode] = useState(inviteCode ?? "");
  const [joinError, setJoinError] = useState("");
  const [joinedAsPlayer, setJoinedAsPlayer] = useState(false);
  const [shellOpen, setShellOpen] = useState(true);
  const [fichaParaTokenId, setFichaParaTokenId] = useState("");
  const [fichaEscolhidaId, setFichaEscolhidaId] = useState("");
  const [tokenLabel, setTokenLabel] = useState("");
  const [roomNameDraft, setRoomNameDraft] = useState("");
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [mesaError, setMesaError] = useState("");
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPersistedRef = useRef("");

  const activeMesa = Boolean(role && salaAtiva && cenaAtiva && (role === "mestre" || joinedAsPlayer));
  const fichaSelecionada = selectedToken?.ficha_id ? fichasMap[selectedToken.ficha_id] ?? null : null;
  const fichaHref = (fichaId: string) => `/fichas/${fichaId}${salaAtiva?.id ? `?mesa=${encodeURIComponent(salaAtiva.id)}` : ""}`;

  const roster = useMemo(() => {
    return tokens
      .filter((token) => token.ficha_id)
      .map((token) => {
        const ficha = token.ficha_id ? fichasMap[token.ficha_id] : null;
        return { token, ficha, vida: ficha?.dados?.status?.vida, pe: ficha?.dados?.status?.pe, sanidade: ficha?.dados?.status?.sanidade };
      });
  }, [fichasMap, tokens]);

  const ensureSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) throw new Error("NO_SESSION");

    const expiresAt = data.session.expires_at ? data.session.expires_at * 1000 : 0;
    if (!expiresAt || expiresAt - Date.now() < 60_000) {
      const refreshed = await supabase.auth.refreshSession();
      if (refreshed.error || !refreshed.data.session) throw refreshed.error ?? new Error("NO_SESSION");
      setHasSession(true);
      return refreshed.data.session;
    }

    setHasSession(true);
    return data.session;
  };

  const runFresh = async <T,>(action: () => Promise<{ data?: T | null; error?: { message?: string } | null }>) => {
    await ensureSession();
    const result = await action();
    if (!result.error || !isJwtExpired(result.error)) return result;
    await ensureSession();
    return action();
  };

  const redirectLogin = () => {
    setHasSession(false);
    router.replace(`/login?next=${encodeURIComponent("/mesa")}`);
  };

  const ensureMembership = async (salaId: string, memberRole: "mestre" | "jogador") => {
    try {
      const { error } = await runFresh(() => supabase.from("sala_membros").upsert([{ sala_id: salaId, role: memberRole }], { onConflict: "sala_id,user_id" }));
      if (error) console.warn("[MesaClient] sala_membros:", error.message);
    } catch (error) {
      console.warn("[MesaClient] sala_membros indisponivel:", error);
    }
  };

  const claimSalaIfNeeded = async (sala: Sala | null) => {
    if (!sala?.id || sala.user_id) return sala;

    try {
      const session = await ensureSession();
      const { data, error } = await runFresh<Sala>(() =>
        supabase.from("salas").update({ user_id: session.user.id }).eq("id", sala.id).is("user_id", null).select().single(),
      );
      if (error || !data) return sala;
      const claimed = data as Sala;
      setSalaAtiva(claimed);
      setSalas((current) => current.map((entry) => (entry.id === claimed.id ? claimed : entry)));
      void ensureMembership(claimed.id, "mestre");
      return claimed;
    } catch (error) {
      console.warn("[MesaClient] nao foi possivel assumir sala antiga:", error);
      return sala;
    }
  };

  const loadSalas = async () => {
    try {
      const { data, error } = await runFresh<Sala[]>(() => supabase.from("salas").select("*"));
      if (error) throw error;
      setMesaError("");
      setSalas((data ?? []) as Sala[]);
    } catch (error) {
      console.error("Erro ao carregar salas:", error);
      setMesaError(errorMessage(error) || "Nao foi possivel carregar as sessoes.");
      if (isJwtExpired(error)) redirectLogin();
    } finally {
      setLoading(false);
    }
  };

  const loadFichas = async () => {
    try {
      const { data, error } = await runFresh<FichaListItem[]>(() => supabase.from("fichas").select("id, nome_personagem, sistema_preset").order("nome_personagem"));
      if (error) throw error;
      setFichas((data ?? []) as FichaListItem[]);
    } catch (error) {
      console.error("Erro ao carregar fichas:", error);
      if (isJwtExpired(error)) redirectLogin();
    }
  };

  const loadCenas = async (salaId: string) => {
    try {
      const { data, error } = await runFresh<Cena[]>(() => supabase.from("cenas").select("*").eq("sala_id", salaId));
      if (error) throw error;
      const next = (data ?? []) as Cena[];
      setMesaError("");
      setCenas(next);
      setCenaAtiva((current) => (current && next.some((cena) => cena.id === current.id) ? next.find((cena) => cena.id === current.id) ?? null : next[0] ?? null));
    } catch (error) {
      console.error("Erro ao carregar cenas:", error);
      setMesaError(errorMessage(error) || "Nao foi possivel carregar cenas desta sessao.");
      if (isJwtExpired(error)) redirectLogin();
    }
  };

  const persistScenePreferences = (preferences: SceneViewPreferences) => {
    if (!cenaAtiva?.id || role !== "mestre") return;
    const patch = scenePatch(preferences);
    const signature = JSON.stringify(patch);
    if (signature === lastPersistedRef.current) return;
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);

    persistTimerRef.current = setTimeout(async () => {
      lastPersistedRef.current = signature;
      const { error } = await runFresh(() => supabase.from("cenas").update(patch).eq("id", cenaAtiva.id));
      if (error) console.error("Erro ao sincronizar mapa da cena:", error);
    }, 140);
  };

  const updateScenePreferences = (patch: Partial<SceneViewPreferences>) => {
    setScenePreferences((current) => {
      const next = normalizeScenePreferences({ ...current, ...patch });
      persistScenePreferences(next);
      return next;
    });
  };

  useEffect(() => {
    let active = true;
    void ensureSession()
      .then(() => {
        if (!active) return;
        setAuthReady(true);
        setLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        setHasSession(false);
        setAuthReady(true);
        setLoading(false);
        if (isJwtExpired(error)) redirectLogin();
      });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session));
      setAuthReady(true);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!authReady || !hasSession) return;

    void loadSalas();
    void loadFichas();
    const channel = supabase.channel("salas_realtime").on("postgres_changes", { event: "*", schema: "public", table: "salas" }, () => void loadSalas()).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [authReady, hasSession]);

  useEffect(() => {
    if (role === "mestre" && !salaAtiva && salas.length) setSalaAtiva(salas[0]);
  }, [role, salaAtiva, salas]);

  useEffect(() => {
    if (!inviteCode || !salas.length || joinedAsPlayer) return;
    const matched = findSalaByCode(salas, inviteCode);
    if (!matched) return;
    setRole("jogador");
    setSalaAtiva(matched);
    setJoinedAsPlayer(true);
    void ensureMembership(matched.id, "jogador");
  }, [inviteCode, joinedAsPlayer, salas]);

  useEffect(() => {
    if (!salaAtiva?.id || !hasSession) {
      setCenas([]);
      setCenaAtiva(null);
      return;
    }

    if (role === "mestre" && !salaAtiva.user_id) {
      void claimSalaIfNeeded(salaAtiva).then((claimed) => claimed?.id && void loadCenas(claimed.id));
    } else {
      void loadCenas(salaAtiva.id);
    }

    const channel = supabase
      .channel(`mesa_cenas_${salaAtiva.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cenas", filter: `sala_id=eq.${salaAtiva.id}` }, () => void loadCenas(salaAtiva.id))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salaAtiva?.id, salaAtiva?.user_id, role, hasSession]);

  useEffect(() => {
    setScenePreferences((current) => {
      const next = sceneToPreferences(cenaAtiva, current);
      lastPersistedRef.current = cenaAtiva ? JSON.stringify(scenePatch(next)) : "";
      return next;
    });
  }, [cenaAtiva?.id, cenaAtiva?.grid_size, cenaAtiva?.grid_opacity, cenaAtiva?.show_grid, cenaAtiva?.map_scale, cenaAtiva?.map_offset_x, cenaAtiva?.map_offset_y, cenaAtiva?.snap_to_grid]);

  useEffect(() => setRoomNameDraft(salaAtiva?.nome ?? ""), [salaAtiva?.id, salaAtiva?.nome]);
  useEffect(() => setShellOpen(!activeMesa), [activeMesa]);

  useEffect(() => {
    const handleMapOffset = (event: Event) => {
      const detail = (event as CustomEvent<{ x: number; y: number }>).detail;
      if (!detail) return;
      updateScenePreferences({ mapOffsetX: detail.x, mapOffsetY: detail.y });
    };
    window.addEventListener("aq-map-offset", handleMapOffset as EventListener);
    return () => window.removeEventListener("aq-map-offset", handleMapOffset as EventListener);
  }, [cenaAtiva?.id, role, scenePreferences.toolMode]);

  const criarSala = async () => {
    try {
      const session = await ensureSession();
      const nome = `Sessao ${salas.length + 1}`;
      const { data, error } = await runFresh<Sala>(() => supabase.from("salas").insert([{ nome, user_id: session.user.id }]).select().single());
      if (error || !data) throw error ?? new Error("Falha ao criar sala.");
      setRole("mestre");
      setSalaAtiva(data as Sala);
      setSalas((current) => [data as Sala, ...current]);
      void ensureMembership((data as Sala).id, "mestre");
    } catch (error: any) {
      if (errorMessage(error) === "NO_SESSION") {
        redirectLogin();
        return;
      }
      alert(`Falha ao criar sala: ${error?.message ?? "sessao invalida"}`);
      if (isJwtExpired(error)) redirectLogin();
    }
  };

  const renomearSala = async () => {
    if (!salaAtiva?.id || !roomNameDraft.trim()) return;
    const activeSala = await claimSalaIfNeeded(salaAtiva);
    const { data, error } = await runFresh<Sala>(() => supabase.from("salas").update({ nome: roomNameDraft.trim() }).eq("id", activeSala?.id ?? salaAtiva.id).select().single());
    if (error || !data) {
      alert(`Falha ao renomear sessao: ${error?.message ?? "erro desconhecido"}`);
      return;
    }
    setSalaAtiva(data as Sala);
    setSalas((current) => current.map((sala) => (sala.id === data.id ? (data as Sala) : sala)));
  };

  const excluirSala = async (sala: Sala) => {
    const confirmar = window.confirm(`Excluir a sessao "${sala.nome}"? Cenas e tokens dessa sessao tambem serao removidos.`);
    if (!confirmar) return;

    await runFresh(() => supabase.from("tokens").delete().eq("sala", sala.id));
    await runFresh(() => supabase.from("cenas").delete().eq("sala_id", sala.id));
    await runFresh(() => supabase.from("sala_membros").delete().eq("sala_id", sala.id)).catch(() => ({ data: null, error: null }));

    const { error } = await runFresh(() => supabase.from("salas").delete().eq("id", sala.id));
    if (error) {
      alert(`Falha ao excluir sessao: ${error.message}`);
      return;
    }

    setSalas((current) => current.filter((entry) => entry.id !== sala.id));
    if (salaAtiva?.id === sala.id) {
      setSalaAtiva(null);
      setCenaAtiva(null);
      setCenas([]);
      setTokens([]);
      setSelectedToken(null);
      setRoomNameDraft("");
    }
  };

  const criarCena = async () => {
    if (!salaAtiva?.id) return;
    const activeSala = await claimSalaIfNeeded(salaAtiva);
    const { data, error } = await runFresh<Cena>(() =>
      supabase.from("cenas").insert([{ sala_id: activeSala?.id ?? salaAtiva.id, nome: `Setor ${cenas.length + 1}`, ...scenePatch(DEFAULT_SCENE_VIEW_PREFERENCES) }]).select().single(),
    );
    if (error || !data) {
      alert(`Falha ao criar cena: ${error?.message ?? "erro desconhecido"}`);
      return;
    }
    setCenaAtiva(data as Cena);
    setCenas((current) => [...current, data as Cena]);
  };

  const criarTokenDaFicha = async () => {
    if (!salaAtiva?.id || !cenaAtiva?.id || !fichaParaTokenId) return;
    const ficha = fichas.find((entry) => entry.id === fichaParaTokenId);
    if (!ficha) return;
    const nome = tokenLabel.trim() || ficha.nome_personagem || "Entidade";
    const { error } = await runFresh(() =>
      supabase.from("tokens").insert([{ cena_id: cenaAtiva.id, sala: salaAtiva.id, ficha_id: ficha.id, nome, x: 100 + tokens.length * 70, y: 100 + tokens.length * 70, cor: "#4ad9d9" }]),
    );
    if (error) {
      alert(`Falha ao criar token: ${error.message}`);
      return;
    }
    await runFresh(() => supabase.from("fichas").update({ sala_id: salaAtiva.id }).eq("id", ficha.id));
    setFichaParaTokenId("");
    setTokenLabel("");
  };

  const entrarComoJogador = async () => {
    if (!hasSession) {
      router.push(`/login?next=${encodeURIComponent(`/mesa?convite=${normalizeCode(joinCode)}`)}`);
      return;
    }
    const matched = findSalaByCode(salas, joinCode);
    if (!matched) {
      setJoinError("Nao encontramos uma sala com esse codigo.");
      return;
    }
    setJoinError("");
    setRole("jogador");
    setSalaAtiva(matched);
    setJoinedAsPlayer(true);
    void ensureMembership(matched.id, "jogador");
  };

  const vincularFichaComoJogador = async () => {
    if (!salaAtiva?.id || !fichaEscolhidaId) return;
    void ensureMembership(salaAtiva.id, "jogador");
    const { error } = await runFresh(() => supabase.from("fichas").update({ sala_id: salaAtiva.id }).eq("id", fichaEscolhidaId));
    if (error) console.warn("Nao foi possivel vincular ficha a sala:", error.message);
    const token = tokens.find((entry) => entry.ficha_id === fichaEscolhidaId);
    if (token) {
      setSelectedToken(token);
      setShellOpen(false);
    }
  };

  const copyInvite = async () => {
    if (!salaAtiva?.id) return;
    const link = `${window.location.origin}/mesa?convite=${roomCode(salaAtiva.id)}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedInvite(true);
      window.setTimeout(() => setCopiedInvite(false), 1600);
    } catch {
      alert(link);
    }
  };

  const sair = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return <main className="aq-page flex items-center justify-center"><div className="animate-pulse font-mono text-xs uppercase tracking-[0.35em] text-[var(--aq-accent)]">Inicializando mesa...</div></main>;
  }

  return (
    <main className={`aq-page overflow-x-hidden ${inter.className}`}>
      {activeMesa && cenaAtiva && salaAtiva ? (
        <>
          <VTTCanvas cenaId={cenaAtiva.id} mapaUrl={cenaAtiva.mapa_url ?? undefined} selectedTokenId={selectedToken?.id ?? null} onSelectToken={setSelectedToken} onFichasMapChange={setFichasMap} onTokensChange={setTokens} scenePreferences={scenePreferences} />
          <SceneNav salaId={salaAtiva.id} onSelectCena={setCenaAtiva} cenaAtivaId={cenaAtiva.id} />
          {role === "mestre" ? <VTTControls cenaId={cenaAtiva.id} salaId={salaAtiva.id} preferences={scenePreferences} onPreferencesChange={updateScenePreferences} /> : null}
          <TokenPanel token={selectedToken} fichaData={fichaSelecionada} salaId={salaAtiva.id} onClose={() => setSelectedToken(null)} onTokenUpdate={setSelectedToken} />
          <Chat salaId={salaAtiva.id} />
        </>
      ) : null}

      {activeMesa ? (
        <div className="fixed inset-x-3 top-3 z-50 flex items-center justify-between gap-2">
          <button onClick={() => router.push("/")} className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--aq-border)] bg-[rgba(5,10,16,0.88)] text-[var(--aq-title)] backdrop-blur-md" aria-label="Voltar"><ArrowLeft size={17} /></button>
          <div className="rounded-full border border-[var(--aq-border-strong)] bg-[rgba(5,10,16,0.88)] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--aq-accent)] backdrop-blur-md">{role === "mestre" ? "Mesa do Mestre" : "Mesa do Jogador"}</div>
          <button onClick={() => setShellOpen((current) => !current)} className="flex h-11 min-w-[88px] items-center justify-center gap-2 rounded-full border border-[var(--aq-border-strong)] bg-[rgba(5,10,16,0.88)] px-3 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--aq-title)] backdrop-blur-md">{shellOpen ? <X size={16} /> : <Menu size={16} />}{shellOpen ? "Fechar" : "Mesa"}</button>
        </div>
      ) : null}

      {activeMesa && shellOpen ? <button className="fixed inset-0 z-40 bg-[rgba(0,0,0,0.28)]" onClick={() => setShellOpen(false)} aria-label="Fechar painel" /> : null}

      <div className={activeMesa ? `${shellOpen ? "block" : "hidden"} fixed inset-x-3 top-20 bottom-6 z-50 md:inset-x-auto md:left-6 md:top-20 md:w-[390px]` : "relative z-20 mx-auto mt-24 w-full max-w-[680px] px-3 pb-10 md:px-0"}>
        <div className={activeMesa ? "aq-scrollbar pointer-events-auto h-full overflow-y-auto aq-panel p-5" : "aq-panel pointer-events-auto p-5 md:p-6"}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="aq-kicker">Bridge Deck</div>
              <h1 className={`${cinzel.className} mt-2 text-3xl font-black tracking-[0.08em] text-[var(--aq-title)] md:text-4xl`}>Mesa Tatica</h1>
              <p className="mt-3 text-sm leading-relaxed text-[var(--aq-text-muted)]">Mapa, tokens e alinhamento ficam online na cena. A camera continua individual para cada tela.</p>
            </div>
          </div>

          {mesaError ? <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{mesaError}</div> : null}
          {!hasSession && authReady ? <div className="mt-4 rounded-2xl border border-[var(--aq-border)] bg-[rgba(74,217,217,0.08)] px-4 py-3 text-sm text-[var(--aq-text)]">Entre com login para carregar sessoes da mesa.</div> : null}

          <div className="mt-6 flex flex-wrap gap-2">
            <button onClick={() => { setRole("mestre"); setJoinedAsPlayer(false); }} className={role === "mestre" ? "aq-button-primary" : "aq-button-secondary"}><Eye size={14} /> Mestre</button>
            <button onClick={() => setRole("jogador")} className={role === "jogador" ? "aq-button-primary" : "aq-button-secondary"}><Users size={14} /> Jogador</button>
            {activeMesa ? <button onClick={sair} disabled={signingOut} className="aq-button-secondary ml-auto"><X size={14} />{signingOut ? "Saindo" : "Sair"}</button> : null}
          </div>

          {role === "mestre" ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-4">
                <div className="flex items-center justify-between gap-3"><div><div className="aq-kicker">Sessoes</div><p className="mt-2 text-sm text-[var(--aq-text-muted)]">Crie ou escolha uma sessao. Cada uma gera um codigo curto.</p></div><button onClick={criarSala} className="aq-button-primary"><Plus size={14} /> Nova sessao</button></div>
                <div className="mt-4 grid gap-2">{salas.map((sala) => <div key={sala.id} className={`flex items-center gap-2 rounded-2xl border px-2 py-2 ${salaAtiva?.id === sala.id ? "border-[var(--aq-border-strong)] bg-[rgba(74,217,217,0.1)]" : "border-[var(--aq-border)] bg-[rgba(5,10,16,0.54)]"}`}><button onClick={() => setSalaAtiva(sala)} className="min-w-0 flex-1 text-left"><div className="truncate text-[11px] font-black uppercase tracking-[0.16em] text-[var(--aq-title)]">{sala.nome}</div><div className="mt-1 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[var(--aq-accent)]">{roomCode(sala.id)}</div></button><button onClick={() => setSalaAtiva(sala)} className="rounded-full border border-[var(--aq-border)] px-3 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-[var(--aq-text-muted)]">Editar</button><button onClick={() => void excluirSala(sala)} className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-200 transition hover:bg-red-500/20" aria-label={`Excluir ${sala.nome}`}><Trash2 size={13} /></button></div>)}</div>
              </div>

              {salaAtiva ? <div className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-4"><div className="flex items-center justify-between gap-3"><div className="aq-kicker">Sessao ativa</div><button onClick={() => void excluirSala(salaAtiva)} className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-red-200 transition hover:bg-red-500/20"><Trash2 size={13} /> Excluir</button></div><input value={roomNameDraft} onChange={(event) => setRoomNameDraft(event.target.value)} className="aq-input mt-3" placeholder="Nome da sessao" /><div className="mt-3 rounded-2xl border border-[var(--aq-border)] px-4 py-3"><div className="text-[10px] uppercase tracking-[0.18em] text-[var(--aq-text-muted)]">Codigo da sala</div><div className="mt-2 text-2xl font-black text-[var(--aq-title)]">{roomCode(salaAtiva.id)}</div></div><div className="mt-3 flex flex-wrap gap-3"><button onClick={renomearSala} className="aq-button-secondary"><ScrollText size={14} /> Salvar nome</button><button onClick={copyInvite} className="aq-button-secondary"><Link2 size={14} /> {copiedInvite ? "Copiado" : "Copiar link"}</button></div></div> : null}

              <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-[var(--aq-border)] p-4"><Layers3 className="text-[var(--aq-accent)]" size={16} /><div className="mt-2 text-2xl font-black">{cenas.length}</div><div className="aq-kicker mt-1">Cenas</div></div><div className="rounded-2xl border border-[var(--aq-border)] p-4"><Crosshair className="text-[var(--aq-accent)]" size={16} /><div className="mt-2 text-2xl font-black">{tokens.length}</div><div className="aq-kicker mt-1">Tokens</div></div><div className="rounded-2xl border border-[var(--aq-border)] p-4"><Sparkles className="text-[var(--aq-accent)]" size={16} /><div className="mt-2 text-sm font-black">{cenaAtiva?.mapa_url ? "Online" : "Sem mapa"}</div><div className="aq-kicker mt-1">Mapa</div></div></div>

              <button onClick={criarCena} disabled={!salaAtiva} className="aq-button-primary"><Plus size={14} /> Nova cena</button>

              <div className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-4"><div className="aq-kicker">Controle do Mestre</div><p className="mt-2 text-sm text-[var(--aq-text-muted)]">Vincule ficha a token. O mestre pode abrir a ficha pelo roster quando o SQL de permissao estiver aplicado.</p><select value={fichaParaTokenId} onChange={(event) => setFichaParaTokenId(event.target.value)} className="aq-input mt-4"><option value="">Escolha uma ficha</option>{fichas.map((ficha) => <option key={ficha.id} value={ficha.id}>{ficha.nome_personagem} | {ficha.sistema_preset}</option>)}</select><input value={tokenLabel} onChange={(event) => setTokenLabel(event.target.value)} className="aq-input mt-3" placeholder="Nome no mapa" /><button onClick={criarTokenDaFicha} disabled={!fichaParaTokenId || !cenaAtiva} className="aq-button-primary mt-3 w-full justify-center disabled:opacity-50"><Plus size={14} /> Colocar ficha na cena</button></div>
            </div>
          ) : null}

          {role === "jogador" ? (
            <div className="mt-6 space-y-4"><div className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-4"><div className="aq-kicker">Entrar na sessao</div><p className="mt-2 text-sm text-[var(--aq-text-muted)]">Digite o codigo curto que o mestre compartilhou.</p><div className="mt-4 flex items-center gap-2 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] px-4 py-3"><KeyRound size={16} className="text-[var(--aq-accent)]" /><input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="Codigo" className="w-full bg-transparent text-sm text-[var(--aq-title)] outline-none" /></div><button onClick={entrarComoJogador} className="aq-button-primary mt-4 w-full justify-center"><Users size={14} /> Entrar</button>{joinError ? <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{joinError}</div> : null}</div>{joinedAsPlayer ? <div className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-4"><div className="aq-kicker">Escolher ficha</div><select value={fichaEscolhidaId} onChange={(event) => setFichaEscolhidaId(event.target.value)} className="aq-input mt-3"><option value="">Selecione uma ficha</option>{fichas.map((ficha) => <option key={ficha.id} value={ficha.id}>{ficha.nome_personagem} | {ficha.sistema_preset}</option>)}</select><div className="mt-3 flex flex-wrap gap-3"><button onClick={vincularFichaComoJogador} disabled={!fichaEscolhidaId} className="aq-button-primary">Entrar com ficha</button>{fichaEscolhidaId ? <button onClick={() => router.push(fichaHref(fichaEscolhidaId))} className="aq-button-secondary">Abrir ficha</button> : null}</div></div> : null}</div>
          ) : null}
        </div>
      </div>

      {!activeMesa ? <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1500px] items-center justify-center px-4 pb-20 pt-10"><div className="aq-panel w-full max-w-3xl p-8 text-center"><div className="aq-kicker">No Signal</div><h2 className={`${cinzel.className} mt-3 text-4xl font-black tracking-[0.08em] text-[var(--aq-title)] md:text-5xl`}>{role === "mestre" ? (salaAtiva ? "Crie a primeira cena" : "Nenhuma sessao ativa") : "Escolha como entrar"}</h2><p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[var(--aq-text-muted)]">Mestre cria uma sessao e jogador entra com codigo. O mapa fica online e sincronizado pela cena.</p>{role === "mestre" ? <button onClick={salaAtiva ? criarCena : criarSala} className="aq-button-primary mt-8 justify-center"><Plus size={14} />{salaAtiva ? "Criar primeira cena" : "Criar primeira sessao"}</button> : null}</div></div> : null}

      {activeMesa && roster.length > 0 ? <div className="fixed bottom-3 left-3 right-3 z-40 rounded-[24px] border border-[rgba(74,217,217,0.16)] bg-[rgba(5,10,16,0.82)] px-2 py-1.5 shadow-[0_18px_46px_rgba(0,0,0,0.38)] backdrop-blur-xl md:bottom-4 md:left-4 md:right-auto md:w-[520px]"><div className="aq-scrollbar flex w-full gap-2 overflow-x-auto pb-1">{roster.map(({ token, ficha, vida, pe, sanidade }) => { const initials = (ficha?.nome_personagem ?? token.nome).slice(0, 2).toUpperCase(); const hp = vida?.max ? Math.max(0, Math.min(1, vida.atual / vida.max)) : 0; return <button key={token.id} onClick={() => setSelectedToken(token)} className={`min-w-[142px] rounded-2xl border px-2 py-2 text-left ${selectedToken?.id === token.id ? "border-[var(--aq-border-strong)] bg-[rgba(74,217,217,0.12)]" : "border-[var(--aq-border)] bg-[rgba(8,13,20,0.9)]"}`}><div className="flex items-center gap-2">{ficha?.avatar_url ? <img src={ficha.avatar_url} alt={ficha.nome_personagem} className="h-10 w-10 rounded-xl object-cover" /> : <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-black text-white" style={{ background: token.cor || "#4ad9d9" }}>{initials}</div>}<div className="min-w-0"><div className="truncate text-[11px] font-black uppercase tracking-[0.1em] text-[var(--aq-title)]">{ficha?.nome_personagem ?? token.nome}</div><div className="truncate text-[8px] uppercase tracking-[0.18em] text-[var(--aq-text-muted)]">{token.nome}</div></div></div><div className="mt-2 h-1.5 rounded-full bg-white/10"><div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-500 via-lime-400 to-red-500" style={{ width: `${hp * 100}%` }} /></div><div className="mt-1 text-[8px] uppercase tracking-[0.16em] text-[var(--aq-text-muted)]">VIDA {vida ? `${vida.atual}/${vida.max}` : "--"} {pe ? `PE ${pe.atual}/${pe.max}` : ""} {sanidade ? `SAN ${sanidade.atual}/${sanidade.max}` : ""}</div>{role === "mestre" && token.ficha_id ? <span onClick={(event) => { event.stopPropagation(); router.push(fichaHref(token.ficha_id!)); }} className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-full border border-[var(--aq-border)] px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-[var(--aq-text-muted)]"><ScrollText size={11} /> Ficha</span> : null}</button>; })}</div></div> : null}
    </main>
  );
}
