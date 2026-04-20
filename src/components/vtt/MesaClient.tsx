"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Cinzel, Inter } from "next/font/google";
import {
  ArrowLeft,
  Crosshair,
  Eye,
  KeyRound,
  Layers3,
  Link2,
  Menu,
  Plus,
  ScrollText,
  Sparkles,
  Sword,
  Users,
  X,
} from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { FichaVTTSnapshot, SceneViewPreferences, Token } from "@/src/lib/types";
import {
  DEFAULT_SCENE_VIEW_PREFERENCES,
  loadScenePreferences,
  normalizeScenePreferences,
  saveScenePreferences,
} from "@/src/lib/vttScenePreferences";

const VTTCanvas = dynamic(() => import("@/src/components/vtt/VTTCanvas"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-[#050a10]">
      <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--aq-accent)]">Carregando mapa...</div>
    </div>
  ),
});

const SceneNav = dynamic(() => import("@/src/components/vtt/SceneNav"), { ssr: false });
const VTTControls = dynamic(() => import("@/src/components/vtt/VTTControls"), { ssr: false });
const TokenPanel = dynamic(() => import("@/src/components/vtt/Tokenpanel"), { ssr: false });
const Chat = dynamic(() => import("@/src/components/vtt/Chat"), { ssr: false });

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

type Sala = {
  id: string;
  nome: string;
};

type Cena = {
  id: string;
  sala_id: string;
  nome: string;
  mapa_url?: string | null;
};

type FichaListItem = {
  id: string;
  nome_personagem: string;
  sistema_preset: string;
};

type MesaRole = "mestre" | "jogador" | null;

function getSalaPassword(salaId: string) {
  return salaId.replace(/-/g, "").slice(-6).toUpperCase();
}

