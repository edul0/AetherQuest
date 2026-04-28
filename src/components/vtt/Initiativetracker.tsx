"use client";

import React, { useCallback, useMemo, useState } from "react";
import { ChevronRight, Dices, Minus, Plus, SkipForward, Swords, X } from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { FichaVTTSnapshot, Token } from "@/src/lib/types";

interface InitiativeTrackerProps {
  tokens: Token[];
  fichasMap: Record<string, FichaVTTSnapshot>;
  salaId: string;
  onSelectToken: (token: Token | null) => void;
  selectedTokenId: string | null;
  onClose: () => void;
}

type InitiativeEntry = {
  token: Token;
  ficha: FichaVTTSnapshot | null;
  initiative: number;
};

const CONDITION_COLORS: Record<string, string> = {
  dead: "#ef4444", morto: "#ef4444",
  unconscious: "#6b7280", inconsciente: "#6b7280",
  poisoned: "#22c55e", envenenado: "#22c55e",
  burning: "#f97316", queimando: "#f97316",
  stunned: "#f59e0b", atordoado: "#f59e0b",
  prone: "#a78bfa", caído: "#a78bfa",
  blinded: "#374151", cego: "#374151",
  concentration: "#4ad9d9",
};

function getConditions(token: Token): string[] {
  return (Array.isArray(token.conditions) ? token.conditions : []).filter(
    (c) => !c.startsWith("visual:") && !c.startsWith("cutout:")
  );
}

