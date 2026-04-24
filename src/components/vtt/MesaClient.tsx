"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Cinzel, Inter } from "next/font/google";
import { Archive, ArrowLeft, Copy, Crosshair, Eye, KeyRound, Layers3, Menu, Pencil, Plus, ScrollText, Sparkles, Users, X } from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { FichaVTTSnapshot, Handout, SceneViewPreferences, Token } from "@/src/lib/types";
import { DEFAULT_SCENE_VIEW_PREFERENCES, normalizeScenePreferences } from "@/src/lib/vttScenePreferences";
import { PRESETS } from "@/src/lib/constants";
import { useHandoutsSync } from "@/src/hooks/useHandoutsSync";

const VTTCanvas = dynamic(() => import("@/src/components/vtt/VTTCanvas"), { ssr: false });
const SceneNav = dynamic(() => import("@/src/components/vtt/SceneNav"), { ssr: false });
const VTTControls = dynamic(() => import("@/src/components/vtt/VTTControls"), { ssr: false });
const TokenPanel = dynamic(() => import("@/src/components/vtt/Tokenpanel"), { ssr: false });
const Chat = dynamic(() => import("@/src/components/vtt/Chat"), { ssr: false });
const HandoutViewer = dynamic(() => import("@/src/components/vtt/HandoutViewer"), { ssr: false });

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

type MesaRole = "mestre" | "jogador" | null;

type Sala = {
  id: string;
  nome: string;
  user_id?: string | null;
  status?: string | null;
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
  user_id?: string | null;
  nome_personagem: string;
  sistema_preset: string;
};

type MesaClientProps = {
  inviteCode?: string;
};

type RecentSession = {
  id: string;
  nome_sala: string;
  codigo: string;
  ultimo_acesso: string;
};

const RECENT_SESSIONS_KEY = "aetherquest:recent-sessions";

function roomCode(id: string) {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function normalizeCode(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function findSalaByCode(salas: Sala[], value: string) {
  const code = normalizeCode(value);
  if (!code) return null;
  return salas.find((sala) => sala.status !== "arquivada" && (sala.id.replace(/-/g, "").toUpperCase() === code || roomCode(sala.id) === code)) ?? null;
}

function readRecentSessions() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SESSIONS_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as RecentSession[]).filter((session) => session?.id && session?.codigo).slice(0, 5);
  } catch {
    return [];
  }
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

const SHEIKAH_PANEL_STYLE = {
  clipPath: "polygon(16px 0, calc(100% - 18px) 0, 100% 18px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)",
} as const;

