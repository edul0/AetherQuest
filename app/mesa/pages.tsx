"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Cinzel, Inter } from "next/font/google";
import { ArrowLeft, Crosshair, Layers3, Plus, ScrollText, Sparkles } from "lucide-react";
import { supabase } from "../../src/lib/supabase";
import { Token, FichaVTTSnapshot } from "../../src/lib/types";
import VTTCanvas from "../../src/components/vtt/VTTCanvas";
import SceneNav from "../../src/components/vtt/SceneNav";
import VTTControls from "../../src/components/vtt/VTTControls";
import TokenPanel from "../../src/components/vtt/Tokenpanel";
import Chat from "../../src/components/vtt/Chat";

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

export default function MesaPage() {
  const router = useRouter();
  const [salas, setSalas] = useState<Sala[]>([]);
  const [cenas, setCenas] = useState<Cena[]>([]);
  const [loading, setLoading] = useState(true);
  const [salaAtiva, setSalaAtiva] = useState<Sala | null>(null);
  const [cenaAtiva, setCenaAtiva] = useState<Cena | null>(null);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [fichasMap, setFichasMap] = useState<Record<string, FichaVTTSnapshot>>({});

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
      .on("postgres_changes", { event: "*", schema: "public", table: "salas" }, () => {
        carregarSalas();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  const fichaSelecionada = useMemo(() => {
    if (!selectedToken?.ficha_id) {
      return null;
    }
    return fichasMap[selectedToken.ficha_id] ?? null;
  }, [fichasMap, selectedToken]);

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
    <main className={`aq-page overflow-hidden ${inter.className}`}>
      {salaAtiva && cenaAtiva ? (
        <>
          <VTTCanvas
            cenaId={cenaAtiva.id}
            mapaUrl={cenaAtiva.mapa_url ?? undefined}
            selectedTokenId={selectedToken?.id ?? null}
            onSelectToken={setSelectedToken}
            onFichasMapChange={setFichasMap}
          />
          <SceneNav salaId={salaAtiva.id} onSelectCena={setCenaAtiva} cenaAtivaId={cenaAtiva.id} />
          <VTTControls cenaId={cenaAtiva.id} />
          <TokenPanel
            token={selectedToken}
            fichaData={fichaSelecionada}
            onClose={() => setSelectedToken(null)}
            onTokenUpdate={setSelectedToken}
          />
          <Chat salaId={salaAtiva.id} />
        </>
      ) : null}

      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(74,217,217,0.06),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(26,43,76,0.18),transparent_30%)]" />

      <div className="pointer-events-none fixed left-4 top-4 z-50 md:left-6 md:top-20">
        <div className="pointer-events-auto aq-panel w-[360px] max-w-[calc(100vw-2rem)] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="aq-kicker">Bridge Deck</div>
              <h1 className={`${cinzel.className} mt-2 text-3xl font-black tracking-[0.08em] text-[var(--aq-title)]`}>
                Mesa Tatica
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-[var(--aq-text-muted)]">
                O teu cockpit de mestre para mapas, tokens, salas e fichas vinculadas em tempo real.
              </p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="rounded-full border border-[var(--aq-border)] p-2 text-[var(--aq-text-subtle)] transition-colors hover:text-white"
            >
              <ArrowLeft size={16} />
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {salas.map((sala) => (
              <button
                key={sala.id}
                onClick={() => setSalaAtiva(sala)}
                className={salaAtiva?.id === sala.id ? "aq-button-primary" : "aq-button-secondary"}
              >
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
                <span className="aq-kicker">Token</span>
              </div>
              <div className="mt-3 text-sm font-bold text-[var(--aq-title)]">
                {selectedToken ? selectedToken.nome : "Nenhum selecionado"}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-4">
              <div className="flex items-center gap-2 text-[var(--aq-accent)]">
                <Sparkles size={16} />
                <span className="aq-kicker">Mapa</span>
              </div>
              <div className="mt-3 text-sm font-bold text-[var(--aq-title)]">
                {cenaAtiva?.mapa_url ? "Cena com mapa" : "Upload pendente"}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={criarCenaInicial} className="aq-button-primary">
              <Plus size={14} />
              Nova Cena
            </button>
            <button onClick={() => router.push("/fichas")} className="aq-button-secondary">
              <ScrollText size={14} />
              Abrir Fichas
            </button>
          </div>
        </div>
      </div>

      {!salaAtiva ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-6">
          <div className="aq-panel max-w-2xl p-8 text-center">
            <div className="aq-kicker">No Signal</div>
            <h2 className={`${cinzel.className} mt-3 text-4xl font-black tracking-[0.08em] text-[var(--aq-title)]`}>
              Nenhuma sala ativa
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--aq-text-muted)]">
              Cria uma jornada para acender a mesa. A partir daqui ficas com cenas, upload de mapas, tokens e sincronizacao com fichas.
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
              Cria a primeira cena
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--aq-text-muted)]">
              A sala ja existe. Agora falta abrir o palco: cria uma cena para receber mapas, grid e movimentacao tática.
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
