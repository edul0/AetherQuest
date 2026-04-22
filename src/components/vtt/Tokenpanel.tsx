"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";
import { Token, FichaVTTSnapshot } from "@/src/lib/types";
import {
  X,
  Link2,
  Swords,
  Heart,
  ChevronLeft,
  ChevronRight,
  User,
  Skull,
  Sparkles,
  ScrollText,
  AlertTriangle,
  Trash2,
} from "lucide-react";

function HPBar({ current, max, label, color }: { current: number; max: number; label: string; color: string }) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
  const hpColor = ratio > 0.5 ? "#22c55e" : ratio > 0.25 ? "#f59e0b" : "#ef4444";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>{label}</span>
        <span className="font-mono text-[10px] font-black tabular-nums text-white">{current} / {max}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ background: "#0a0f18", border: "1px solid #1a2b4c" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${ratio * 100}%`, backgroundColor: hpColor }} />
      </div>
    </div>
  );
}

function DamageControl({
  value,
  onChange,
  onDamage,
  onHeal,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  onDamage: () => void;
  onHeal: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-1 items-center overflow-hidden rounded-lg" style={{ background: "#0a0f18", border: "1px solid #1a2b4c" }}>
        <button onClick={() => onChange(Math.max(1, value - 1))} className="px-2 py-2 text-[#6b7b94] transition-colors hover:text-[#4ad9d9]">
          <ChevronLeft size={12} />
        </button>
        <input
          type="number"
          value={value}
          min={1}
          onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-0 flex-1 bg-transparent text-center text-sm font-black text-white outline-none"
          style={{ fontFamily: "monospace" }}
        />
        <button onClick={() => onChange(value + 1)} className="px-2 py-2 text-[#6b7b94] transition-colors hover:text-[#4ad9d9]">
          <ChevronRight size={12} />
        </button>
      </div>

      <button
        onClick={onDamage}
        disabled={disabled}
        className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[10px] font-black uppercase text-red-300 transition-all hover:bg-red-500/20 disabled:opacity-40"
        title="Aplicar dano"
      >
        <Skull size={11} />
        <span>DMG</span>
      </button>

      <button
        onClick={onHeal}
        disabled={disabled}
        className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[10px] font-black uppercase text-emerald-300 transition-all hover:bg-emerald-500/20 disabled:opacity-40"
        title="Curar"
      >
        <Heart size={11} />
        <span>CUR</span>
      </button>
    </div>
  );
}

interface TokenPanelProps {
  token: Token | null;
  fichaData: FichaVTTSnapshot | null;
  onClose: () => void;
  onTokenUpdate: (updated: Token) => void;
}

export default function TokenPanel({ token, fichaData, onClose, onTokenUpdate }: TokenPanelProps) {
  const router = useRouter();
  const [fichasList, setFichasList] = useState<any[]>([]);
  const [showVincular, setShowVincular] = useState(false);
  const [danoValor, setDanoValor] = useState(5);
  const [loading, setLoading] = useState(false);
  const [fallbackFicha, setFallbackFicha] = useState<FichaVTTSnapshot | null>(null);
  const [fichaLoadError, setFichaLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const fichaEfetiva = fichaData ?? fallbackFicha;

  useEffect(() => {
    setShowVincular(false);
    setFallbackFicha(null);
    setFichaLoadError("");
    setActionError("");
  }, [token?.id]);

  useEffect(() => {
    if (!token?.ficha_id || fichaData) {
      setFallbackFicha(null);
      setFichaLoadError("");
      return;
    }

    let active = true;

    const carregarFichaVinculada = async () => {
      setFichaLoadError("");
      const { data, error } = await supabase
        .from("fichas")
        .select("id, nome_personagem, sistema_preset, avatar_url, dados")
        .eq("id", token.ficha_id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error("[TokenPanel] Erro ao puxar ficha vinculada:", error);
        setFallbackFicha(null);
        setFichaLoadError(error.message);
        return;
      }

      if (!data) {
        setFallbackFicha(null);
        setFichaLoadError("Ficha vinculada nao encontrada ou sem permissao para leitura.");
        return;
      }

      setFallbackFicha(data as FichaVTTSnapshot);
    };

    void carregarFichaVinculada();

    return () => {
      active = false;
    };
  }, [fichaData, token?.ficha_id]);

  const carregarFichas = useCallback(async () => {
    const { data, error } = await supabase.from("fichas").select("id, nome_personagem, sistema_preset").order("nome_personagem");
    if (error) {
      console.error("[TokenPanel] Erro ao carregar fichas:", error);
      setFichasList([]);
      return;
    }
    setFichasList(data ?? []);
  }, []);

  useEffect(() => {
    if (showVincular) carregarFichas();
  }, [showVincular, carregarFichas]);

  const vincularFicha = async (fichaId: string) => {
    if (!token) return;
    setLoading(true);
    setActionError("");
    const { data, error } = await supabase.from("tokens").update({ ficha_id: fichaId }).eq("id", token.id).select().single();

    if (error) {
      console.error("[TokenPanel] Erro ao vincular ficha:", error);
      setActionError(`Nao foi possivel vincular ficha: ${error.message}`);
    }

    if (!error && data) {
      onTokenUpdate(data as Token);
      setFallbackFicha(null);
      setFichaLoadError("");
    }
    setShowVincular(false);
    setLoading(false);
  };

  const desvincularFicha = async () => {
    if (!token) return;
    setLoading(true);
    setActionError("");
    const { error } = await supabase.from("tokens").update({ ficha_id: null }).eq("id", token.id);
    if (error) {
      setActionError(`Nao foi possivel desvincular ficha: ${error.message}`);
      setLoading(false);
      return;
    }
    onTokenUpdate({ ...token, ficha_id: null });
    setFallbackFicha(null);
    setFichaLoadError("");
    setLoading(false);
  };

  const removerToken = async () => {
    if (!token) return;
    const shouldDelete = window.confirm(`Remover o token "${token.nome}" do mapa?`);
    if (!shouldDelete) return;

    setLoading(true);
    setActionError("");
    const { error } = await supabase.from("tokens").delete().eq("id", token.id);

    if (error) {
      console.error("[TokenPanel] Erro ao remover token:", error);
      setActionError(`Nao foi possivel remover token: ${error.message}`);
      setLoading(false);
      return;
    }

    setLoading(false);
    onClose();
  };

  const modificarVida = async (delta: number) => {
    if (!token?.ficha_id || !fichaEfetiva) return;
    setLoading(true);
    setActionError("");

    const vidaAtual = fichaEfetiva.dados?.status?.vida?.atual ?? 0;
    const vidaMax = fichaEfetiva.dados?.status?.vida?.max ?? 0;
    const novaVida = Math.max(0, Math.min(vidaMax, vidaAtual + delta));

    const novosDados = {
      ...fichaEfetiva.dados,
      status: {
        ...fichaEfetiva.dados?.status,
        vida: {
          ...fichaEfetiva.dados?.status?.vida,
          atual: novaVida,
        },
      },
    };

    const { error } = await supabase.from("fichas").update({ dados: novosDados }).eq("id", token.ficha_id);

    if (error) {
      console.error("[TokenPanel] Erro ao modificar vida:", error.message);
      setActionError(`Nao foi possivel alterar vida: ${error.message}`);
    }
    setLoading(false);
  };

  const alterarStatus = async (key: "vida" | "pe" | "sanidade", delta: number) => {
    if (!token?.ficha_id || !fichaEfetiva) return;
    setLoading(true);
    setActionError("");

    const statusAtual = fichaEfetiva.dados?.status?.[key];
    const atual = statusAtual?.atual ?? 0;
    const max = statusAtual?.max ?? 0;
    const proximoValor = Math.max(0, Math.min(max, atual + delta));

    const novosDados = {
      ...fichaEfetiva.dados,
      status: {
        ...fichaEfetiva.dados?.status,
        [key]: {
          ...statusAtual,
          atual: proximoValor,
        },
      },
    };

    const { error } = await supabase.from("fichas").update({ dados: novosDados }).eq("id", token.ficha_id);

    if (error) {
      console.error(`[TokenPanel] Erro ao modificar ${key}:`, error.message);
      setActionError(`Nao foi possivel alterar ${key}: ${error.message}`);
    }
    setLoading(false);
  };

  if (!token) return null;

  const vida = fichaEfetiva?.dados?.status?.vida;
  const pe = fichaEfetiva?.dados?.status?.pe;
  const sanidade = fichaEfetiva?.dados?.status?.sanidade;

  return (
    <div
      className="fixed bottom-24 right-3 z-50 max-h-[70vh] w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl md:bottom-auto md:right-4 md:top-1/2 md:w-72 md:-translate-y-1/2"
      style={{
        background: "rgba(10, 15, 24, 0.97)",
        backdropFilter: "blur(16px)",
        border: "1px solid #1a2b4c",
        boxShadow: "0 0 40px rgba(74, 217, 217, 0.06), 0 24px 64px rgba(0,0,0,0.6)",
      }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #1a2b4c", background: "rgba(5,10,16,0.72)" }}>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full ring-1 ring-white/20" style={{ backgroundColor: token.cor || "#ef4444" }} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "#4ad9d9" }}>Token</span>
        </div>
        <button onClick={onClose} className="text-[#6b7b94] transition-colors hover:text-[#4ad9d9]">
          <X size={14} />
        </button>
      </div>

      <div className="aq-scrollbar max-h-[calc(70vh-80px)] space-y-4 overflow-y-auto p-4">
        <div>
          <p className="mb-1 text-[9px] font-black uppercase tracking-widest" style={{ color: "#6b7b94" }}>Nome</p>
          <p className="text-base font-bold text-white" style={{ fontFamily: "monospace" }}>{token.nome}</p>
        </div>

        {actionError ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] leading-relaxed text-red-100">{actionError}</div>
        ) : null}

        {fichaEfetiva ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-[rgba(74,217,217,0.15)] bg-[rgba(74,217,217,0.04)] px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-[rgba(74,217,217,0.2)] bg-[rgba(74,217,217,0.1)]">
                    <User size={13} style={{ color: "#4ad9d9" }} />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider" style={{ color: "#8b9bb4" }}>Ficha vinculada</p>
                    <p className="text-[12px] font-bold leading-tight text-white">{fichaEfetiva.nome_personagem}</p>
                    <p className="text-[9px] uppercase tracking-wider" style={{ color: "#6b7b94" }}>{fichaEfetiva.sistema_preset?.replace("_", " ")}</p>
                  </div>
                </div>
                <button onClick={desvincularFicha} disabled={loading} title="Desvincular ficha" className="text-[#6b7b94] transition-colors hover:text-red-300 disabled:opacity-40">
                  <X size={14} />
                </button>
              </div>

              {token.ficha_id ? (
                <button
                  onClick={() => router.push(`/fichas/${token.ficha_id}`)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(74,217,217,0.24)] bg-[rgba(74,217,217,0.08)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--aq-accent)] transition-all hover:bg-[rgba(74,217,217,0.14)]"
                >
                  <ScrollText size={12} />
                  Abrir ficha vinculada
                </button>
              ) : null}
            </div>

            <div className="space-y-2.5">
              {vida && <HPBar current={vida.atual} max={vida.max} label="Vida" color="#f87171" />}
              {pe && pe.max > 0 && <HPBar current={pe.atual} max={pe.max} label="PE" color="#4ad9d9" />}
              {sanidade && sanidade.max > 0 && <HPBar current={sanidade.atual} max={sanidade.max} label="Sanidade" color="#c084fc" />}
            </div>

            <div style={{ borderTop: "1px solid #1a2b4c" }} />

            <div>
              <p className="mb-2 text-[9px] font-black uppercase tracking-widest" style={{ color: "#6b7b94" }}>
                <Swords size={9} className="mr-1 inline" />
                Efeito de Combate
              </p>
              <div className="space-y-3">
                <DamageControl value={danoValor} onChange={setDanoValor} onDamage={() => modificarVida(-danoValor)} onHeal={() => modificarVida(+danoValor)} disabled={loading || !vida} />
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => alterarStatus("pe", -1)} disabled={loading || !pe} className="rounded-lg border border-[rgba(74,217,217,0.25)] bg-[rgba(74,217,217,0.08)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--aq-accent)] disabled:opacity-40">-1 PE</button>
                  <button onClick={() => alterarStatus("pe", 1)} disabled={loading || !pe} className="rounded-lg border border-[rgba(74,217,217,0.25)] bg-[rgba(74,217,217,0.08)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--aq-accent)] disabled:opacity-40">+1 PE</button>
                  <button onClick={() => alterarStatus("sanidade", -1)} disabled={loading || !sanidade} className="rounded-lg border border-[rgba(192,132,252,0.25)] bg-[rgba(192,132,252,0.08)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#d8b4fe] disabled:opacity-40">-1 SAN</button>
                  <button onClick={() => alterarStatus("sanidade", 1)} disabled={loading || !sanidade} className="rounded-lg border border-[rgba(192,132,252,0.25)] bg-[rgba(192,132,252,0.08)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#d8b4fe] disabled:opacity-40">+1 SAN</button>
                </div>
              </div>
            </div>
          </div>
        ) : token.ficha_id ? (
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-4 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-400/10 text-amber-200 ring-1 ring-amber-400/20">
              <AlertTriangle size={20} />
            </div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-amber-100">Ficha nao carregou</p>
            <p className="mb-4 text-[10px] leading-relaxed text-amber-100/70">
              O token tem ficha vinculada, mas a mesa nao conseguiu ler essa ficha agora.
              {fichaLoadError ? ` Erro: ${fichaLoadError}` : " Tentando sincronizar..."}
            </p>
            <div className="grid gap-2">
              <button onClick={() => router.push(`/fichas/${token.ficha_id}`)} className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-amber-100">Abrir ficha vinculada</button>
              <button onClick={desvincularFicha} disabled={loading} className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-200 disabled:opacity-40">Desvincular ficha</button>
            </div>
          </div>
        ) : (
          <div className="py-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#1a2b4c] bg-[rgba(26,43,76,0.34)]">
              <Link2 size={20} style={{ color: "#6b7b94" }} />
            </div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest" style={{ color: "#8b9bb4" }}>Token sem ficha</p>
            <p className="mb-4 text-[10px]" style={{ color: "#6b7b94" }}>
              Vincule uma ficha para ativar
              <br />
              HP bar e sincronizacao Realtime.
            </p>
            <button onClick={() => setShowVincular((v) => !v)} className="rounded-lg border border-[rgba(74,217,217,0.25)] bg-[rgba(74,217,217,0.08)] px-5 py-2 text-[10px] font-black uppercase tracking-widest text-[#4ad9d9] transition-all hover:bg-[rgba(74,217,217,0.15)]">
              <Sparkles size={11} className="mr-1 inline" />
              Vincular Ficha
            </button>
          </div>
        )}

        {showVincular ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-2" style={{ borderBottom: "1px solid #1a2b4c" }}>
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#4ad9d9" }}>Selecionar Ficha</span>
              <button onClick={() => setShowVincular(false)} className="text-[#6b7b94] hover:text-white"><X size={12} /></button>
            </div>

            <div className="max-h-44 space-y-1 overflow-y-auto pr-0.5" style={{ scrollbarWidth: "thin", scrollbarColor: "#1a2b4c transparent" }}>
              {fichasList.length === 0 ? (
                <p className="py-4 text-center text-[10px] uppercase tracking-widest" style={{ color: "#6b7b94" }}>Nenhuma ficha encontrada</p>
              ) : (
                fichasList.map((f) => (
                  <button key={f.id} onClick={() => vincularFicha(f.id)} disabled={loading} className="group w-full rounded-lg border border-[#1a2b4c] bg-[rgba(5,10,16,0.8)] px-3 py-2.5 text-left transition-all hover:border-[rgba(74,217,217,0.25)] hover:bg-[rgba(74,217,217,0.06)] disabled:opacity-40">
                    <p className="text-[11px] font-bold text-white">{f.nome_personagem}</p>
                    <p className="mt-0.5 text-[9px] uppercase tracking-wider" style={{ color: "#6b7b94" }}>{f.sistema_preset?.replace("_", " ")}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}

        <button
          onClick={removerToken}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-red-200 transition-all hover:bg-red-500/18 disabled:opacity-40"
        >
          <Trash2 size={13} />
          {loading ? "Processando" : "Remover token do mapa"}
        </button>
      </div>

      <div className="px-4 py-2.5" style={{ borderTop: "1px solid #1a2b4c", background: "rgba(5,10,16,0.72)" }}>
        <p className="text-center text-[8px] uppercase tracking-widest" style={{ color: "#41556f" }}>
          Supabase Realtime - Sync bidirecional
        </p>
      </div>
    </div>
  );
}