function getInviteToken(salaId: string) {
  return salaId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function findSalaByAccessCode(salas: Sala[], code: string) {
  const normalized = code.trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (!normalized) {
    return null;
  }

  return (
    salas.find((sala) => sala.id.replace(/-/g, "").toUpperCase() === normalized) ??
    salas.find((sala) => getSalaPassword(sala.id) === normalized) ??
    salas.find((sala) => getInviteToken(sala.id) === normalized) ??
    null
  );
}

type MesaClientProps = {
  inviteCode?: string;
};

export default function MesaClient({ inviteCode }: MesaClientProps) {
  const router = useRouter();
  const [salas, setSalas] = useState<Sala[]>([]);
  const [cenas, setCenas] = useState<Cena[]>([]);
  const [fichas, setFichas] = useState<FichaListItem[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<MesaRole>(inviteCode ? "jogador" : null);
  const [salaAtiva, setSalaAtiva] = useState<Sala | null>(null);
  const [cenaAtiva, setCenaAtiva] = useState<Cena | null>(null);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [fichaEscolhidaId, setFichaEscolhidaId] = useState("");
  const [fichaParaTokenId, setFichaParaTokenId] = useState("");
  const [tokenLabel, setTokenLabel] = useState("");
  const [fichasMap, setFichasMap] = useState<Record<string, FichaVTTSnapshot>>({});
  const [scenePreferences, setScenePreferences] = useState<SceneViewPreferences>(DEFAULT_SCENE_VIEW_PREFERENCES);
  const [joinCode, setJoinCode] = useState(inviteCode ?? "");
  const [joinError, setJoinError] = useState("");
  const [joinedAsPlayer, setJoinedAsPlayer] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [mobileShellOpen, setMobileShellOpen] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const carregarSalas = async () => {
      try {
        const { data, error } = await supabase.from("salas").select("*");
        if (error) {
          throw error;
        }

        setSalas((data ?? []) as Sala[]);
      } catch (error) {
        console.error("Erro ao carregar salas:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarSalas();

    const channel = supabase
      .channel("salas_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "salas" }, () => carregarSalas())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const carregarFichas = async () => {
      const { data, error } = await supabase
        .from("fichas")
        .select("id, nome_personagem, sistema_preset")
        .order("nome_personagem");

      if (!error) {
        setFichas((data ?? []) as FichaListItem[]);
      }
    };

    carregarFichas();
  }, []);

  useEffect(() => {
    if (role === "mestre" && !salaAtiva && salas.length > 0) {
      setSalaAtiva(salas[0]);
    }
  }, [role, salaAtiva, salas]);

  useEffect(() => {
    if (!inviteCode || !salas.length || joinedAsPlayer) {
      return;
    }

    const matched = findSalaByAccessCode(salas, inviteCode);
    if (matched) {
      setSalaAtiva(matched);
      setJoinedAsPlayer(true);
      setRole("jogador");
      setJoinError("");
    }
  }, [inviteCode, joinedAsPlayer, salas]);

  useEffect(() => {
    if (!salaAtiva?.id) {
      setCenas([]);
      setCenaAtiva(null);
      return;
    }

    const carregarCenas = async () => {
      const { data, error } = await supabase.from("cenas").select("*").eq("sala_id", salaAtiva.id);
      if (error) {
        console.error("Erro ao carregar cenas:", error);
        return;
      }

      const nextCenas = (data ?? []) as Cena[];
      setCenas(nextCenas);
      setCenaAtiva((current) => {
        if (current && nextCenas.some((cena) => cena.id === current.id)) {
          return nextCenas.find((cena) => cena.id === current.id) ?? null;
        }
        return nextCenas[0] ?? null;
      });
    };

    carregarCenas();
    setSelectedToken(null);

    const channel = supabase
      .channel(`mesa_cenas_${salaAtiva.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cenas", filter: `sala_id=eq.${salaAtiva.id}` },
        () => carregarCenas(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salaAtiva?.id]);

  useEffect(() => {
    setScenePreferences(loadScenePreferences(cenaAtiva?.id));
  }, [cenaAtiva?.id]);

  useEffect(() => {
    if (!cenaAtiva?.id) {
      return;
    }

    saveScenePreferences(cenaAtiva.id, scenePreferences);
  }, [cenaAtiva?.id, scenePreferences]);

  useEffect(() => {
    const handleMapOffset = (event: Event) => {
      const customEvent = event as CustomEvent<{ x: number; y: number }>;
      if (!customEvent.detail) {
        return;
      }

      setScenePreferences((current) =>
        normalizeScenePreferences({
          ...current,
          mapOffsetX: customEvent.detail.x,
          mapOffsetY: customEvent.detail.y,
        }),
      );
    };

    window.addEventListener("aq-map-offset", handleMapOffset as EventListener);
    return () => window.removeEventListener("aq-map-offset", handleMapOffset as EventListener);
  }, []);

  const updateScenePreferences = (patch: Partial<SceneViewPreferences>) => {
    setScenePreferences((current) => normalizeScenePreferences({ ...current, ...patch }));
  };

  const fichaSelecionada = useMemo(() => {
    if (!selectedToken?.ficha_id) {
      return null;
    }
    return fichasMap[selectedToken.ficha_id] ?? null;
  }, [fichasMap, selectedToken]);

  const fichaDoJogador = useMemo(() => {
    if (!fichaEscolhidaId) {
      return null;
    }
    return fichasMap[fichaEscolhidaId] ?? null;
  }, [fichaEscolhidaId, fichasMap]);

  const roster = useMemo(() => {
    return tokens
      .filter((token) => token.ficha_id)
      .map((token) => {
        const ficha = token.ficha_id ? fichasMap[token.ficha_id] : null;
        const vida = ficha?.dados?.status?.vida;
        const pe = ficha?.dados?.status?.pe;
        const sanidade = ficha?.dados?.status?.sanidade;
        const dead = (vida?.atual ?? 1) <= 0;
        return { token, ficha, vida, pe, sanidade, dead };
      });
  }, [fichasMap, tokens]);

  const showActiveMesa = Boolean(role && salaAtiva && cenaAtiva && (role === "mestre" || joinedAsPlayer));

  useEffect(() => {
    if (showActiveMesa) {
      setMobileShellOpen(false);
      return;
    }

    setMobileShellOpen(true);
  }, [showActiveMesa]);

  const criarSala = async () => {
    const nome = `Jornada ${salas.length + 1}`;
    const { data, error } = await supabase.from("salas").insert([{ nome }]).select().single();
    if (error) {
      alert(`Falha ao criar sala: ${error.message}`);
      return;
    }

    const novaSala = data as Sala;
    setSalas((current) => [novaSala, ...current]);
    setSalaAtiva(novaSala);
    setRole("mestre");
  };

  const criarCenaInicial = async () => {
    if (!salaAtiva?.id) {
      return;
    }

    const { data, error } = await supabase
      .from("cenas")
      .insert([{ sala_id: salaAtiva.id, nome: `Setor ${cenas.length + 1}` }])
      .select()
      .single();

    if (error) {
      alert(`Falha ao criar cena: ${error.message}`);
      return;
    }

    const novaCena = data as Cena;
    setCenas((current) => [...current, novaCena]);
    setCenaAtiva(novaCena);
  };

  const criarTokenDaFicha = async () => {
    if (!cenaAtiva?.id || !fichaParaTokenId || !salaAtiva?.id) {
      return;
    }

    const fichaBase = fichas.find((entry) => entry.id === fichaParaTokenId);
    if (!fichaBase) {
      return;
    }

    const nome = tokenLabel.trim() || fichaBase.nome_personagem || "Agente";
    const cor = fichaBase.sistema_preset === "dnd5e" ? "#60a5fa" : "#4ad9d9";

    const { error } = await supabase.from("tokens").insert([
      {
        cena_id: cenaAtiva.id,
        sala: salaAtiva.id,
        ficha_id: fichaBase.id,
        nome,
        x: 100 + tokens.length * 60,
        y: 100 + tokens.length * 60,
        cor,
      },
    ]);

    if (error) {
      alert(`Falha ao criar token: ${error.message}`);
      return;
    }

    setFichaParaTokenId("");
    setTokenLabel("");
  };

  const vincularFichaComoJogador = () => {
    const tokenCorrespondente = tokens.find((token) => token.ficha_id === fichaEscolhidaId);
    if (tokenCorrespondente) {
      setSelectedToken(tokenCorrespondente);
      setMobileShellOpen(false);
    }
  };

  const joinAsPlayer = () => {
    const matched = findSalaByAccessCode(salas, joinCode);
    if (!matched) {
      setJoinError("Nao encontramos uma sala com essa senha ou convite.");
      return;
    }

    setSalaAtiva(matched);
    setJoinedAsPlayer(true);
    setRole("jogador");
    setJoinError("");
  };

  const copyInviteLink = async () => {
    if (!salaAtiva) {
      return;
    }

    const link = `${window.location.origin}/mesa?convite=${getInviteToken(salaAtiva.id)}`;

    try {
      await navigator.clipboard.writeText(link);
      setCopiedInvite(true);
      window.setTimeout(() => setCopiedInvite(false), 1800);
    } catch {
      alert(link);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="aq-page flex items-center justify-center">
        <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--aq-accent)] animate-pulse">
          Inicializando mesa...
        </div>
      </div>
    );
  }

  const mobileDrawerClass = showActiveMesa
    ? `${mobileShellOpen ? "block" : "hidden"} fixed inset-x-3 top-20 bottom-[calc(28vh+1rem)] z-50 md:block md:inset-x-auto md:bottom-6 md:left-6 md:right-auto md:top-20 md:w-[390px]`
    : "relative z-20 mx-auto mt-24 w-full max-w-[640px] px-3 pb-10 md:px-0";

  const mobilePanelClass = showActiveMesa
    ? "aq-scrollbar pointer-events-auto h-full overflow-y-auto aq-panel p-5 md:max-h-[calc(100dvh-7rem)]"
    : "aq-panel pointer-events-auto p-5 md:p-6";

  return (
    <main className={`aq-page overflow-x-hidden ${inter.className}`}>
      {showActiveMesa && cenaAtiva ? (
        <>
          <VTTCanvas
            cenaId={cenaAtiva.id}
            mapaUrl={cenaAtiva.mapa_url ?? undefined}
            selectedTokenId={selectedToken?.id ?? null}
            onSelectToken={setSelectedToken}
            onFichasMapChange={setFichasMap}
            onTokensChange={setTokens}
            scenePreferences={scenePreferences}
          />
          <SceneNav salaId={salaAtiva.id} onSelectCena={setCenaAtiva} cenaAtivaId={cenaAtiva.id} />
          {role === "mestre" ? (
            <VTTControls cenaId={cenaAtiva.id} salaId={salaAtiva.id} preferences={scenePreferences} onPreferencesChange={updateScenePreferences} />
          ) : null}
          <TokenPanel token={selectedToken} fichaData={fichaSelecionada} onClose={() => setSelectedToken(null)} onTokenUpdate={setSelectedToken} />
          <Chat salaId={salaAtiva.id} />
        </>
      ) : null}

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(74,217,217,0.06),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(26,43,76,0.18),transparent_30%)]" />

      {showActiveMesa ? (
        <div className="fixed inset-x-3 top-3 z-50 flex items-center justify-between gap-2 md:hidden">
          <button
            onClick={() => router.push("/")}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--aq-border)] bg-[rgba(5,10,16,0.88)] text-[var(--aq-title)] backdrop-blur-md"
            aria-label="Voltar"
          >
            <ArrowLeft size={17} />
          </button>
          <div className="rounded-full border border-[var(--aq-border-strong)] bg-[rgba(5,10,16,0.88)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--aq-accent)] backdrop-blur-md">
            {role === "mestre" ? "Mesa do Mestre" : "Mesa do Jogador"}
          </div>
          <button
            onClick={() => setMobileShellOpen((current) => !current)}
            className="flex h-11 min-w-[88px] items-center justify-center gap-2 rounded-full border border-[var(--aq-border-strong)] bg-[rgba(5,10,16,0.88)] px-3 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--aq-title)] backdrop-blur-md"
          >
            {mobileShellOpen ? <X size={16} /> : <Menu size={16} />}
            {mobileShellOpen ? "Fechar" : "Mesa"}
          </button>
        </div>
      ) : null}

      {showActiveMesa && mobileShellOpen ? (
        <button
          className="fixed inset-0 z-40 bg-[rgba(0,0,0,0.28)] md:hidden"
          onClick={() => setMobileShellOpen(false)}
          aria-label="Fechar painel"
        />
      ) : null}

      <div className={mobileDrawerClass}>
        <div className={mobilePanelClass}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="aq-kicker">Bridge Deck</div>
              <h1 className={`${cinzel.className} mt-2 text-3xl font-black tracking-[0.08em] text-[var(--aq-title)] md:text-4xl`}>
                Mesa Tatica
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[var(--aq-text-muted)]">
                Mestre cria a sessao, publica o mapa e controla a cena. Jogador entra por senha ou convite e ve so o que precisa para jogar.
              </p>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <button onClick={() => router.push("/")} className="rounded-full border border-[var(--aq-border)] p-2 text-[var(--aq-text-subtle)] transition-colors hover:text-white">
                <ArrowLeft size={16} />
              </button>
              {showActiveMesa ? (
                <button onClick={() => setMobileShellOpen(false)} className="rounded-full border border-[var(--aq-border)] p-2 text-[var(--aq-text-subtle)] transition-colors hover:text-white md:hidden">
                  <X size={16} />
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => {
                setRole("mestre");
                setJoinedAsPlayer(false);
                setJoinError("");
              }}
              className={role === "mestre" ? "aq-button-primary" : "aq-button-secondary"}
            >
              <Eye size={14} />
              Mestre
            </button>
            <button
              onClick={() => {
                setRole("jogador");
                setJoinError("");
              }}
              className={role === "jogador" ? "aq-button-primary" : "aq-button-secondary"}
            >
              <Users size={14} />
              Jogador
            </button>
            {showActiveMesa ? (
              <button onClick={handleSignOut} disabled={signingOut} className="aq-button-secondary ml-auto">
                <X size={14} />
                {signingOut ? "Saindo" : "Sair"}
              </button>
            ) : null}
          </div>

          {!role ? (
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <button onClick={() => setRole("mestre")} className="rounded-3xl border border-[var(--aq-border-strong)] bg-[rgba(74,217,217,0.12)] p-5 text-left transition-all hover:bg-[rgba(74,217,217,0.18)]">
                <div className="flex items-center gap-2 text-[var(--aq-accent)]"><Sword size={16} /> Mestre</div>
                <div className="mt-3 text-lg font-black text-[var(--aq-title)]">Criar e comandar a sessao</div>
                <div className="mt-2 text-sm leading-relaxed text-[var(--aq-text-muted)]">Crie sala, gere convite, suba mapa e controle cenas e tokens.</div>
              </button>
              <button onClick={() => setRole("jogador")} className="rounded-3xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-5 text-left transition-all hover:border-[var(--aq-border-strong)] hover:bg-[rgba(15,24,36,0.84)]">
                <div className="flex items-center gap-2 text-[var(--aq-accent)]"><Users size={16} /> Jogador</div>
                <div className="mt-3 text-lg font-black text-[var(--aq-title)]">Entrar em uma mesa</div>
                <div className="mt-2 text-sm leading-relaxed text-[var(--aq-text-muted)]">Use a senha da sala ou o convite curto compartilhado pelo mestre.</div>
              </button>
            </div>
          ) : null}

          {role === "mestre" ? (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                {salas.map((sala) => (
                  <button key={sala.id} onClick={() => setSalaAtiva(sala)} className={salaAtiva?.id === sala.id ? "aq-button-primary" : "aq-button-secondary"}>
                    {sala.nome}
                  </button>
                ))}
                <button onClick={criarSala} className="aq-button-secondary">
                  <Plus size={14} />
                  Nova sala
                </button>
              </div>

              {salaAtiva ? (
                <div className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-4">
                  <div className="aq-kicker">Entrada dos Jogadores</div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-[var(--aq-border)] px-4 py-3">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--aq-text-muted)]">Senha da sala</div>
                      <div className="mt-2 text-xl font-black text-[var(--aq-title)]">{getSalaPassword(salaAtiva.id)}</div>
                    </div>
                    <div className="rounded-2xl border border-[var(--aq-border)] px-4 py-3">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--aq-text-muted)]">Convite curto</div>
                      <div className="mt-2 text-xl font-black text-[var(--aq-title)]">{getInviteToken(salaAtiva.id)}</div>
                    </div>
                  </div>
                  <button onClick={copyInviteLink} className="aq-button-secondary mt-3 w-full justify-center sm:w-auto">
                    <Link2 size={14} />
                    {copiedInvite ? "Convite copiado" : "Copiar link de convite"}
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--aq-border)] bg-[rgba(5,10,16,0.52)] p-4 text-sm text-[var(--aq-text-muted)]">
                  Crie a primeira sala para abrir os acessos da sessao.
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-4">
                  <div className="flex items-center gap-2 text-[var(--aq-accent)]"><Layers3 size={16} /><span className="aq-kicker">Cenas</span></div>
                  <div className="mt-3 text-2xl font-black text-[var(--aq-title)]">{cenas.length}</div>
                </div>
                <div className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-4">
                  <div className="flex items-center gap-2 text-[var(--aq-accent)]"><Crosshair size={16} /><span className="aq-kicker">Tokens</span></div>
                  <div className="mt-3 text-2xl font-black text-[var(--aq-title)]">{tokens.length}</div>
                </div>
                <div className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-4">
                  <div className="flex items-center gap-2 text-[var(--aq-accent)]"><Sparkles size={16} /><span className="aq-kicker">Mapa</span></div>
                  <div className="mt-3 text-sm font-bold text-[var(--aq-title)]">{cenaAtiva?.mapa_url ? "Cena com mapa" : "Upload pendente"}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={criarCenaInicial} className="aq-button-primary">
                  <Plus size={14} />
                  Nova cena
                </button>
                <button onClick={() => router.push("/fichas")} className="aq-button-secondary">
                  <ScrollText size={14} />
                  Abrir fichas
                </button>
              </div>

              {cenaAtiva ? (
                <div className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-4 text-xs uppercase tracking-[0.18em] text-[var(--aq-text-muted)]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span>{`Ferramenta: ${scenePreferences.toolMode}`}</span>
                    <span>{`Grid: ${scenePreferences.gridSize}px`}</span>
                    <span>{scenePreferences.snapToGrid ? "Snap ativo" : "Snap livre"}</span>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--aq-border)] bg-[rgba(5,10,16,0.52)] p-4 text-sm text-[var(--aq-text-muted)]">
                  Depois de criar a sala, crie uma cena para liberar o mapa e as ferramentas do mestre.
                </div>
              )}

              <div className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-4">
                <div className="aq-kicker">Controle do Mestre</div>
                <p className="mt-2 text-sm text-[var(--aq-text-muted)]">
                  Vincule uma ficha a um token da cena atual. O retrato aparece na faixa inferior e o status espelha em tempo real.
                </p>
                <div className="mt-4 space-y-3">
                  <select value={fichaParaTokenId} onChange={(e) => setFichaParaTokenId(e.target.value)} className="aq-input">
                    <option value="">Escolha uma ficha para colocar no mapa</option>
                    {fichas.map((ficha) => (
                      <option key={ficha.id} value={ficha.id}>{ficha.nome_personagem} | {ficha.sistema_preset}</option>
                    ))}
                  </select>
                  <input value={tokenLabel} onChange={(e) => setTokenLabel(e.target.value)} placeholder="Nome do token no mapa (opcional)" className="aq-input" />
                  <button onClick={criarTokenDaFicha} disabled={!fichaParaTokenId || !cenaAtiva?.id} className="aq-button-primary w-full justify-center disabled:opacity-50">
                    <Plus size={14} />
                    Colocar ficha na cena
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {role === "jogador" ? (
            <div className="mt-6 space-y-4">
              {!joinedAsPlayer ? (
                <div className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-4">
                  <div className="aq-kicker">Entrar na Sessao</div>
                  <p className="mt-2 text-sm text-[var(--aq-text-muted)]">
                    Digite a senha da sala ou o convite curto que o mestre compartilhou.
                  </p>
                  <div className="mt-4 flex items-center gap-2 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] px-4 py-3">
                    <KeyRound size={16} className="text-[var(--aq-accent)]" />
                    <input
                      value={joinCode}
                      onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                      placeholder="Senha ou convite"
                      className="w-full bg-transparent text-sm text-[var(--aq-title)] outline-none placeholder:text-[var(--aq-text-subtle)]"
                    />
                  </div>
                  <button onClick={joinAsPlayer} className="aq-button-primary mt-4 w-full justify-center">
                    <Users size={14} />
                    Entrar como jogador
                  </button>
                  {joinError ? (
                    <div className="mt-3 rounded-2xl border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] px-4 py-3 text-sm text-red-200">
                      {joinError}
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-4">
                    <div className="aq-kicker">Sessao conectada</div>
                    <div className="mt-2 text-lg font-black text-[var(--aq-title)]">{salaAtiva?.nome}</div>
                    <div className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--aq-text-muted)]">Convite {salaAtiva ? getInviteToken(salaAtiva.id) : "--"}</div>
                    {!cenaAtiva ? (
                      <div className="mt-3 rounded-2xl border border-dashed border-[var(--aq-border)] bg-[rgba(5,10,16,0.52)] px-4 py-3 text-sm text-[var(--aq-text-muted)]">
                        O mestre ainda nao abriu a primeira cena desta sala.
                      </div>
                    ) : null}
                  </div>
                  <div className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-4">
                    <div className="aq-kicker">Escolher ficha</div>
                    <p className="mt-2 text-sm text-[var(--aq-text-muted)]">
                      Escolha a ficha que voce vai usar. Se o mestre ja vinculou um token, a mesa foca nela.
                    </p>
                    <select value={fichaEscolhidaId} onChange={(e) => setFichaEscolhidaId(e.target.value)} className="aq-input mt-3">
                      <option value="">Selecione uma ficha</option>
                      {fichas.map((ficha) => (
                        <option key={ficha.id} value={ficha.id}>{ficha.nome_personagem} | {ficha.sistema_preset}</option>
                      ))}
                    </select>
                    <div className="mt-3 flex flex-wrap gap-3">
                      <button onClick={vincularFichaComoJogador} className="aq-button-primary" disabled={!fichaEscolhidaId || !cenaAtiva}>
                        Entrar com ficha
                      </button>
                      {fichaEscolhidaId ? (
                        <button onClick={() => router.push(`/fichas/${fichaEscolhidaId}`)} className="aq-button-secondary">
                          Abrir ficha
                        </button>
                      ) : null}
                    </div>
                    {fichaDoJogador ? (
                      <div className="mt-4 rounded-2xl border border-[var(--aq-border)] bg-[rgba(10,15,24,0.84)] p-4">
                        <div className="text-sm font-bold text-[var(--aq-title)]">{fichaDoJogador.nome_personagem}</div>
                        <div className="mt-2 text-xs uppercase tracking-[0.22em] text-[var(--aq-text-muted)]">{fichaDoJogador.sistema_preset}</div>
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {!showActiveMesa ? (
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1500px] items-center justify-center px-4 pb-20 pt-10 md:px-8">
          <div className="aq-panel w-full max-w-3xl p-8 text-center md:p-10">
            <div className="aq-kicker">No Signal</div>
            <h2 className={`${cinzel.className} mt-3 text-4xl font-black tracking-[0.08em] text-[var(--aq-title)] md:text-5xl`}>
              {role === "mestre" ? (salaAtiva ? "Crie a primeira cena" : "Nenhuma sala ativa") : "Escolha como entrar"}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[var(--aq-text-muted)] md:text-base">
              {role === "mestre"
                ? salaAtiva
                  ? "Sua sala ja existe. Agora crie a primeira cena para liberar o mapa, o chat e os retratos ao vivo da mesa."
                  : "Crie a primeira jornada e depois compartilhe a senha ou o convite curto com o grupo."
                : "Jogadores entram com senha da sala ou convite do mestre. Depois escolhem a ficha e a mesa passa a focar no tabuleiro."}
            </p>
            {role === "mestre" ? (
              <button onClick={salaAtiva ? criarCenaInicial : criarSala} className="aq-button-primary mt-8 justify-center">
                <Plus size={14} />
                {salaAtiva ? "Criar primeira cena" : "Criar primeira sala"}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {showActiveMesa ? (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[rgba(74,217,217,0.14)] bg-[linear-gradient(180deg,rgba(5,10,16,0),rgba(5,10,16,0.92)_12%,rgba(5,10,16,0.98)_100%)] px-3 pb-4 pt-10 backdrop-blur-xl md:px-6 md:pb-5 md:pt-12">
          <div className="mx-auto flex w-full max-w-[1500px] items-end justify-between gap-4 pb-3">
            <div>
              <div className="aq-kicker">Tactical Cast</div>
              <div className="mt-2 text-sm font-semibold tracking-[0.18em] text-[var(--aq-title)]">Retratos e status ao vivo</div>
            </div>
            <div className="hidden text-[11px] uppercase tracking-[0.18em] text-[var(--aq-text-muted)] md:block">
              Toque no retrato para focar o token no mapa
            </div>
          </div>

          {roster.length > 0 ? (
            <div className="aq-scrollbar mx-auto flex w-full max-w-[1500px] gap-3 overflow-x-auto pb-1 md:gap-4">
              {roster.map(({ token, ficha, vida, pe, sanidade, dead }) => {
                const initials = (ficha?.nome_personagem ?? token.nome).slice(0, 2).toUpperCase();
                const hpRatio = vida?.max ? Math.max(0, Math.min(1, vida.atual / vida.max)) : 0;
                const peRatio = pe?.max ? Math.max(0, Math.min(1, pe.atual / pe.max)) : 0;
                const sanRatio = sanidade?.max ? Math.max(0, Math.min(1, sanidade.atual / sanidade.max)) : 0;

                return (
                  <button
                    key={token.id}
                    onClick={() => setSelectedToken(token)}
                    className={`group min-w-[170px] rounded-[28px] border px-3 py-3 text-left transition-all md:min-w-[210px] md:px-4 md:py-4 ${
                      selectedToken?.id === token.id
                        ? "border-[var(--aq-border-strong)] bg-[rgba(74,217,217,0.12)] shadow-[0_0_24px_rgba(74,217,217,0.14)]"
                        : "border-[var(--aq-border)] bg-[rgba(8,13,20,0.88)] hover:border-[var(--aq-border-strong)] hover:bg-[rgba(15,24,36,0.94)]"
                    } ${dead ? "opacity-70" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      {ficha?.avatar_url ? (
                        <img src={ficha.avatar_url} alt={ficha.nome_personagem} className="h-16 w-16 rounded-2xl object-cover ring-1 ring-white/10 md:h-20 md:w-20" />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-black text-white md:h-20 md:w-20" style={{ background: token.cor || "#4ad9d9" }}>
                          {initials}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-black uppercase tracking-[0.12em] text-[var(--aq-title)] md:text-base">
                          {ficha?.nome_personagem ?? token.nome}
                        </div>
                        <div className="mt-1 truncate text-[10px] uppercase tracking-[0.22em] text-[var(--aq-text-muted)]">
                          {token.nome}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-[9px] uppercase tracking-[0.18em] text-[var(--aq-text-muted)]">
                          <span className="rounded-full border border-white/10 px-2 py-1">{ficha?.sistema_preset ?? "vtt"}</span>
                          <span className={`rounded-full px-2 py-1 ${dead ? "bg-[rgba(239,68,68,0.16)] text-red-300" : "bg-[rgba(74,217,217,0.12)] text-[var(--aq-accent)]"}`}>
                            {dead ? "caido" : "ativo"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div>
                        <div className="mb-1 flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-[var(--aq-text-muted)]">
                          <span>Vida</span>
                          <span>{vida ? `${vida.atual}/${vida.max}` : "--"}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[rgba(255,255,255,0.06)]">
                          <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 via-lime-400 to-red-500" style={{ width: `${hpRatio * 100}%` }} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[9px] uppercase tracking-[0.18em] text-[var(--aq-text-muted)]">
                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <span>PE</span>
                            <span>{pe ? `${pe.atual}/${pe.max}` : "--"}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)]">
                            <div className="h-1.5 rounded-full bg-[var(--aq-accent)]" style={{ width: `${peRatio * 100}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <span>San</span>
                            <span>{sanidade ? `${sanidade.atual}/${sanidade.max}` : "--"}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)]">
                            <div className="h-1.5 rounded-full bg-violet-400" style={{ width: `${sanRatio * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-[1500px] items-center justify-center rounded-[30px] border border-dashed border-[var(--aq-border)] bg-[rgba(8,13,20,0.72)] px-6 py-8 text-center text-[11px] uppercase tracking-[0.24em] text-[var(--aq-text-muted)] md:py-10">
              {role === "mestre" ? "Vincule fichas aos tokens para montar a barra de retratos viva da mesa." : "Espere o mestre vincular os personagens para preencher a faixa de retratos."}
            </div>
          )}
        </div>
      ) : null}
    </main>
  );
}
