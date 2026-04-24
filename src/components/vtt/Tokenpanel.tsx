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
  Image as ImageIcon,
} from "lucide-react";

function HPBar({ current, max, label, color }: { current: number; max: number; label: string; color: string }) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
  const hpColor = ratio > 0.5 ? "var(--aq-success)" : ratio > 0.25 ? "#f59e0b" : "var(--aq-danger)";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>{label}</span>
        <span className="font-mono text-[10px] font-black tabular-nums text-[var(--aq-title)]">{current} / {max}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-[0.25rem] border border-[var(--aq-border)] bg-[var(--aq-surface)]">
        <div className="h-full rounded-[0.25rem] transition-all duration-500" style={{ width: `${ratio * 100}%`, backgroundColor: hpColor, boxShadow: `0 0 8px ${hpColor}` }} />
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
      <div className="flex flex-1 items-center overflow-hidden rounded-[0.35rem] border border-[var(--aq-border)] bg-[var(--aq-surface)]">
        <button onClick={() => onChange(Math.max(1, value - 1))} className="px-2 py-2 text-[var(--aq-text-muted)] transition-colors hover:text-[var(--aq-accent)]">
          <ChevronLeft size={14} />
        </button>
        <input
          type="number"
          value={value}
          min={1}
          onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-0 flex-1 bg-transparent text-center text-sm font-black text-[var(--aq-title)] outline-none"
          style={{ fontFamily: "monospace" }}
        />
        <button onClick={() => onChange(value + 1)} className="px-2 py-2 text-[var(--aq-text-muted)] transition-colors hover:text-[var(--aq-accent)]">
          <ChevronRight size={14} />
        </button>
      </div>

      <button
        onClick={onDamage}
        disabled={disabled}
        className="flex items-center gap-1 rounded-[0.35rem] border border-[var(--aq-danger)]/50 bg-[var(--aq-danger)]/10 px-3 py-2 text-[10px] font-black uppercase text-[var(--aq-danger)] transition-all hover:bg-[var(--aq-danger)]/20 disabled:opacity-40"
        title="Aplicar dano"
      >
        <Skull size={12} />
        <span>DMG</span>
      </button>

      <button
        onClick={onHeal}
        disabled={disabled}
        className="flex items-center gap-1 rounded-[0.35rem] border border-[var(--aq-success)]/50 bg-[var(--aq-success)]/10 px-3 py-2 text-[10px] font-black uppercase text-[var(--aq-success)] transition-all hover:bg-[var(--aq-success)]/20 disabled:opacity-40"
        title="Curar"
      >
        <Heart size={12} />
        <span>CUR</span>
      </button>
    </div>
  );
}

interface TokenPanelProps {
  token: Token | null;
  fichaData: FichaVTTSnapshot | null;
  salaId?: string | null;
  onClose: () => void;
  onTokenUpdate: (updated: Token) => void;
}

