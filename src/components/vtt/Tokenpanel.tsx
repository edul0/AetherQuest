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
} from "lucide-react";

// ---- Sub-componente: Barra de HP ----------------------------------------
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
  const hpColor =
    ratio > 0.5 ? "#22c55e" : ratio > 0.25 ? "#f59e0b" : "#ef4444";

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span
          className="text-[9px] uppercase tracking-widest font-black"
          style={{ color }}
        >
          {label}
        </span>
        <span className="text-[10px] font-black text-white font-mono tabular-nums">
          {current} / {max}
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: "#0a0f18", border: "1px solid #1a2b4c" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${ratio * 100}%`, backgroundColor: hpColor }}
        />
      </div>
    </div>
  );
}

// ---- Sub-componente: Controle de dano/cura --------------------------------
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
      {/* Spinner de valor */}
      <div
        className="flex items-center flex-1 rounded-lg overflow-hidden"
        style={{ background: "#0a0f18", border: "1px solid #1a2b4c" }}
      >
        <button
          onClick={() => onChange(Math.max(1, value - 1))}
          className="px-2 py-2 transition-colors"
          style={{ color: "#6b7b94" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "#4ad9d9")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "#6b7b94")
          }
        >
          <ChevronLeft size={12} />
        </button>
        <input
          type="number"
          value={value}
          min={1}
          onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
          className="flex-1 text-center text-white font-black text-sm bg-transparent outline-none w-0"
          style={{ fontFamily: "monospace" }}
        />
        <button
          onClick={() => onChange(value + 1)}
          className="px-2 py-2 transition-colors"
          style={{ color: "#6b7b94" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "#4ad9d9")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "#6b7b94")
          }
        >
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Botão Dano */}
      <button
        onClick={onDamage}
        disabled={disabled}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all disabled:opacity-40"
        style={{
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.3)",
          color: "#f87171",
        }}
        onMouseEnter={(e) => {
          if (!disabled)
            (e.currentTarget as HTMLElement).style.background =
              "rgba(239,68,68,0.2)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background =
            "rgba(239,68,68,0.1)";
        }}
        title="Aplicar dano"
      >
        <Skull size={11} />
        <span>DMG</span>
      </button>

      {/* Botão Cura */}
      <button
        onClick={onHeal}
        disabled={disabled}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all disabled:opacity-40"
        style={{
          background: "rgba(34,197,94,0.1)",
          border: "1px solid rgba(34,197,94,0.3)",
          color: "#4ade80",
        }}
        onMouseEnter={(e) => {
          if (!disabled)
            (e.currentTarget as HTMLElement).style.background =
              "rgba(34,197,94,0.2)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background =
            "rgba(34,197,94,0.1)";
        }}
        title="Curar"
      >
        <Heart size={11} />
        <span>CUR</span>
      </button>
    </div>
  );
}

// ---- Componente principal -------------------------------------------------
interface TokenPanelProps {
  /** Token atualmente selecionado. `null` = painel fechado. */
  token: Token | null;
  /** Snapshot da ficha vinculada, gerenciado pelo useTokenFichaSync. */
  fichaData: FichaVTTSnapshot | null;
  /** Callback para fechar o painel (deselecionar). */
  onClose: () => void;
  /**
   * Callback chamado quando o token é atualizado via Supabase.
   * Permite que o componente pai atualize seu estado local de `selectedToken`.
   */
  onTokenUpdate: (updated: Token) => void;
}

export default function TokenPanel({
  token,
  fichaData,
  onClose,
  onTokenUpdate,
}: TokenPanelProps) {
  const [fichasList, setFichasList] = useState<any[]>([]);
  const [showVincular, setShowVincular] = useState(false);
  const [danoValor, setDanoValor] = useState(5);
  const [loading, setLoading] = useState(false);

  // Fecha o sub-menu de vinculação quando o token muda
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
    const { data, error } = await supabase
      .from("tokens")
      .update({ ficha_id: fichaId })
      .eq("id", token.id)
      .select()
      .single();

    if (!error && data) onTokenUpdate(data as Token);
    setShowVincular(false);
    setLoading(false);
  };

  const desvincularFicha = async () => {
    if (!token) return;
    setLoading(true);
    await supabase
      .from("tokens")
      .update({ ficha_id: null })
      .eq("id", token.id);
    onTokenUpdate({ ...token, ficha_id: null });
    setLoading(false);
  };

  /**
   * Modifica `fichas.dados.status.vida.atual` diretamente.
   * O useTokenFichaSync assina o UPDATE e propaga para todos os clientes
   * sem nenhuma ação adicional — inclusive a aba da ficha do jogador.
   */
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

    const { error } = await supabase
      .from("fichas")
      .update({ dados: novosDados })
      .eq("id", token.ficha_id);

    if (error) console.error("[TokenPanel] Erro ao modificar vida:", error.message);
    setLoading(false);
  };

  // ---- Nada selecionado: painel invisível --------------------------------
  if (!token) return null;

  const vida = fichaData?.dados?.status?.vida;
  const sanidade = fichaData?.dados?.status?.sanidade;

  return (
    <div
      className="fixed right-4 top-1/2 -translate-y-1/2 w-72 z-50 rounded-2xl overflow-hidden"
      style={{
        background: "rgba(10, 15, 24, 0.97)",
        backdropFilter: "blur(16px)",
        border: "1px solid #1a2b4c",
        boxShadow: "0 0 40px rgba(74, 217, 217, 0.06), 0 24px 64px rgba(0,0,0,0.6)",
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid #1a2b4c", background: "rgba(5,10,16,0.72)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full ring-1 ring-white/20"
            style={{ backgroundColor: token.cor || "#ef4444" }}
          />
          <span
            className="text-[10px] font-black uppercase tracking-[0.2em]"
            style={{ color: "#4ad9d9" }}
          >
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

      {/* ── Body ── */}
      <div className="p-4 space-y-4">
        {/* Nome do token */}
        <div>
          <p
            className="text-[9px] uppercase tracking-widest font-black mb-1"
            style={{ color: "#6b7b94" }}
          >
            Nome
          </p>
          <p className="text-white font-bold text-base" style={{ fontFamily: "monospace" }}>
            {token.nome}
          </p>
        </div>

        {/* ── Ficha vinculada ── */}
        {fichaData ? (
          <div className="space-y-3">
            {/* Indicador de vínculo */}
            <div
              className="flex items-center justify-between rounded-xl px-3 py-2"
              style={{
                background: "rgba(74,217,217,0.04)",
                border: "1px solid rgba(74,217,217,0.15)",
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(74,217,217,0.1)", border: "1px solid rgba(74,217,217,0.2)" }}
                >
                  <User size={13} style={{ color: "#4ad9d9" }} />
                </div>
                <div>
                  <p
                    className="text-[9px] uppercase tracking-wider"
                    style={{ color: "#8b9bb4" }}
                  >
                    Ficha vinculada
                  </p>
                  <p className="text-[12px] font-bold text-white leading-tight">
                    {fichaData.nome_personagem}
                  </p>
                  <p
                    className="text-[9px] uppercase tracking-wider"
                    style={{ color: "#6b7b94" }}
                  >
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

            {/* Barras de status */}
            <div className="space-y-2.5">
              {vida && (
                <HPBar
                  current={vida.atual}
                  max={vida.max}
                  label="❤ Vida"
                  color="#f87171"
                />
              )}
              {sanidade && sanidade.max > 0 && (
                <HPBar
                  current={sanidade.atual}
                  max={sanidade.max}
                  label="◈ Sanidade"
                  color="#c084fc"
                />
              )}
            </div>

            {/* Separador */}
            <div style={{ borderTop: "1px solid #1a2b4c" }} />

            {/* Controles de dano/cura */}
            <div>
              <p
                className="text-[9px] uppercase tracking-widest font-black mb-2"
                style={{ color: "#6b7b94" }}
              >
                <Swords size={9} className="inline mr-1" />
                Efeito de Combate
              </p>
              <DamageControl
                value={danoValor}
                onChange={setDanoValor}
                onDamage={() => modificarVida(-danoValor)}
                onHeal={() => modificarVida(+danoValor)}
                disabled={loading || !vida}
              />
            </div>
          </div>
        ) : (
          /* ── Sem ficha: CTA de vincular ── */
          <div className="text-center py-5">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(26,43,76,0.34)", border: "1px solid #1a2b4c" }}
            >
              <Link2 size={20} style={{ color: "#6b7b94" }} />
            </div>
            <p
              className="text-[10px] uppercase tracking-widest mb-1 font-black"
              style={{ color: "#8b9bb4" }}
            >
              Token burro
            </p>
            <p className="text-[10px] mb-4" style={{ color: "#6b7b94" }}>
              Vincule uma ficha para ativar<br />HP bar e sincronização Realtime.
            </p>
            <button
              onClick={() => setShowVincular((v) => !v)}
              className="px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
              style={{
                background: "rgba(74,217,217,0.08)",
                border: "1px solid rgba(74,217,217,0.25)",
                color: "#4ad9d9",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(74,217,217,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(74,217,217,0.08)";
              }}
            >
              <Sparkles size={11} className="inline mr-1" />
              Vincular Ficha
            </button>
          </div>
        )}

        {/* ── Lista de fichas para vincular ── */}
        {showVincular && (
          <div className="space-y-2">
            <div
              className="flex items-center justify-between pb-2"
              style={{ borderBottom: "1px solid #1a2b4c" }}
            >
              <span
                className="text-[9px] uppercase tracking-widest font-black"
                style={{ color: "#4ad9d9" }}
              >
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

            <div
              className="max-h-44 overflow-y-auto space-y-1 pr-0.5"
              style={{ scrollbarWidth: "thin", scrollbarColor: "#1a2b4c transparent" }}
            >
              {fichasList.length === 0 ? (
                <p
                  className="text-[10px] text-center py-4 uppercase tracking-widest"
                  style={{ color: "#6b7b94" }}
                >
                  Nenhuma ficha encontrada
                </p>
              ) : (
                fichasList.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => vincularFicha(f.id)}
                    disabled={loading}
                    className="w-full text-left rounded-lg px-3 py-2.5 transition-all disabled:opacity-40 group"
                    style={{
                      background: "rgba(5,10,16,0.8)",
                      border: "1px solid #1a2b4c",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(74,217,217,0.06)";
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "rgba(74,217,217,0.25)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(5,10,16,0.8)";
                      (e.currentTarget as HTMLElement).style.borderColor =
                        "#1a2b4c";
                    }}
                  >
                    <p className="text-[11px] font-bold text-white">{f.nome_personagem}</p>
                    <p
                      className="text-[9px] uppercase tracking-wider mt-0.5"
                      style={{ color: "#6b7b94" }}
                    >
                      {f.sistema_preset?.replace("_", " ")}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div
        className="px-4 py-2.5"
        style={{ borderTop: "1px solid #1a2b4c", background: "rgba(5,10,16,0.72)" }}
      >
        <p
          className="text-[8px] text-center uppercase tracking-widest"
          style={{ color: "#41556f" }}
        >
          ⚡ Supabase Realtime · Sync bidirecional
        </p>
      </div>
    </div>
  );
}
