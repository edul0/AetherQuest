"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Cinzel, Inter } from "next/font/google";
import {
  ArrowLeft,
  Crosshair,
  Eye,
  Layers3,
  Plus,
  ScrollText,
  Sparkles,
  Users,
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

export default function MesaClient() {
  const router = useRouter();
  const [salas, setSalas] = useState<Sala[]>([]);
  const [cenas, setCenas] = useState<Cena[]>([]);
  const [fichas, setFichas] = useState<FichaListItem[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [modoMesa, setModoMesa] = useState<"mestre" | "jogador">("mestre");
  const [salaAtiva, setSalaAtiva] = useState<Sala | null>(null);
  const [cenaAtiva, setCenaAtiva] = useState<Cena | null>(null);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [fichaEscolhidaId, setFichaEscolhidaId] = useState<string>("");
  const [fichaParaTokenId, setFichaParaTokenId] = useState<string>("");
  const [tokenLabel, setTokenLabel] = useState<string>("");
  const [fichasMap, setFichasMap] = useState<Record<string, FichaVTTSnapshot>>({});
  const [scenePreferences, setScenePreferences] = useState<SceneViewPreferences>(DEFAULT_SCENE_VIEW_PREFERENCES);

  useEffect(() => {
    const carregarSalas = async () => {
      try {
        const { data, error } = await supabase.from("salas").select("*");
        if (error) {
          throw error;
        }

        const nextSalas = (data ?? []) as Sala[];
        setSalas(nextSalas);
        if (nextSalas.length > 0) {
          setSalaAtiva((current) => current ?? nextSalas[0]);
        }
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
    if (!cenaAtiva?.id || !fichaParaTokenId) {
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
    }
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

  return (
    <main className={`aq-page overflow-x-hidden ${inter.className}`}>
      {salaAtiva && cenaAtiva ? (
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
          <VTTControls cenaId={cenaAtiva.id} preferences={scenePreferences} onPreferencesChange={updateScenePreferences} />
          <TokenPanel token={selectedToken} fichaData={fichaSelecionada} onClose={() => setSelectedToken(null)} onTokenUpdate={setSelectedToken} />
          <Chat salaId={salaAtiva.id} />
        </>
      ) : null}

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(74,217,217,0.06),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(26,43,76,0.18),transparent_30%)]" />

      <div className="pointer-events-none fixed left-4 top-4 z-50 md:left-6 md:top-20">
        <div className="pointer-events-auto aq-panel w-[390px] max-w-[calc(100vw-2rem)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="aq-kicker">Bridge Deck</div>
              <h1 className={`${cinzel.className} mt-2 text-3xl font-black tracking-[0.08em] text-[var(--aq-title)]`}>
                Mesa Tatica
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[var(--aq-text-muted)]">
                Mestre cria a sessao, jogador escolhe a ficha e o estado fica espelhado em tempo real na mesa.
              </p>
            </div>
            <button onClick={() => router.push("/")} className="rounded-full border border-[var(--aq-border)] p-2 text-[var(--aq-text-subtle)] transition-colors hover:text-white">
              <ArrowLeft size={16} />
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => setModoMesa("mestre")} className={modoMesa === "mestre" ? "aq-button-primary" : "aq-button-secondary"}>
              <Eye size={14} />
              Mestre
            </button>
            <button onClick={() => setModoMesa("jogador")} className={modoMesa === "jogador" ? "aq-button-primary" : "aq-button-secondary"}>
              <Users size={14} />
              Jogador
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {salas.map((sala) => (
              <button key={sala.id} onClick={() => setSalaAtiva(sala)} className={salaAtiva?.id === sala.id ? "aq-button-primary" : "aq-button-secondary"}>
                {sala.nome}
              </button>
            ))}
            <button onClick={criarSala} className="aq-button-secondary">
              <Plus size={14} />
              Nova Sala
            </button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-4">
              <div className="flex items-center gap-2 text-[var(--aq-accent)]">
                <Layers3 size={16} />
                <span className="aq-kicker">Cenas</span>
              </div>
              <div className="mt-3 text-2xl font-black text-[var(--aq-title)]">{cenas.length}</div>
            </div>
            <div className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-4">
              <div className="flex items-center gap-2 text-[var(--aq-accent)]">
                <Crosshair size={16} />
                <span className="aq-kicker">Tokens</span>
              </div>
              <div className="mt-3 text-2xl font-black text-[var(--aq-title)]">{tokens.length}</div>
            </div>
            <div className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-4">
              <div className="flex items-center gap-2 text-[var(--aq-accent)]">
                <Sparkles size={16} />
                <span className="aq-kicker">Mapa</span>
              </div>
              <div className="mt-3 text-sm font-bold text-[var(--aq-title)]">{cenaAtiva?.mapa_url ? "Cena com mapa" : "Upload pendente"}</div>
            </div>
          </div>

          {cenaAtiva ? (
            <div className="mt-4 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-4 text-xs uppercase tracking-[0.18em] text-[var(--aq-text-muted)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>{`Ferramenta: ${scenePreferences.toolMode}`}</span>
                <span>{`Grid: ${scenePreferences.gridSize}px`}</span>
                <span>{scenePreferences.snapToGrid ? "Snap ativo" : "Snap livre"}</span>
              </div>
            </div>
          ) : null}

          {modoMesa === "jogador" ? (
            <div className="mt-5 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-4">
              <div className="aq-kicker">Entrar na Sessao</div>
              <p className="mt-2 text-sm text-[var(--aq-text-muted)]">
                Escolha a ficha que voce vai usar nesta mesa. Se o mestre ja vinculou um token, a visao fica focada nessa ficha.
              </p>
              <select value={fichaEscolhidaId} onChange={(e) => setFichaEscolhidaId(e.target.value)} className="aq-input mt-3">
                <option value="">Selecione uma ficha</option>
                {fichas.map((ficha) => (
                  <option key={ficha.id} value={ficha.id}>
                    {ficha.nome_personagem} | {ficha.sistema_preset}
                  </option>
                ))}
              </select>
              <div className="mt-3 flex flex-wrap gap-3">
                <button onClick={vincularFichaComoJogador} className="aq-button-primary" disabled={!fichaEscolhidaId}>
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
          ) : (
            <div className="mt-5 space-y-4">
              <div className="flex flex-wrap gap-3">
                <button onClick={criarCenaInicial} className="aq-button-primary">
                  <Plus size={14} />
                  Nova Cena
                </button>
                <button onClick={() => router.push("/fichas")} className="aq-button-secondary">
                  <ScrollText size={14} />
                  Abrir Fichas
                </button>
              </div>

              <div className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-4">
                <div className="aq-kicker">Controle do Mestre</div>
                <p className="mt-2 text-sm text-[var(--aq-text-muted)]">
                  Vincule uma ficha a um token da cena atual. Assim o mestre passa a ter leitura total da ficha e o estado de vida, PE e sanidade fica espelhado na mesa.
                </p>
                <div className="mt-4 space-y-3">
                  <select value={fichaParaTokenId} onChange={(e) => setFichaParaTokenId(e.target.value)} className="aq-input">
                    <option value="">Escolha uma ficha para colocar no mapa</option>
                    {fichas.map((ficha) => (
                      <option key={ficha.id} value={ficha.id}>
                        {ficha.nome_personagem} | {ficha.sistema_preset}
                      </option>
                    ))}
                  </select>
                  <input
                    value={tokenLabel}
                    onChange={(e) => setTokenLabel(e.target.value)}
                    placeholder="Nome do token no mapa (opcional)"
                    className="aq-input"
                  />
                  <button onClick={criarTokenDaFicha} disabled={!fichaParaTokenId || !cenaAtiva?.id} className="aq-button-primary disabled:opacity-50">
                    <Plus size={14} />
                    Colocar ficha na cena
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {roster.length > 0 ? (
        <div className="fixed bottom-4 left-1/2 z-50 flex w-[min(1100px,calc(100vw-2rem))] -translate-x-1/2 gap-3 overflow-x-auto">
          {roster.map(({ token, ficha, vida, pe, sanidade, dead }) => (
            <button
              key={token.id}
              onClick={() => setSelectedToken(token)}
              className={`aq-panel min-w-[220px] p-4 text-left transition-all ${dead ? "opacity-65 grayscale" : ""}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-[var(--aq-title)]">{ficha?.nome_personagem ?? token.nome}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[var(--aq-text-muted)]">{token.nome}</div>
                </div>
                <div className="h-3 w-3 rounded-full ring-1 ring-white/20" style={{ backgroundColor: dead ? "#6b7280" : token.cor || "#4ad9d9" }} />
              </div>
              <div className="mt-3 space-y-2 text-xs text-[var(--aq-text)]">
                <div>{`HP ${vida?.atual ?? 0}/${vida?.max ?? 0}`}</div>
                <div>{`PE ${pe?.atual ?? 0}/${pe?.max ?? 0}`}</div>
                <div>{`SAN ${sanidade?.atual ?? 0}/${sanidade?.max ?? 0}`}</div>
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {!salaAtiva ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-6">
          <div className="aq-panel max-w-2xl p-8 text-center">
            <div className="aq-kicker">No Signal</div>
            <h2 className={`${cinzel.className} mt-3 text-4xl font-black tracking-[0.08em] text-[var(--aq-title)]`}>
              Nenhuma sala ativa
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--aq-text-muted)]">
              Crie uma jornada para abrir a mesa. Depois disso o mestre controla cenas, tokens e visibilidade.
            </p>
            <button onClick={criarSala} className="aq-button-primary mt-8">
              <Plus size={14} />
              Criar primeira sala
            </button>
          </div>
        </div>
      ) : null}

      {salaAtiva && !cenaAtiva ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-6">
          <div className="aq-panel max-w-2xl p-8 text-center">
            <div className="aq-kicker">Scene Boot</div>
            <h2 className={`${cinzel.className} mt-3 text-4xl font-black tracking-[0.08em] text-[var(--aq-title)]`}>
              Crie a primeira cena
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--aq-text-muted)]">
              Use cenas como slides de exploracao: patio, sala principal, quarto secreto e qualquer outra variacao do mapa.
            </p>
            <button onClick={criarCenaInicial} className="aq-button-primary mt-8">
              <Plus size={14} />
              Criar cena inicial
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
