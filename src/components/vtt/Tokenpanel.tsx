"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { Token, FichaVTTSnapshot } from "../../lib/types";
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
  Brain,
  Zap
} from "lucide-react";

function StatusBar({
  current,
  max,
  label,
  color
}: {
  current: number;
  max: number;
  label: string;
  color: string;
}) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color }}>
          {label}
        </span>
        <span className="font-mono text-[10px] font-black text-white tabular-nums">
          {current} / {max}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ background: "#0a0f18", border: "1px solid #1a2b4c" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${ratio * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function DeltaControl({
  value,
  onChange,
  onSpend,
  onRecover,
  disabled,
  spendLabel,
  recoverLabel,
  icon
}: {
  value: number;
  onChange: (v: number) => void;
  onSpend: () => void;
  onRecover: () => void;
  disabled: boolean;
  spendLabel: string;
  recoverLabel: string;
  icon: React.ReactNode;
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
          onChange={(e) => onChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
          className="w-0 flex-1 bg-transparent text-center text-sm font-black text-white outline-none"
          style={{ fontFamily: "monospace" }}
        />
        <button onClick={() => onChange(value + 1)} className="px-2 py-2 text-[#6b7b94] transition-colors hover:text-[#4ad9d9]">
          <ChevronRight size={12} />
        </button>
      </div>

      <button
        onClick={onSpend}
        disabled={disabled}
        className="flex items-center gap-1 rounded-lg px-3 py-2 text-[10px] font-black uppercase transition-all disabled:opacity-40"
        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
      >
        {icon}
        <span>{spendLabel}</span>
      </button>

      <button
        onClick={onRecover}
        disabled={disabled}
        className="rounded-lg px-3 py-2 text-[10px] font-black uppercase transition-all disabled:opacity-40"
        style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80" }}
      >
        {recoverLabel}
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
  const [fichasList, setFichasList] = useState<any[]>([]);
  const [showVincular, setShowVincular] = useState(false);
  const [deltaValor, setDeltaValor] = useState(5);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setShowVincular(false);
  }, [token?.id]);

  const carregarFichas = useCallback(async () => {
    const { data } = await supabase
      .from("fichas")
      .select("id, nome_personagem, sistema_preset")
      .order("nome_personagem");
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

  const modificarStatus = async (key: "vida" | "sanidade" | "pe", delta: number) => {
    if (!token?.ficha_id || !fichaData) return;
    setLoading(true);

    const atual = fichaData.dados?.status?.[key]?.atual ?? 0;
    const max = fichaData.dados?.status?.[key]?.max ?? 0;
    const novoValor = Math.max(0, Math.min(max, atual + delta));

    const novosDados = {
      ...fichaData.dados,
      status: {
        ...fichaData.dados?.status,
        [key]: {
          ...fichaData.dados?.status?.[key],
          atual: novoValor
        }
      }
    };

    const { error } = await supabase.from("fichas").update({ dados: novosDados }).eq("id", token.ficha_id);
    if (error) console.error(`[TokenPanel] Erro ao modificar ${key}:`, error.message);
    setLoading(false);
  };

  if (!token) return null;

  const vida = fichaData?.dados?.status?.vida;
  const sanidade = fichaData?.dados?.status?.sanidade;
  const pe = fichaData?.dados?.status?.pe ?? fichaData?.dados?.status?.estamina;
  const defesa = fichaData?.dados?.defesa?.passiva;
  const deslocamento = fichaData?.dados?.deslocamento;

  return (
    <div
      className="fixed right-4 top-1/2 z-50 w-72 -translate-y-1/2 overflow-hidden rounded-2xl"
      style={{
        background: "rgba(10, 15, 24, 0.97)",
        backdropFilter: "blur(16px)",
        border: "1px solid #1a2b4c",
        boxShadow: "0 0 40px rgba(74, 217, 217, 0.06), 0 24px 64px rgba(0,0,0,0.6)"
      }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid #1a2b4c", background: "rgba(5,10,16,0.72)" }}>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full ring-1 ring-white/20" style={{ backgroundColor: token.cor || "#ef4444" }} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "#4ad9d9" }}>
            Token
          </span>
        </div>
        <button onClick={onClose} className="text-[#6b7b94] transition-colors hover:text-[#4ad9d9]">
          <X size={14} />
        </button>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-[#6b7b94]">Nome</p>
          <p className="text-base font-bold text-white" style={{ fontFamily: "monospace" }}>
            {token.nome}
          </p>
        </div>

        {fichaData ? (
          <div className="space-y-3">
            <div
              className="flex items-center justify-between rounded-xl px-3 py-2"
              style={{ background: "rgba(74,217,217,0.04)", border: "1px solid rgba(74,217,217,0.15)" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ background: "rgba(74,217,217,0.1)", border: "1px solid rgba(74,217,217,0.2)" }}
                >
                  <User size={13} style={{ color: "#4ad9d9" }} />
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-[#8b9bb4]">Ficha vinculada</p>
                  <p className="text-[12px] font-bold leading-tight text-white">{fichaData.nome_personagem}</p>
                  <p className="text-[9px] uppercase tracking-wider text-[#6b7b94]">
                    {fichaData.sistema_preset?.replace("_", " ")}
                  </p>
                </div>
              </div>
              <button onClick={desvincularFicha} disabled={loading} className="text-[#6b7b94] transition-colors hover:text-[#f87171] disabled:opacity-40">
                <LinkOff size={14} />
              </button>
            </div>

            <div className="space-y-2.5">
              {vida ? <StatusBar current={vida.atual} max={vida.max} label="Vida" color="#ef4444" /> : null}
              {sanidade ? <StatusBar current={sanidade.atual} max={sanidade.max} label="Sanidade" color="#8b5cf6" /> : null}
              {pe ? <StatusBar current={pe.atual} max={pe.max} label="PE / Recursos" color="#4ad9d9" /> : null}
            </div>

            {(defesa || deslocamento) ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-[#1a2b4c] bg-[rgba(5,10,16,0.72)] px-3 py-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#6b7b94]">Defesa</p>
                  <p className="mt-1 text-sm font-black text-white">{defesa ?? "-"}</p>
                </div>
                <div className="rounded-lg border border-[#1a2b4c] bg-[rgba(5,10,16,0.72)] px-3 py-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#6b7b94]">Deslocamento</p>
                  <p className="mt-1 text-sm font-black text-white">{deslocamento || "-"}</p>
                </div>
              </div>
            ) : null}

            <div style={{ borderTop: "1px solid #1a2b4c" }} />

            <div className="space-y-3">
              <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-[#6b7b94]">
                <Swords size={9} className="mr-1 inline" />
                Efeito de Combate
              </p>
              <DeltaControl
                value={deltaValor}
                onChange={setDeltaValor}
                onSpend={() => modificarStatus("vida", -deltaValor)}
                onRecover={() => modificarStatus("vida", deltaValor)}
                disabled={loading || !vida}
                spendLabel="Dano"
                recoverLabel="Cura"
                icon={<Skull size={11} />}
              />
              <DeltaControl
                value={deltaValor}
                onChange={setDeltaValor}
                onSpend={() => modificarStatus("sanidade", -deltaValor)}
                onRecover={() => modificarStatus("sanidade", deltaValor)}
                disabled={loading || !sanidade}
                spendLabel="Stress"
                recoverLabel="Rec"
                icon={<Brain size={11} />}
              />
              <DeltaControl
                value={deltaValor}
                onChange={setDeltaValor}
                onSpend={() => modificarStatus("pe", -deltaValor)}
                onRecover={() => modificarStatus("pe", deltaValor)}
                disabled={loading || !pe}
                spendLabel="Gastar"
                recoverLabel="Rec"
                icon={<Zap size={11} />}
              />
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
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-[#8b9bb4]">Token sem ficha</p>
            <p className="mb-4 text-[10px] text-[#6b7b94]">
              Vincule uma ficha para ativar vida, PE, sanidade e sincronizacao realtime.
            </p>
            <button
              onClick={() => setShowVincular((v) => !v)}
              className="rounded-lg px-5 py-2 text-[10px] font-black uppercase tracking-widest text-[#4ad9d9]"
              style={{ background: "rgba(74,217,217,0.08)", border: "1px solid rgba(74,217,217,0.25)" }}
            >
              <Sparkles size={11} className="mr-1 inline" />
              Vincular Ficha
            </button>
          </div>
        )}

        {showVincular && (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-2" style={{ borderBottom: "1px solid #1a2b4c" }}>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#4ad9d9]">Selecionar Ficha</span>
              <button onClick={() => setShowVincular(false)} className="text-[#6b7b94] transition-colors hover:text-[#e2e8f0]">
                <X size={12} />
              </button>
            </div>

            <div className="max-h-44 space-y-1 overflow-y-auto pr-0.5" style={{ scrollbarWidth: "thin", scrollbarColor: "#1a2b4c transparent" }}>
              {fichasList.length === 0 ? (
                <p className="py-4 text-center text-[10px] uppercase tracking-widest text-[#6b7b94]">
                  Nenhuma ficha encontrada
                </p>
              ) : (
                fichasList.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => vincularFicha(f.id)}
                    disabled={loading}
                    className="group w-full rounded-lg px-3 py-2.5 text-left transition-all disabled:opacity-40"
                    style={{ background: "rgba(5,10,16,0.8)", border: "1px solid #1a2b4c" }}
                  >
                    <p className="text-[11px] font-bold text-white">{f.nome_personagem}</p>
                    <p className="mt-0.5 text-[9px] uppercase tracking-wider text-[#6b7b94]">
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
        <p className="text-center text-[8px] uppercase tracking-widest text-[#41556f]">Supabase Realtime - Sync bidirecional</p>
      </div>
    </div>
  );
}