export default function InitiativeTracker({
  tokens,
  fichasMap,
  onSelectToken,
  selectedTokenId,
  onClose,
}: InitiativeTrackerProps) {
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const sorted = useMemo<InitiativeEntry[]>(() => {
    return tokens
      .map((token) => ({
        token,
        ficha: token.ficha_id ? fichasMap[token.ficha_id] ?? null : null,
        initiative: token.initiative ?? 0,
      }))
      .sort((a, b) => b.initiative - a.initiative);
  }, [tokens, fichasMap]);

  const currentEntry = sorted[currentTurnIndex % Math.max(1, sorted.length)];

  const setInitiative = useCallback(
    async (tokenId: string, value: number) => {
      setSaving((s) => ({ ...s, [tokenId]: true }));
      await supabase.from("tokens").update({ initiative: value }).eq("id", tokenId);
      setSaving((s) => ({ ...s, [tokenId]: false }));
    },
    []
  );

  const rollAll = useCallback(async () => {
    for (const { token } of sorted) {
      const roll = Math.floor(Math.random() * 20) + 1;
      await supabase.from("tokens").update({ initiative: roll }).eq("id", token.id);
    }
    setCurrentTurnIndex(0);
  }, [sorted]);

  const nextTurn = () => {
    setCurrentTurnIndex((i) => (i + 1) % Math.max(1, sorted.length));
  };

  if (sorted.length === 0) {
    return (
      <div className="fixed right-3 top-20 z-50 w-[280px] rounded-3xl border border-[var(--aq-border-strong)] bg-[rgba(10,15,24,0.96)] p-5 shadow-2xl backdrop-blur-md md:right-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="aq-kicker">Iniciativa</div>
            <div className="mt-1 text-sm font-black uppercase tracking-wider text-[var(--aq-title)]">Ordem de Combate</div>
          </div>
          <button onClick={onClose} className="rounded-xl border border-[var(--aq-border)] p-2 text-[var(--aq-text-muted)]"><X size={16} /></button>
        </div>
        <div className="mt-4 rounded-2xl border border-dashed border-[var(--aq-border)] py-6 text-center text-xs text-[var(--aq-text-muted)]">
          Nenhum token na cena
        </div>
      </div>
    );
  }

  return (
    <div className="aq-scrollbar fixed right-3 top-20 z-50 max-h-[70vh] w-[290px] overflow-y-auto rounded-3xl border border-[var(--aq-border-strong)] bg-[rgba(10,15,24,0.96)] shadow-2xl backdrop-blur-md md:right-4">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 rounded-t-3xl border-b border-[var(--aq-border)] bg-[rgba(10,15,24,0.98)] px-4 py-3">
        <div>
          <div className="aq-kicker">Iniciativa</div>
          <div className="text-xs font-black uppercase tracking-wider text-[var(--aq-title)]">Ordem de Combate</div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={rollAll}
            title="Rolar iniciativa para todos"
            className="rounded-xl border border-[var(--aq-border)] bg-[rgba(74,217,217,0.08)] p-2 text-[var(--aq-accent)] transition hover:bg-[rgba(74,217,217,0.16)]"
          >
            <Dices size={15} />
          </button>
          <button
            onClick={nextTurn}
            title="Próximo turno"
            className="rounded-xl border border-[var(--aq-border-strong)] bg-[rgba(74,217,217,0.12)] p-2 text-[var(--aq-accent)] transition hover:bg-[rgba(74,217,217,0.22)]"
          >
            <SkipForward size={15} />
          </button>
          <button onClick={onClose} className="rounded-xl border border-[var(--aq-border)] p-2 text-[var(--aq-text-muted)]">
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-1.5">
        {sorted.map(({ token, ficha, initiative }, index) => {
          const isCurrent = currentEntry?.token.id === token.id;
          const isSelected = selectedTokenId === token.id;
          const name = ficha?.nome_personagem ?? token.nome ?? "Entidade";
          const avatarUrl = token.avatar_url ?? ficha?.avatar_url ?? ficha?.dados?.avatar_url ?? "";
          const isDead = getConditions(token).some((c) => c === "dead" || c === "morto");
          const vida = ficha?.dados?.status?.vida;
          const hpRatio = vida?.max ? Math.max(0, Math.min(1, vida.atual / vida.max)) : null;
          const conditions = getConditions(token).slice(0, 4);

          return (
            <div
              key={token.id}
              onClick={() => onSelectToken(isSelected ? null : token)}
              className={`relative flex cursor-pointer items-center gap-2.5 rounded-2xl border px-3 py-2.5 transition-all ${
                isCurrent
                  ? "border-[var(--aq-accent)] bg-[rgba(74,217,217,0.12)] shadow-[0_0_14px_rgba(74,217,217,0.18)]"
                  : isSelected
                  ? "border-[var(--aq-border-strong)] bg-[rgba(74,217,217,0.06)]"
                  : "border-[var(--aq-border)] bg-[rgba(5,10,16,0.55)] hover:border-[var(--aq-border-strong)]"
              } ${isDead ? "opacity-50" : ""}`}
            >
              {isCurrent && (
                <ChevronRight
                  size={12}
                  className="absolute -left-1 top-1/2 -translate-y-1/2 text-[var(--aq-accent)]"
                />
              )}

              <div className="flex-shrink-0 text-[11px] font-black tabular-nums text-[var(--aq-accent)] w-5 text-center">
                {index + 1}
              </div>

              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="h-9 w-9 flex-shrink-0 rounded-xl object-cover" />
              ) : (
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[10px] font-black text-white"
                  style={{ background: token.cor || "#4ad9d9" }}
                >
                  {name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-[11px] font-black uppercase tracking-wide text-[var(--aq-title)]">{name}</span>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setInitiative(token.id, initiative - 1); }}
                      className="flex h-5 w-5 items-center justify-center rounded text-[var(--aq-text-muted)] hover:text-[var(--aq-accent)]"
                    >
                      <Minus size={10} />
                    </button>
                    <span className={`w-7 text-center text-xs font-black tabular-nums ${saving[token.id] ? "opacity-40" : "text-white"}`}>
                      {initiative}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setInitiative(token.id, initiative + 1); }}
                      className="flex h-5 w-5 items-center justify-center rounded text-[var(--aq-text-muted)] hover:text-[var(--aq-accent)]"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>

                {hpRatio !== null && (
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${hpRatio * 100}%`,
                        backgroundColor: hpRatio > 0.5 ? "#22c55e" : hpRatio > 0.25 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                )}

                {conditions.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {conditions.map((cond) => (
                      <span
                        key={cond}
                        className="rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-white"
                        style={{ backgroundColor: CONDITION_COLORS[cond.toLowerCase()] ?? "#6b7280" }}
                      >
                        {cond.slice(0, 3)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 border-t border-[var(--aq-border)] bg-[rgba(10,15,24,0.98)] px-4 py-3">
        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-[var(--aq-text-muted)]">
          <span className="flex items-center gap-1.5">
            <Swords size={10} className="text-[var(--aq-accent)]" />
            Turno {(currentTurnIndex % Math.max(1, sorted.length)) + 1} / {sorted.length}
          </span>
          <span className="truncate max-w-[120px] text-[var(--aq-accent)]">
            {currentEntry?.ficha?.nome_personagem ?? currentEntry?.token.nome ?? "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
