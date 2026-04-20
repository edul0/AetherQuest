"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";
import { Token, FichaVTTSnapshot } from "@/src/lib/types";
import {
  X,
  Link2,
  LinkOff,
  Swords,
  Heart,
  ChevronLeft,
  ChevronRight,
  User,
  Skull,
  Sparkles,
  ScrollText,
} from "lucide-react";

function HPBar({
  current,
  max,
  label,
  color,
}: {
  current: number;
  max: number;
  label: string;
  color: string;
}) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
  const hpColor = ratio > 0.5 ? "#22c55e" : ratio > 0.25 ? "#f59e0b" : "#ef4444";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>
          {label}
        </span>
        <span className="font-mono text-[10px] font-black tabular-nums text-white">
          {current} / {max}
        </span>
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
        <button
          onClick={() => onChange(Math.max(1, value - 1))}
          className="px-2 py-2 transition-colors"
          style={{ color: "#6b7b94" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#4ad9d9")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7b94")}
        >
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
        <button
          onClick={() => onChange(value + 1)}
          className="px-2 py-2 transition-colors"
          style={{ color: "#6b7b94" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#4ad9d9")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7b94")}
        >
          <ChevronRight size={12} />
        </button>
      </div>

      <button
        onClick={onDamage}
        disabled={disabled}
        className="flex items-center gap-1 rounded-lg px-3 py-2 text-[10px] font-black uppercase transition-all disabled:opacity-40"
        style={{
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.3)",
          color: "#f87171",
        }}
        onMouseEnter={(e) => {
          if (!disabled) (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.2)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)";
        }}
        title="Aplicar dano"
      >
        <Skull size={11} />
        <span>DMG</span>
      </button>

      <button
        onClick={onHeal}
        disabled={disabled}
        className="flex items-center gap-1 rounded-lg px-3 py-2 text-[10px] font-black uppercase transition-all disabled:opacity-40"
        style={{
          background: "rgba(34,197,94,0.1)",
          border: "1px solid rgba(34,197,94,0.3)",
          color: "#4ade80",
        }}
        onMouseEnter={(e) => {
          if (!disabled) (e.currentTarget as HTMLElement).style.background = "rgba(34,197,94,0.2)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "rgba(34,197,94,0.1)";
        }}
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

  useEffect(() => {
    setShowVincular(false);
  }, [token?.id]);

  const carregarFichas = useCallback(async () => {
    const { data } = await supabase.from("fichas").select("id, nome_personagem, sistema_preset").order("nome_personagem");
    if (data) setFichasList(data);
  }, []);

  useEffect(() => {
    if (showVincular) carregarFichas();
  }, [showVincular, carregarFichas]);

  const vincularFicha = async (fichaId: string) => {
    if (!token) return;
    setLoading(true);
    const { data, error } = await supabase.from("tokens").update({ ficha_id: fichaId }).eq("id", token.id).select().single();

    if (!error && data) onTokenUpdate(data as Token);
    setShowVincular(false);
    setLoading(false);
  };

  const desvincularFicha = async () => {
    if (!token) return;
    setLoading(true);
    await supabase.from("tokens").update({ ficha_id: null }).eq("id", token.id);
    onTokenUpdate({ ...token, ficha_id: null });
    setLoading(false);
  };

  const modificarVida = async (delta: number) => {
    if (!token?.ficha_id || !fichaData) return;
    setLoading(true);

    const vidaAtual = fichaData.dados?.status?.vida?.atual ?? 0;
    const vidaMax = fichaData.dados?.status?.vida?.max ?? 0;
    const novaVida = Math.max(0, Math.min(vidaMax, vidaAtual + delta));

    const novosDados = {
      ...fichaData.dados,
      status: {
        ...fichaData.dados?.status,
        vida: {
          ...fichaData.dados?.status?.vida,
          atual: novaVida,
        },
      },
    };

    const { error } = await supabase.from("fichas").update({ dados: novosDados }).eq("id", token.ficha_id);

    if (error) console.error("[TokenPanel] Erro ao modificar vida:", error.message);
    setLoading(false);
  };

  if (!token) return null;

  const vida = fichaData?.dados?.status?.vida;
  const pe = fichaData?.dados?.status?.pe;
  const sanidade = fichaData?.dados?.status?.sanidade;

  const alterarStatus = async (key: "vida" | "pe" | "sanidade", delta: number) => {
    if (!token?.ficha_id || !fichaData) return;
    setLoading(true);

    const statusAtual = fichaData.dados?.status?.[key];
    const atual = statusAtual?.atual ?? 0;
    const max = statusAtual?.max ?? 0;
    const proximoValor = Math.max(0, Math.min(max, atual + delta));

    const novosDados = {
      ...fichaData.dados,
      status: {
        ...fichaData.dados?.status,
        [key]: {
          ...statusAtual,
          atual: proximoValor,
        },
      },
    };

    const { error } = await supabase.from("fichas").update({ dados: novosDados }).eq("id", token.ficha_id);

    if (error) console.error(`[TokenPanel] Erro ao modificar ${key}:`, error.message);
    setLoading(false);
  };

  return (
    <div
      className="fixed right-4 top-1/2 z-50 w-72 -translate-y-1/2 overflow-hidden rounded-2xl"
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
          <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "#4ad9d9" }}>
            Token
          </span>
        </div>
        <button
          onClick={onClose}
          className="transition-colors"
          style={{ color: "#6b7b94" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#4ad9d9")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7b94")}
        >
          <X size={14} />
        </button>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <p className="mb-1 text-[9px] font-black uppercase tracking-widest" style={{ color: "#6b7b94" }}>
            Nome
          </p>
          <p className="text-base font-bold text-white" style={{ fontFamily: "monospace" }}>
            {token.nome}
          </p>
        </div>

        {fichaData ? (
          <div className="space-y-3">
            <div
              className="rounded-xl px-3 py-3"
              style={{
                background: "rgba(74,217,217,0.04)",
                border: "1px solid rgba(74,217,217,0.15)",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(74,217,217,0.1)", border: "1px solid rgba(74,217,217,0.2)" }}
                  >
                    <User size={13} style={{ color: "#4ad9d9" }} />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider" style={{ color: "#8b9bb4" }}>
                      Ficha vinculada
                    </p>
                    <p className="text-[12px] font-bold leading-tight text-white">{fichaData.nome_personagem}</p>
                    <p className="text-[9px] uppercase tracking-wider" style={{ color: "#6b7b94" }}>
                      {fichaData.sistema_preset?.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={desvincularFicha}
                  disabled={loading}
                  title="Desvincular ficha"
                  className="transition-colors disabled:opacity-40"
                  style={{ color: "#6b7b94" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7b94")}
                >
                  <LinkOff size={14} />
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
              {vida && <HPBar current={vida.atual} max={vida.max} label="❤ Vida" color="#f87171" />}
              {pe && pe.max > 0 && <HPBar current={pe.atual} max={pe.max} label="PE" color="#4ad9d9" />}
              {sanidade && sanidade.max > 0 && <HPBar current={sanidade.atual} max={sanidade.max} label="◈ Sanidade" color="#c084fc" />}
            </div>

            <div style={{ borderTop: "1px solid #1a2b4c" }} />

            <div>
              <p className="mb-2 text-[9px] font-black uppercase tracking-widest" style={{ color: "#6b7b94" }}>
                <Swords size={9} className="mr-1 inline" />
                Efeito de Combate
              </p>
              <div className="space-y-3">
                <DamageControl
                  value={danoValor}
                  onChange={setDanoValor}
                  onDamage={() => modificarVida(-danoValor)}
                  onHeal={() => modificarVida(+danoValor)}
                  disabled={loading || !vida}
                />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => alterarStatus("pe", -1)}
                    disabled={loading || !pe}
                    className="rounded-lg border border-[rgba(74,217,217,0.25)] bg-[rgba(74,217,217,0.08)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--aq-accent)] transition-all disabled:opacity-40"
                  >
                    -1 PE
                  </button>
                  <button
                    onClick={() => alterarStatus("pe", 1)}
                    disabled={loading || !pe}
                    className="rounded-lg border border-[rgba(74,217,217,0.25)] bg-[rgba(74,217,217,0.08)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--aq-accent)] transition-all disabled:opacity-40"
                  >
                    +1 PE
                  </button>
                  <button
                    onClick={() => alterarStatus("sanidade", -1)}
                    disabled={loading || !sanidade}
                    className="rounded-lg border border-[rgba(192,132,252,0.25)] bg-[rgba(192,132,252,0.08)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#d8b4fe] transition-all disabled:opacity-40"
                  >
                    -1 SAN
                  </button>
                  <button
                    onClick={() => alterarStatus("sanidade", 1)}
                    disabled={loading || !sanidade}
                    className="rounded-lg border border-[rgba(192,132,252,0.25)] bg-[rgba(192,132,252,0.08)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#d8b4fe] transition-all disabled:opacity-40"
                  >
                    +1 SAN
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-5 text-center">
            <div
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "rgba(26,43,76,0.34)", border: "1px solid #1a2b4c" }}
            >
              <Link2 size={20} style={{ color: "#6b7b94" }} />
            </div>
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest" style={{ color: "#8b9bb4" }}>
              Token burro
            </p>
            <p className="mb-4 text-[10px]" style={{ color: "#6b7b94" }}>
              Vincule uma ficha para ativar
              <br />
              HP bar e sincronizacao Realtime.
            </p>
            <button
              onClick={() => setShowVincular((v) => !v)}
              className="rounded-lg px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all"
              style={{
                background: "rgba(74,217,217,0.08)",
                border: "1px solid rgba(74,217,217,0.25)",
                color: "#4ad9d9",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(74,217,217,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(74,217,217,0.08)";
              }}
            >
              <Sparkles size={11} className="mr-1 inline" />
              Vincular Ficha
            </button>
          </div>
        )}

        {showVincular && (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-2" style={{ borderBottom: "1px solid #1a2b4c" }}>
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#4ad9d9" }}>
                Selecionar Ficha
              </span>
              <button
                onClick={() => setShowVincular(false)}
                style={{ color: "#6b7b94" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#e2e8f0")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7b94")}
              >
                <X size={12} />
              </button>
            </div>

            <div className="max-h-44 space-y-1 overflow-y-auto pr-0.5" style={{ scrollbarWidth: "thin", scrollbarColor: "#1a2b4c transparent" }}>
              {fichasList.length === 0 ? (
                <p className="py-4 text-center text-[10px] uppercase tracking-widest" style={{ color: "#6b7b94" }}>
                  Nenhuma ficha encontrada
                </p>
              ) : (
                fichasList.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => vincularFicha(f.id)}
                    disabled={loading}
                    className="group w-full rounded-lg px-3 py-2.5 text-left transition-all disabled:opacity-40"
                    style={{
                      background: "rgba(5,10,16,0.8)",
                      border: "1px solid #1a2b4c",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(74,217,217,0.06)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(74,217,217,0.25)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "rgba(5,10,16,0.8)";
                      (e.currentTarget as HTMLElement).style.borderColor = "#1a2b4c";
                    }}
                  >
                    <p className="text-[11px] font-bold text-white">{f.nome_personagem}</p>
                    <p className="mt-0.5 text-[9px] uppercase tracking-wider" style={{ color: "#6b7b94" }}>
                      {f.sistema_preset?.replace("_", " ")}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-2.5" style={{ borderTop: "1px solid #1a2b4c", background: "rgba(5,10,16,0.72)" }}>
        <p className="text-center text-[8px] uppercase tracking-widest" style={{ color: "#41556f" }}>
          ⚡ Supabase Realtime · Sync bidirecional
        </p>
      </div>
    </div>
  );
}