export default function TokenPanel({ token, fichaData, salaId, onClose, onTokenUpdate }: TokenPanelProps) {
  const router = useRouter();
  const [fichasList, setFichasList] = useState<any[]>([]);
  const [showVincular, setShowVincular] = useState(false);
  const [danoValor, setDanoValor] = useState(5);
  const [loading, setLoading] = useState(false);
  const [fallbackFicha, setFallbackFicha] = useState<FichaVTTSnapshot | null>(null);
  const [fichaLoadError, setFichaLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const fichaEfetiva = fichaData ?? fallbackFicha;
  const mesaQuery = salaId ? `?mesa=${encodeURIComponent(salaId)}&from=mesa` : "";
  const fichaHref = (fichaId: string) => `/fichas/${fichaId}${mesaQuery}`;
  const tokenImagesHref = (fichaId: string) => `/fichas/${fichaId}/tokens${mesaQuery}`;

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
    <div className="fixed bottom-20 right-3 z-50 max-h-[70vh] w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden aq-panel md:bottom-auto md:right-4 md:top-1/2 md:w-72 md:-translate-y-1/2">
      
      {/* Cabeçalho do Painel */}
      <div className="flex items-center justify-between border-b border-[var(--aq-border)] bg-[var(--aq-surface)] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-3 w-3 rounded-[0.2rem] ring-1 ring-white/20" style={{ backgroundColor: token.cor || "#ef4444", boxShadow: `0 0 8px ${token.cor || "#ef4444"}` }} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--aq-accent)] drop-shadow-[0_0_8px_var(--aq-accent-soft)]">Token</span>
        </div>
        <button onClick={onClose} className="text-[var(--aq-text-muted)] transition-colors hover:text-[var(--aq-accent)]">
          <X size={16} />
        </button>
      </div>

      <div className="aq-scrollbar max-h-[calc(70vh-80px)] space-y-5 overflow-y-auto p-5">
        <div>
          <p className="aq-kicker">Nome</p>
          <p className="text-base font-bold text-[var(--aq-title)]" style={{ fontFamily: "monospace" }}>{token.nome}</p>
        </div>

        {actionError ? (
          <div className="rounded-[0.4rem] border border-[var(--aq-danger)]/50 bg-[var(--aq-danger)]/10 px-3 py-2 text-[11px] leading-relaxed text-[var(--aq-title)]">{actionError}</div>
        ) : null}

        {fichaEfetiva ? (
          <div className="space-y-4">
            {/* Bloco de Ficha Vinculada */}
            <div className="rounded-[0.5rem] border border-[var(--aq-border-strong)] bg-[var(--aq-accent-soft)] px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[0.35rem] border border-[var(--aq-accent)] bg-[var(--aq-accent-soft)] shadow-[0_0_12px_var(--aq-accent-soft)]">
                    <User size={16} className="text-[var(--aq-accent)]" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-[var(--aq-text)]">Ficha vinculada</p>
                    <p className="text-sm font-bold leading-tight text-[var(--aq-title)]">{fichaEfetiva.nome_personagem}</p>
                    <p className="text-[9px] uppercase tracking-wider text-[var(--aq-text-muted)] mt-0.5">{fichaEfetiva.sistema_preset?.replace("_", " ")}</p>
                  </div>
                </div>
                <button onClick={desvincularFicha} disabled={loading} title="Desvincular ficha" className="text-[var(--aq-text-muted)] transition-colors hover:text-[var(--aq-danger)] disabled:opacity-40">
                  <X size={16} />
                </button>
              </div>

              {token.ficha_id ? (
                <div className="mt-4 grid gap-2.5">
                  <button
                    onClick={() => router.push(fichaHref(token.ficha_id!))}
                    className="aq-button-primary w-full"
                  >
                    <ScrollText size={14} />
                    Abrir grimório
                  </button>
                  <button
                    onClick={() => router.push(tokenImagesHref(token.ficha_id!))}
                    className="aq-button-secondary w-full"
                  >
                    <ImageIcon size={14} />
                    Imagens do token
                  </button>
                  <button
                    onClick={desvincularFicha}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-[0.35rem] border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-amber-200 transition-all hover:bg-amber-500/20 disabled:opacity-40"
                  >
                    <Link2 size={12} />
                    Romper elo
                  </button>
                </div>
              ) : null}
            </div>

            {/* Status (HP, PE, SAN) */}
            <div className="space-y-3">
              {vida && <HPBar current={vida.atual} max={vida.max} label="Vida" color="var(--aq-danger)" />}
              {pe && pe.max > 0 && <HPBar current={pe.atual} max={pe.max} label="PE" color="var(--aq-accent)" />}
              {sanidade && sanidade.max > 0 && <HPBar current={sanidade.atual} max={sanidade.max} label="Sanidade" color="#c084fc" />}
            </div>

            <div className="border-t border-[var(--aq-border)] pt-4">
              <p className="aq-kicker mb-3">
                <Swords size={12} className="mr-1.5 inline" />
                Dano & Efeitos
              </p>
              <div className="space-y-3">
                <DamageControl value={danoValor} onChange={setDanoValor} onDamage={() => modificarVida(-danoValor)} onHeal={() => modificarVida(+danoValor)} disabled={loading || !vida} />
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => alterarStatus("pe", -1)} disabled={loading || !pe} className="aq-button-secondary aq-button-compact disabled:opacity-40">-1 PE</button>
                  <button onClick={() => alterarStatus("pe", 1)} disabled={loading || !pe} className="aq-button-secondary aq-button-compact disabled:opacity-40">+1 PE</button>
                  <button onClick={() => alterarStatus("sanidade", -1)} disabled={loading || !sanidade} className="aq-button-secondary aq-button-compact !border-[#d8b4fe]/50 !text-[#d8b4fe] hover:!bg-[#d8b4fe]/10 disabled:opacity-40">-1 SAN</button>
                  <button onClick={() => alterarStatus("sanidade", 1)} disabled={loading || !sanidade} className="aq-button-secondary aq-button-compact !border-[#d8b4fe]/50 !text-[#d8b4fe] hover:!bg-[#d8b4fe]/10 disabled:opacity-40">+1 SAN</button>
                </div>
              </div>
            </div>
          </div>
        ) : token.ficha_id ? (
          <div className="rounded-[0.5rem] border border-amber-500/30 bg-amber-500/10 px-4 py-5 text-center shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-[0.4rem] bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40">
              <AlertTriangle size={24} />
            </div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-amber-200">Runa Quebrada</p>
            <p className="mb-5 text-[11px] leading-relaxed text-amber-100/80">
              O token tem um elo com uma ficha, mas a mesa não conseguiu ler as runas agora.
              {fichaLoadError ? ` Erro: ${fichaLoadError}` : " Tentando reconectar..."}
            </p>
            <div className="grid gap-2.5">
              <button onClick={() => router.push(fichaHref(token.ficha_id!))} className="aq-button-secondary !border-amber-400/50 !text-amber-200 hover:!bg-amber-400/20 w-full">Abrir ficha na fonte</button>
              <button onClick={desvincularFicha} disabled={loading} className="aq-button-secondary !border-[var(--aq-danger)]/50 !text-[var(--aq-danger)] hover:!bg-[var(--aq-danger)]/20 w-full disabled:opacity-40">Romper elo</button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[0.4rem] border border-[var(--aq-border)] bg-[var(--aq-surface)] shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              <Link2 size={24} className="text-[var(--aq-text-muted)]" />
            </div>
            <p className="aq-kicker mb-2">Token vazio</p>
            <p className="mb-6 text-[11px] text-[var(--aq-text)]">
              Vincule uma ficha para despertar
              <br />
              a barra de vida e sincronia vital.
            </p>
            <button onClick={() => setShowVincular((v) => !v)} className="aq-button-primary">
              <Sparkles size={14} className="mr-2 inline" />
              Forjar Elo
            </button>
          </div>
        )}

        {showVincular ? (
          <div className="space-y-3 mt-4 border-t border-[var(--aq-border)] pt-4">
            <div className="flex items-center justify-between pb-2">
              <span className="aq-kicker !mb-0">Selecionar Ficha</span>
              <button onClick={() => setShowVincular(false)} className="text-[var(--aq-text-muted)] hover:text-[var(--aq-title)]"><X size={14} /></button>
            </div>

            <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "var(--aq-border) transparent" }}>
              {fichasList.length === 0 ? (
                <p className="py-4 text-center text-[10px] uppercase tracking-widest text-[var(--aq-text-muted)]">Nenhuma ficha no cofre</p>
              ) : (
                fichasList.map((f) => (
                  <button key={f.id} onClick={() => vincularFicha(f.id)} disabled={loading} className="group w-full rounded-[0.4rem] border border-[var(--aq-border)] bg-[var(--aq-surface)] px-4 py-3 text-left transition-all hover:border-[var(--aq-accent)] hover:bg-[var(--aq-accent-soft)] hover:shadow-[0_0_12px_var(--aq-accent-soft)] disabled:opacity-40">
                    <p className="text-[12px] font-bold text-[var(--aq-title)]">{f.nome_personagem}</p>
                    <p className="mt-1 text-[9px] uppercase tracking-wider text-[var(--aq-text-muted)] group-hover:text-[var(--aq-text)]">{f.sistema_preset?.replace("_", " ")}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}

        <button
          onClick={removerToken}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-[0.35rem] border border-[var(--aq-danger)]/40 bg-[var(--aq-danger)]/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.1em] text-[var(--aq-danger)] transition-all hover:bg-[var(--aq-danger)]/20 hover:shadow-[0_0_12px_rgba(239,68,68,0.2)] disabled:opacity-40 mt-6"
        >
          <Trash2 size={14} />
          {loading ? "Desfazendo..." : "Remover do Mapa"}
        </button>
      </div>

      <div className="border-t border-[var(--aq-border)] bg-[var(--aq-surface)] px-4 py-3">
        <p className="text-center text-[8px] uppercase tracking-widest text-[var(--aq-text-subtle)]">
          Sincronia Astral Bidirecional
        </p>
      </div>
    </div>
  );
}