const SHEIKAH_CHIP_STYLE = {
  clipPath: "polygon(14px 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0 50%)",
} as const;

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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
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
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [selectedHandout, setSelectedHandout] = useState<Handout | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPersistedRef = useRef("");
  const handouts = useHandoutsSync(salaAtiva?.id, cenaAtiva?.id);
  const openHandoutById = useCallback(
    (handoutId: string) => {
      const found = handouts.find((entry) => entry.id === handoutId);
      if (found) setSelectedHandout(found);
    },
    [handouts],
  );

  const activeMesa = Boolean(role && salaAtiva && cenaAtiva && (role === "mestre" || joinedAsPlayer));
  const fichaSelecionada = selectedToken?.ficha_id ? fichasMap[selectedToken.ficha_id] ?? null : null;
  const fichaHref = (fichaId: string) => `/fichas/${fichaId}${salaAtiva?.id ? `?mesa=${encodeURIComponent(salaAtiva.id)}` : ""}`;
  const mesasDisponiveis = useMemo(() => salas.filter((sala) => sala.status !== "arquivada"), [salas]);
  const mesasNaoAtivas = useMemo(() => mesasDisponiveis.filter((sala) => sala.id !== salaAtiva?.id), [mesasDisponiveis, salaAtiva?.id]);

  const roster = useMemo(() => {
    return tokens
      .filter((token) => token.ficha_id)
      .map((token) => {
        const ficha = token.ficha_id ? fichasMap[token.ficha_id] : null;
        return { token, ficha, vida: ficha?.dados?.status?.vida, pe: ficha?.dados?.status?.pe, sanidade: ficha?.dados?.status?.sanidade };
      });
  }, [fichasMap, tokens]);

  const rememberRecentSession = (sala: Sala) => {
    const entry: RecentSession = {
      id: sala.id,
      nome_sala: sala.nome,
      codigo: roomCode(sala.id),
      ultimo_acesso: new Date().toISOString(),
    };
    const next = [entry, ...readRecentSessions().filter((session) => session.id !== sala.id)].slice(0, 5);
    window.localStorage.setItem(RECENT_SESSIONS_KEY, JSON.stringify(next));
    setRecentSessions(next);
  };

  const visibleRoster = useMemo(() => {
    if (role === "mestre") return roster;
    return roster.filter(({ token, ficha }) => {
      if (fichaEscolhidaId && token.ficha_id === fichaEscolhidaId) return true;
      if (currentUserId && ficha?.user_id === currentUserId) return true;
      return false;
    });
  }, [currentUserId, fichaEscolhidaId, role, roster]);

  const ensureSession = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) throw new Error("NO_SESSION");
    setCurrentUserId(data.session.user.id);

    const expiresAt = data.session.expires_at ? data.session.expires_at * 1000 : 0;
    if (!expiresAt || expiresAt - Date.now() < 60_000) {
      const refreshed = await supabase.auth.refreshSession();
      if (refreshed.error || !refreshed.data.session) throw refreshed.error ?? new Error("NO_SESSION");
      setHasSession(true);
      setCurrentUserId(refreshed.data.session.user.id);
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
      const { data, error } = await runFresh<FichaListItem[]>(() => supabase.from("fichas").select("id, user_id, nome_personagem, sistema_preset").order("nome_personagem"));
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

  const updateCenaMapaLocal = (url: string | null) => {
    const activeCenaId = cenaAtiva?.id;
    if (!activeCenaId) return;

    setCenaAtiva((current) => (current?.id === activeCenaId ? { ...current, mapa_url: url } : current));
    setCenas((current) => current.map((cena) => (cena.id === activeCenaId ? { ...cena, mapa_url: url } : cena)));
  };

  useEffect(() => {
    let active = true;
    setRecentSessions(readRecentSessions());
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
      setCurrentUserId(session?.user?.id ?? null);
      setAuthReady(true);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
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
    if (role === "mestre" && !salaAtiva && mesasDisponiveis.length) setSalaAtiva(mesasDisponiveis[0]);
  }, [role, salaAtiva, mesasDisponiveis]);

  useEffect(() => {
    if (!inviteCode || !salas.length || joinedAsPlayer) return;
    const matched = findSalaByCode(salas, inviteCode);
    if (!matched) return;
    setRole("jogador");
    setSalaAtiva(matched);
    setJoinedAsPlayer(true);
    rememberRecentSession(matched);
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
      const nome = `Sessão Ancestral ${salas.length + 1}`;
      const { data, error } = await runFresh<Sala>(() => supabase.from("salas").insert([{ nome, user_id: session.user.id }]).select().single());
      if (error || !data) throw error ?? new Error("Falha ao forjar sala.");
      setRole("mestre");
      setSalaAtiva(data as Sala);
      setSalas((current) => [data as Sala, ...current]);
      void ensureMembership((data as Sala).id, "mestre");
    } catch (error: any) {
      if (errorMessage(error) === "NO_SESSION") {
        redirectLogin();
        return;
      }
      alert(`Falha ao forjar sala: ${error?.message ?? "energia esgotada"}`);
      if (isJwtExpired(error)) redirectLogin();
    }
  };

  const renomearSala = async () => {
    if (!salaAtiva?.id || !roomNameDraft.trim()) return;
    const activeSala = await claimSalaIfNeeded(salaAtiva);
    const { data, error } = await runFresh<Sala>(() => supabase.from("salas").update({ nome: roomNameDraft.trim() }).eq("id", activeSala?.id ?? salaAtiva.id).select().single());
    if (error || !data) {
      alert(`Falha ao renomear: ${error?.message ?? "erro na inscrição"}`);
      return;
    }
    setSalaAtiva(data as Sala);
    setSalas((current) => current.map((sala) => (sala.id === data.id ? (data as Sala) : sala)));
  };

  const excluirSala = async (sala: Sala) => {
    const confirmar = window.confirm(`Desintegrar o reino "${sala.nome}"? Todas as memórias e entidades serão perdidas.`);
    if (!confirmar) return;

    await runFresh(() => supabase.from("tokens").delete().eq("sala", sala.id));
    await runFresh(() => supabase.from("cenas").delete().eq("sala_id", sala.id));
    await runFresh(() => supabase.from("sala_membros").delete().eq("sala_id", sala.id)).catch(() => ({ data: null, error: null }));

    const { error } = await runFresh(() => supabase.from("salas").delete().eq("id", sala.id));
    if (error) {
      alert(`Falha ao desintegrar reino: ${error.message}`);
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

  const finalizarSala = async (sala: Sala) => {
    const confirmar = window.confirm(`Selar a mesa "${sala.nome}"? Jogadores não entrarão mais por convite, mas as runas são preservadas.`);
    if (!confirmar) return;

    const { data, error } = await runFresh<Sala>(() => supabase.from("salas").update({ status: "arquivada" }).eq("id", sala.id).select().single());
    if (error || !data) {
      alert(`Falha ao selar mesa: ${error?.message ?? "coluna status ausente"}`);
      return;
    }

    const archived = data as Sala;
    setSalas((current) => current.map((entry) => (entry.id === archived.id ? archived : entry)));
    if (salaAtiva?.id === archived.id) {
      setSalaAtiva(null);
      setCenaAtiva(null);
      setCenas([]);
      setTokens([]);
      setSelectedToken(null);
      setRoomNameDraft("");
      setShellOpen(true);
    }
  };

  const criarCena = async () => {
    if (!salaAtiva?.id) return;
    const activeSala = await claimSalaIfNeeded(salaAtiva);
    const { data, error } = await runFresh<Cena>(() =>
      supabase.from("cenas").insert([{ sala_id: activeSala?.id ?? salaAtiva.id, nome: `Setor ${cenas.length + 1}`, ...scenePatch(DEFAULT_SCENE_VIEW_PREFERENCES) }]).select().single(),
    );
    if (error || !data) {
      alert(`Falha ao expandir local: ${error?.message ?? "erro no fluxo"}`);
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
      alert(`Falha ao invocar entidade: ${error.message}`);
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
      setJoinError("Essas runas não abriram nenhum portal.");
      return;
    }
    setJoinError("");
    setRole("jogador");
    setSalaAtiva(matched);
    setJoinedAsPlayer(true);
    rememberRecentSession(matched);
    void ensureMembership(matched.id, "jogador");
  };

  const vincularFichaComoJogador = async () => {
    if (!salaAtiva?.id || !cenaAtiva?.id || !fichaEscolhidaId) return;
    const ficha = fichas.find((entry) => entry.id === fichaEscolhidaId);
    if (!ficha) return;
    const { error } = await runFresh(() => supabase.from("fichas").update({ sala_id: salaAtiva.id }).eq("id", ficha.id));
    if (error) {
      alert(`Falha ao atar ficha à mesa: ${error.message}`);
      return;
    }

    const existing = tokens.find((token) => token.ficha_id === ficha.id);
    if (!existing) {
      const { error: tokenError } = await runFresh(() =>
        supabase.from("tokens").insert([
          {
            cena_id: cenaAtiva.id,
            sala: salaAtiva.id,
            ficha_id: ficha.id,
            nome: ficha.nome_personagem,
            x: 100 + tokens.length * 70,
            y: 100 + tokens.length * 70,
            cor: "#4ad9d9",
          },
        ]),
      );
      if (tokenError) {
        alert(`Ficha conectada, mas a entidade falhou ao surgir: ${tokenError.message}`);
      }
    }
  };

  const criarFichaJogadorRapida = async () => {
    try {
      const session = await ensureSession();
      const preset = PRESETS[0];
      const firstClass = preset.classes?.[0] ?? null;
      const firstPath = firstClass?.paths?.[0] ?? null;
      const firstOrigin = preset.origins?.[0] ?? null;
      const firstRace = preset.races?.[0] ?? null;
      const progressValue = preset.level?.min ?? preset.nex?.min ?? 0;
      const payload = {
        user_id: session.user.id,
        nome_personagem: "Novo Personagem",
        sistema_preset: preset.id,
        dados: {
          presetId: preset.id,
          nex: progressValue,
          classe: firstClass?.nome ?? "",
          classe_custom: "",
          trilha: firstPath?.nome ?? "",
          trilha_custom: "",
          origem: firstOrigin?.nome ?? "",
          origem_custom: "",
          raca: firstRace?.nome ?? "",
          raca_custom: "",
          deslocamento: firstRace?.deslocamento ?? "9m",
          idade: "",
          altura: "",
          gostos: "",
          avatar_url: "",
          token_images: { portrait: "", top: "", side: "" },
          atributos: { forca: 1, agilidade: 1, destreza: 1, vigor: 1, intelecto: 1, presenca: 1, sabedoria: 1, carisma: 1 },
          rolagens_status: Object.fromEntries((preset.statusRolls ?? []).map((entry) => [entry.key, 0])),
          status: {
            vida: { atual: 10, max: 10 },
            sanidade: { atual: 10, max: 10 },
            pe: { atual: 10, max: 10 },
          },
          habilidades: [],
          armas: [],
          pericias: {},
          defesa: { passiva: 10, bloqueio: 0, esquiva: 0 },
        },
      };
      const { data, error } = await runFresh<FichaListItem>(() => supabase.from("fichas").insert([payload]).select("id, user_id, nome_personagem, sistema_preset").single());
      if (error || !data) throw error ?? new Error("Falha na criação.");
      setFichas((current) => [data as FichaListItem, ...current]);
      setFichaEscolhidaId((data as FichaListItem).id);
    } catch (error: any) {
      alert(`Falha ao forjar ficha: ${error?.message ?? "energia corrompida"}`);
      if (isJwtExpired(error)) redirectLogin();
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
    return <main className="aq-page flex items-center justify-center"><div className="animate-pulse font-mono text-sm uppercase tracking-[0.3em] text-[var(--aq-accent)]">Sincronizando Artefatos...</div></main>;
  }

  return (
    <main className={`aq-page overflow-x-hidden ${inter.className}`}>
      {activeMesa && cenaAtiva && salaAtiva ? (
        <>
          <VTTCanvas cenaId={cenaAtiva.id} mapaUrl={cenaAtiva.mapa_url ?? undefined} selectedTokenId={selectedToken?.id ?? null} onSelectToken={setSelectedToken} onFichasMapChange={setFichasMap} onTokensChange={setTokens} scenePreferences={scenePreferences} />
          <SceneNav salaId={salaAtiva.id} onSelectCena={setCenaAtiva} cenaAtivaId={cenaAtiva.id} />
          {role === "mestre" ? <VTTControls cenaId={cenaAtiva.id} salaId={salaAtiva.id} preferences={scenePreferences} onPreferencesChange={updateScenePreferences} onMapUrlChange={updateCenaMapaLocal} /> : null}
          <TokenPanel token={selectedToken} fichaData={fichaSelecionada} salaId={salaAtiva.id} onClose={() => setSelectedToken(null)} onTokenUpdate={setSelectedToken} />
          <HandoutViewer handout={selectedHandout} onClose={() => setSelectedHandout(null)} />
          <Chat salaId={salaAtiva.id} />
        </>
      ) : null}

      {/* Botões Flutuantes Superiores (Retorno e Menu) */}
      {activeMesa ? (
        <div className="fixed inset-x-3 top-3 z-50 flex items-center justify-between gap-2">
          <button onClick={() => router.push("/")} className="flex h-11 w-11 items-center justify-center border border-[var(--aq-border)] bg-[var(--aq-surface-soft)] text-[var(--aq-title)] backdrop-blur-md hover:border-[var(--aq-accent)] hover:text-[var(--aq-accent)] transition-colors" style={SHEIKAH_CHIP_STYLE} aria-label="Voltar"><ArrowLeft size={18} /></button>
          
          <div className="border border-[var(--aq-border-strong)] bg-[var(--aq-accent-soft)] px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--aq-accent)] shadow-[0_0_24px_var(--aq-accent-glow)] backdrop-blur-md" style={SHEIKAH_CHIP_STYLE}>
            {role === "mestre" ? "Domínio do Mestre" : "Mesa do Aventureiro"}
          </div>
          
          <button onClick={() => setShellOpen((current) => !current)} className="flex min-w-[100px] items-center justify-center gap-2 border border-[var(--aq-border)] bg-[var(--aq-surface-soft)] px-4 py-3 text-[10px] font-black uppercase tracking-[0.15em] text-[var(--aq-title)] backdrop-blur-md hover:border-[var(--aq-accent)] hover:text-[var(--aq-accent)] transition-colors" style={SHEIKAH_CHIP_STYLE}>
            {shellOpen ? <X size={16} /> : <Menu size={16} />}
            {shellOpen ? "Ocultar" : "Diretório"}
          </button>
        </div>
      ) : null}

      {activeMesa && shellOpen ? <button className="fixed inset-0 z-40 bg-[rgba(1,4,8,0.4)] backdrop-blur-sm" onClick={() => setShellOpen(false)} aria-label="Fechar painel" /> : null}

      {/* Painel Central (Shell de Diretório) */}
      <div className={activeMesa ? `${shellOpen ? "block" : "hidden"} fixed inset-x-2 bottom-3 top-auto z-50 ${isMobile ? "max-h-[74svh]" : "max-h-[80svh]"} md:inset-x-auto md:bottom-6 md:left-6 md:top-20 md:max-h-none md:w-[420px]` : "relative z-20 mx-auto mt-20 w-full max-w-[760px] px-3 pb-10 md:px-0"}>
        <div
          className={activeMesa ? "aq-scrollbar pointer-events-auto h-full overflow-y-auto border border-[var(--aq-border)] bg-[var(--aq-bg)] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.6)]" : "pointer-events-auto border border-[var(--aq-border)] bg-[var(--aq-bg)] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.5)] md:p-8"}
          style={SHEIKAH_PANEL_STYLE}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="aq-kicker text-[var(--aq-accent)] !mb-1">Central de Sincronização</div>
              <h1 className={`${cinzel.className} text-3xl font-black tracking-wider text-[var(--aq-title)] md:text-4xl`}>Mesa Tática</h1>
              <p className="mt-3 max-w-[32rem] text-sm leading-relaxed text-[var(--aq-text-muted)]">O estado do mundo permanece online. Aventureiros navegam livremente.</p>
            </div>
          </div>

          {mesaError ? <div className="mt-5 rounded-[0.4rem] border border-[var(--aq-danger)]/30 bg-[var(--aq-danger)]/10 px-4 py-3 text-sm text-red-200">{mesaError}</div> : null}
          {!hasSession && authReady ? <div className="mt-5 rounded-[0.4rem] border border-[var(--aq-border-strong)] bg-[var(--aq-accent-soft)] px-4 py-3 text-sm text-[var(--aq-text)]">Autentique-se para revelar os selos antigos.</div> : null}

          <div className="mt-6 grid grid-cols-2 gap-3 md:flex md:flex-wrap">
            <button
              onClick={() => { setRole("mestre"); setJoinedAsPlayer(false); }}
              className={role === "mestre" ? "aq-button-primary justify-center flex-1" : "aq-button-secondary justify-center flex-1"}
            >
              <Eye size={16} /> Mestre
            </button>
            <button onClick={() => setRole("jogador")} className={role === "jogador" ? "aq-button-primary justify-center flex-1" : "aq-button-secondary justify-center flex-1"}>
              <Users size={16} /> Jogador
            </button>
            {activeMesa ? <button onClick={sair} disabled={signingOut} className="aq-button-secondary col-span-2 justify-center w-full mt-2 border-[var(--aq-danger)]/50 text-[var(--aq-danger)] hover:bg-[var(--aq-danger)]/10"><X size={16} />{signingOut ? "Rompendo elo" : "Sair do Domínio"}</button> : null}
          </div>

          {/* VISÃO DO MESTRE */}
          {role === "mestre" ? (
            <div className="mt-8 space-y-5">
              {salaAtiva ? (
                <div className="aq-panel p-5" style={SHEIKAH_PANEL_STYLE}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="aq-kicker text-[var(--aq-accent)]">Reino Atual</div>
                      <input value={roomNameDraft} onChange={(event) => setRoomNameDraft(event.target.value)} className="mt-2 w-full border-b border-[var(--aq-border-strong)] bg-transparent pb-2 text-xl font-black uppercase tracking-widest text-[var(--aq-title)] outline-none focus:border-[var(--aq-accent)] transition-colors" placeholder="Nome da Crônica" />
                    </div>
                    <button onClick={() => void finalizarSala(salaAtiva)} className="flex shrink-0 items-center gap-2 border border-[var(--aq-danger)]/40 bg-[var(--aq-danger)]/10 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-[var(--aq-danger)] transition hover:bg-[var(--aq-danger)]/20" style={SHEIKAH_CHIP_STYLE}>
                      <Archive size={14} /> Selar
                    </button>
                  </div>
                  
                  <button onClick={copyInvite} className="mt-5 flex w-full items-center justify-between border border-[var(--aq-border)] bg-[var(--aq-surface)] px-5 py-4 text-left hover:border-[var(--aq-accent)] transition-colors group" style={SHEIKAH_PANEL_STYLE}>
                    <span>
                      <span className="block text-[9px] font-black uppercase tracking-[0.25em] text-[var(--aq-text-muted)]">Runas de Convite</span>
                      <span className="mt-1.5 block font-mono text-2xl font-black uppercase tracking-widest text-[var(--aq-accent)] drop-shadow-[0_0_12px_var(--aq-accent-glow)]">{roomCode(salaAtiva.id)}</span>
                    </span>
                    <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--aq-accent)] group-hover:drop-shadow-[0_0_8px_var(--aq-accent-soft)]"><Copy size={16} /> {copiedInvite ? "Copiado" : "Copiar"}</span>
                  </button>
                  
                  <div className="mt-4 flex gap-3">
                    <button onClick={renomearSala} className="aq-button-secondary flex-1 justify-center"><Pencil size={15} /> Salvar Inscrição</button>
                    <button onClick={criarCena} disabled={!salaAtiva} className="aq-button-primary flex-1 justify-center"><Plus size={15} /> Novo Local</button>
                  </div>
                </div>
              ) : null}

              {/* Lista de Reinos Inativos */}
              <div className="border border-[var(--aq-border)] bg-[var(--aq-surface-soft)] p-5" style={SHEIKAH_PANEL_STYLE}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="aq-kicker text-[var(--aq-title)]">Crônicas do Arquivo</div>
                  </div>
                  <button onClick={criarSala} className="aq-button-primary"><Plus size={14} /> Nova Saga</button>
                </div>
                <div className="mt-5 grid gap-2">
                  {mesasNaoAtivas.length ? mesasNaoAtivas.map((sala) => (
                    <div key={sala.id} className="group flex items-center gap-3 border border-[var(--aq-border)] bg-[var(--aq-bg)] px-4 py-3 transition hover:border-[var(--aq-accent)] hover:bg-[var(--aq-accent-soft)]" style={SHEIKAH_PANEL_STYLE}>
                      <button onClick={() => setSalaAtiva(sala)} className="min-w-0 flex-1 text-left">
                        <div className="truncate text-xs font-black uppercase tracking-widest text-[var(--aq-title)]">{sala.nome}</div>
                        <div className="mt-1 font-mono text-[10px] font-black uppercase tracking-widest text-[var(--aq-accent)]">{roomCode(sala.id)}</div>
                      </button>
                      <button onClick={() => setSalaAtiva(sala)} className="text-[var(--aq-text-muted)] transition hover:text-[var(--aq-accent)]" aria-label={`Acessar ${sala.nome}`}><Eye size={16} /></button>
                      <button onClick={() => void finalizarSala(sala)} className="text-[var(--aq-text-muted)] transition hover:text-[var(--aq-danger)]" aria-label={`Selar ${sala.nome}`}><Archive size={16} /></button>
                    </div>
                  )) : <div className="border border-dashed border-[var(--aq-border)] px-4 py-5 text-center text-xs text-[var(--aq-text-muted)] uppercase tracking-widest">Nenhuma outra saga encontrada.</div>}
                </div>
              </div>

              {/* Estatísticas da Mesa */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="aq-panel p-4" style={SHEIKAH_PANEL_STYLE}><Layers3 className="text-[var(--aq-accent)]" size={18} /><div className="mt-2 text-2xl font-black text-[var(--aq-title)]">{cenas.length}</div><div className="aq-kicker mt-1">Locais</div></div>
                <div className="aq-panel p-4" style={SHEIKAH_PANEL_STYLE}><Crosshair className="text-[var(--aq-accent)]" size={18} /><div className="mt-2 text-2xl font-black text-[var(--aq-title)]">{tokens.length}</div><div className="aq-kicker mt-1">Entidades</div></div>
                <div className="aq-panel p-4" style={SHEIKAH_PANEL_STYLE}><Sparkles className="text-[var(--aq-accent)]" size={18} /><div className="mt-2 text-[13px] font-black uppercase text-[var(--aq-title)] mt-3">{cenaAtiva?.mapa_url ? "Visível" : "Vazio"}</div><div className="aq-kicker mt-1">Mapa Base</div></div>
              </div>

              {/* Ferraria de Tokens */}
              <div className="aq-panel p-5" style={SHEIKAH_PANEL_STYLE}>
                <div className="aq-kicker text-[var(--aq-accent)]">Ferraria Ancestral</div>
                <p className="mt-2 text-xs text-[var(--aq-text-muted)]">Prenda uma ficha ao tabuleiro e evoque seu avatar no local ativo.</p>
                <select value={fichaParaTokenId} onChange={(event) => setFichaParaTokenId(event.target.value)} className="aq-input mt-4 text-xs font-bold uppercase tracking-widest bg-[var(--aq-surface)] text-[var(--aq-title)]">
                  <option value="">Escolha um Grimório</option>
                  {fichas.map((ficha) => <option key={ficha.id} value={ficha.id}>{ficha.nome_personagem} | {ficha.sistema_preset}</option>)}
                </select>
                <input value={tokenLabel} onChange={(event) => setTokenLabel(event.target.value)} className="aq-input mt-3 text-xs" placeholder="Nome no mapa (Opcional)" />
                <button onClick={criarTokenDaFicha} disabled={!fichaParaTokenId || !cenaAtiva} className="aq-button-primary mt-4 w-full justify-center disabled:opacity-40">
                  <Plus size={15} /> Manifestar no Tabuleiro
                </button>
              </div>
            </div>
          ) : null}

          {/* VISÃO DO JOGADOR */}
          {role === "jogador" ? (
            <div className="mt-8 space-y-5">
              <div className="aq-panel p-5" style={SHEIKAH_PANEL_STYLE}>
                <div className="aq-kicker text-[var(--aq-accent)]">Portal de Entrada</div>
                <p className="mt-2 text-xs text-[var(--aq-text-muted)]">Insira as runas passadas pelo mestre para reabrir a mesa instantaneamente.</p>
                <div className="mt-4 flex items-center gap-3 border border-[var(--aq-border)] bg-[var(--aq-surface)] px-4 py-3 focus-within:border-[var(--aq-accent)] transition-colors" style={SHEIKAH_PANEL_STYLE}>
                  <KeyRound size={18} className="text-[var(--aq-accent)]" />
                  <input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="Runas de Convite" className="w-full bg-transparent font-mono text-base font-black uppercase tracking-widest text-[var(--aq-title)] outline-none placeholder-[var(--aq-text-subtle)]" />
                </div>
                <button onClick={entrarComoJogador} className="aq-button-primary mt-4 w-full justify-center"><Users size={15} /> Atravessar Portal</button>
                {joinError ? <div className="mt-4 rounded-[0.4rem] border border-[var(--aq-danger)]/30 bg-[var(--aq-danger)]/10 px-4 py-3 text-sm text-[var(--aq-danger)]">{joinError}</div> : null}
              </div>

              {recentSessions.length ? (
                <div className="border border-[var(--aq-border)] bg-[var(--aq-surface-soft)] p-5" style={SHEIKAH_PANEL_STYLE}>
                  <div className="aq-kicker text-[var(--aq-title)]">Ecos Recentes</div>
                  <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    {recentSessions.map((session) => (
                      <button key={session.id} onClick={() => { setJoinCode(session.codigo); const matched = findSalaByCode(salas, session.codigo); if (matched) { setJoinError(""); setRole("jogador"); setSalaAtiva(matched); setJoinedAsPlayer(true); rememberRecentSession(matched); void ensureMembership(matched.id, "jogador"); } }} className="flex flex-col items-start border border-[var(--aq-border)] bg-[var(--aq-bg)] px-4 py-3 text-left transition hover:border-[var(--aq-accent)] hover:bg-[var(--aq-accent-soft)]" style={SHEIKAH_PANEL_STYLE}>
                        <span className="block truncate w-full text-xs font-black uppercase tracking-widest text-[var(--aq-title)]">{session.nome_sala}</span>
                        <span className="mt-1 block font-mono text-[10px] font-black tracking-[0.2em] text-[var(--aq-accent)]">{session.codigo}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {joinedAsPlayer ? (
                <div className="aq-panel p-5" style={SHEIKAH_PANEL_STYLE}>
                  <div className="aq-kicker text-[var(--aq-accent)]">Juramento do Aventureiro</div>
                  <p className="mt-2 text-xs text-[var(--aq-text-muted)]">O jogador manipula apenas sua própria ficha. Selecione uma existente ou forje uma agora.</p>
                  <select value={fichaEscolhidaId} onChange={(event) => setFichaEscolhidaId(event.target.value)} className="aq-input mt-4 text-xs font-bold uppercase tracking-widest bg-[var(--aq-surface)] text-[var(--aq-title)]">
                    <option value="">{fichas.length ? "Selecione um Grimório" : "Nenhum Grimório no Cofre"}</option>
                    {fichas.map((ficha) => <option key={ficha.id} value={ficha.id}>{ficha.nome_personagem} | {ficha.sistema_preset}</option>)}
                  </select>
                  <div className="mt-4 flex flex-col gap-3">
                    <button onClick={vincularFichaComoJogador} disabled={!fichaEscolhidaId} className="aq-button-primary w-full justify-center disabled:opacity-40">Assumir Controle do Avatar</button>
                    <div className="flex gap-3">
                      <button onClick={criarFichaJogadorRapida} className="aq-button-secondary flex-1 justify-center"><Plus size={14} /> Forjar Nova</button>
                      {fichaEscolhidaId ? <button onClick={() => router.push(fichaHref(fichaEscolhidaId))} className="aq-button-secondary flex-1 justify-center"><ScrollText size={14}/> Abrir Ficha</button> : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* TELA DE ESPERA / SELEÇÃO DE ROLE (Quando não há mesa ativa) */}
      {!activeMesa ? (
        <div className="relative z-10 mx-auto flex min-h-[90vh] w-full max-w-[1200px] items-center justify-center px-4 pb-20 pt-10">
          <div className="w-full max-w-2xl border border-[var(--aq-border)] bg-[var(--aq-surface-soft)] p-8 text-center shadow-[0_28px_70px_rgba(0,0,0,0.6)] backdrop-blur-xl" style={SHEIKAH_PANEL_STYLE}>
            <div className="aq-kicker text-[var(--aq-accent)]">Portal Desativado</div>
            <h2 className={`${cinzel.className} mt-3 text-4xl font-black tracking-widest text-[var(--aq-title)] md:text-5xl drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]`}>
              {role === "mestre" ? (salaAtiva ? "Desperte a primeira cena" : "Nenhuma saga em curso") : "Escolha o seu Caminho"}
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-[var(--aq-text)]">
              O mapa é o palco onde as crônicas se desenrolam. O diretório é o seu grimório de comando. Selecione seu papel para iniciar.
            </p>
            {role === "mestre" ? (
              <button onClick={salaAtiva ? criarCena : criarSala} className="aq-button-primary mt-8 justify-center w-[250px] mx-auto">
                <Plus size={16} className="mr-2" />
                {salaAtiva ? "Materializar Local" : "Forjar Nova Saga"}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Roster Inferior (Tokens na Cena) */}
      {activeMesa && visibleRoster.length > 0 ? (
        <div className="fixed bottom-3 left-3 right-3 z-40 border border-[var(--aq-border)] bg-[var(--aq-surface-soft)] px-3 py-2.5 shadow-[0_15px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl md:bottom-5 md:left-5 md:right-auto md:w-[580px]" style={SHEIKAH_PANEL_STYLE}>
          <div className="aq-scrollbar flex w-full gap-2.5 overflow-x-auto pb-1">
            {visibleRoster.map(({ token, ficha, vida, pe, sanidade }) => {
              const initials = (ficha?.nome_personagem ?? token.nome).slice(0, 2).toUpperCase();
              const hp = vida?.max ? Math.max(0, Math.min(1, vida.atual / vida.max)) : 0;
              const hpColor = hp > 0.5 ? "var(--aq-success)" : hp > 0.25 ? "#f59e0b" : "var(--aq-danger)";
              const isMaster = role === "mestre";
              return (
                <button
                  key={token.id}
                  onClick={() => setSelectedToken(token)}
                  className={`min-w-[155px] border px-3 py-2.5 text-left transition-colors ${selectedToken?.id === token.id ? "border-[var(--aq-accent)] bg-[var(--aq-accent-soft)]" : "border-[var(--aq-border)] bg-[var(--aq-bg)] hover:border-[var(--aq-border-strong)]"}`}
                  style={SHEIKAH_PANEL_STYLE}
                >
                  <div className="flex items-center gap-2.5">
                    {ficha?.avatar_url ? (
                      <img src={ficha.avatar_url} alt={ficha.nome_personagem} className="h-10 w-10 rounded-[0.4rem] object-cover border border-[var(--aq-border)]" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-[0.4rem] border border-white/20 text-xs font-black text-white" style={{ background: token.cor || "var(--aq-accent)" }}>{initials}</div>
                    )}
                    <div className="min-w-0">
                      <div className="truncate text-xs font-black uppercase tracking-widest text-[var(--aq-title)]">{isMaster ? ficha?.nome_personagem ?? token.nome : "Vida Vital"}</div>
                      <div className="truncate text-[8px] uppercase tracking-[0.2em] text-[var(--aq-text-muted)]">{isMaster ? token.nome : ficha?.nome_personagem ?? token.nome}</div>
                    </div>
                  </div>
                  
                  <div className="mt-2.5 h-[0.35rem] rounded-full bg-[var(--aq-surface)] border border-[var(--aq-border)] overflow-hidden">
                    <div className="h-full transition-all duration-500" style={{ width: `${hp * 100}%`, backgroundColor: hpColor, boxShadow: `0 0 6px ${hpColor}` }} />
                  </div>
                  
                  <div className="mt-1.5 text-[9px] uppercase tracking-[0.16em] text-[var(--aq-text-muted)] font-bold">
                    HP <span className="text-[var(--aq-title)]">{vida ? `${vida.atual}/${vida.max}` : "--"}</span> {isMaster && pe ? ` | PE ${pe.atual}` : ""} {isMaster && sanidade ? ` | SAN ${sanidade.atual}` : ""}
                  </div>
                  
                  {isMaster && token.ficha_id ? (
                    <span onClick={(event) => { event.stopPropagation(); router.push(fichaHref(token.ficha_id!)); }} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-[0.25rem] border border-[var(--aq-border)] bg-[var(--aq-surface)] px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-[var(--aq-text)] hover:text-[var(--aq-accent)] hover:border-[var(--aq-accent)] transition-colors">
                      <ScrollText size={12} /> Abrir Ficha
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Relíquias e Handouts Inferiores */}
      {activeMesa && handouts.length > 0 ? (
        <div className="fixed bottom-[110px] right-3 z-40 w-[min(92vw,380px)] overflow-hidden border border-[var(--aq-border)] bg-[var(--aq-surface-soft)] shadow-[0_20px_56px_rgba(0,0,0,0.6)] backdrop-blur-xl md:bottom-28 md:right-5" style={SHEIKAH_PANEL_STYLE}>
          <div className="border-b border-[var(--aq-border)] px-5 py-3">
            <div className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--aq-accent)]">Achados do Domínio</div>
            <div className="mt-1 text-[10px] uppercase tracking-widest text-[var(--aq-text-muted)]">Relíquias e pergaminhos revelados</div>
          </div>
          <div className="aq-scrollbar flex gap-3 overflow-x-auto p-4">
            {handouts.map((handout) => (
              <button
                key={handout.id}
                onClick={() => setSelectedHandout(handout)}
                className="min-w-[150px] overflow-hidden border border-[var(--aq-border)] bg-[var(--aq-bg)] text-left transition hover:border-[var(--aq-accent)] hover:bg-[var(--aq-accent-soft)] group"
                style={SHEIKAH_PANEL_STYLE}
              >
                <div className="h-24 overflow-hidden border-b border-[var(--aq-border)] bg-[var(--aq-bg-deep)] relative">
                  {handout.image_url ? (
                    <img src={handout.image_url} alt={handout.titulo} className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="flex h-full items-center justify-center px-3 text-center text-[10px] font-black uppercase tracking-widest text-[var(--aq-text-subtle)]">Runa Textual</div>
                  )}
                </div>
                <div className="p-3">
                  <div className="truncate text-[11px] font-black uppercase tracking-widest text-[var(--aq-title)]">{handout.titulo}</div>
                  <div className="mt-1 text-[9px] uppercase tracking-widest text-[var(--aq-text-muted)]">{handout.tipo || "Artefato"}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}
