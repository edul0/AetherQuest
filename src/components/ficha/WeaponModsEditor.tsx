"use client";

import React, { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { CatalogEntry } from "../../lib/types";

type WeaponModsEditorProps = {
  melhoriaValue: string;
  maldicaoValue: string;
  melhoriaOptions: CatalogEntry[];
  maldicaoOptions: CatalogEntry[];
  onChange: (field: "melhorias" | "maldicoes", value: string) => void;
};

function appendLineBlock(currentValue: string, nextLabel: string) {
  const current = currentValue?.trim() ?? "";
  const entries = current
    ? current.split("\n").map((line) => line.replace(/^- /, "").trim()).filter(Boolean)
    : [];

  if (!entries.includes(nextLabel)) {
    entries.push(nextLabel);
  }

  return entries.map((entry) => `- ${entry}`).join("\n");
}

function tokenListFromBlock(value: string) {
  return value
    .split("\n")
    .map((line) => line.replace(/^- /, "").trim())
    .filter(Boolean);
}

export default function WeaponModsEditor({
  melhoriaValue,
  maldicaoValue,
  melhoriaOptions,
  maldicaoOptions,
  onChange,
}: WeaponModsEditorProps) {
  const [activePanel, setActivePanel] = useState<"melhorias" | "maldicoes">("melhorias");
  const [selectedEntryName, setSelectedEntryName] = useState<string>("");
  const activeValue = activePanel === "melhorias" ? melhoriaValue : maldicaoValue;
  const activeOptions = activePanel === "melhorias" ? melhoriaOptions : maldicaoOptions;
  const activeTokens = useMemo(() => tokenListFromBlock(activeValue), [activeValue]);
  const selectedEntry = activeOptions.find((entry) => entry.nome === selectedEntryName) ?? activeOptions[0] ?? null;

  return (
    <div className="rounded-3xl border border-[var(--aq-border)] bg-[rgba(10,15,24,0.86)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="aq-kicker">Suite de Arma</div>
          <h4 className="mt-1 text-sm font-black uppercase tracking-[0.18em] text-[var(--aq-title)]">
            Melhorias e efeitos especiais
          </h4>
          <p className="mt-2 max-w-xl text-xs leading-relaxed text-[var(--aq-text-muted)]">
            Interface enxuta para montar a arma sem poluir o card principal. Escolha o painel, clique nos presets e ajuste manualmente se quiser.
          </p>
        </div>
        <Sparkles size={16} className="text-[var(--aq-accent)]" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setActivePanel("melhorias")} className={activePanel === "melhorias" ? "aq-button-primary !px-3 !py-2" : "aq-button-secondary !px-3 !py-2"}>
          Melhorias
        </button>
        <button onClick={() => setActivePanel("maldicoes")} className={activePanel === "maldicoes" ? "aq-button-primary !px-3 !py-2" : "aq-button-secondary !px-3 !py-2"}>
          Maldicoes
        </button>
      </div>

      {activeTokens.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {activeTokens.map((token) => (
            <span key={token} className="aq-pill aq-pill-muted">
              {token}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {activeOptions.map((entry) => (
          <button
            key={`${activePanel}-${entry.nome}`}
            onClick={() => setSelectedEntryName(entry.nome)}
            className={`aq-button-secondary !px-3 !py-2 ${selectedEntry?.nome === entry.nome ? "!border-[var(--aq-border-strong)] !text-[var(--aq-accent)]" : ""}`}
          >
            {entry.nome}
          </button>
        ))}
      </div>

      {selectedEntry ? (
        <div className="mt-4 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-black uppercase tracking-[0.18em] text-[var(--aq-title)]">{selectedEntry.nome}</div>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--aq-text)]">{selectedEntry.desc}</p>
            </div>
            <button
              onClick={() =>
                onChange(
                  activePanel,
                  appendLineBlock(activePanel === "melhorias" ? melhoriaValue : maldicaoValue, selectedEntry.nome),
                )
              }
              className="aq-button-primary"
            >
              Adicionar efeito
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div>
          <div className="aq-kicker">Melhorias</div>
          <textarea
            value={melhoriaValue}
            onChange={(e) => onChange("melhorias", e.target.value)}
            className="aq-input mt-2 min-h-[130px] resize-y"
          />
        </div>
        <div>
          <div className="aq-kicker">Maldicoes / Paranormal</div>
          <textarea
            value={maldicaoValue}
            onChange={(e) => onChange("maldicoes", e.target.value)}
            className="aq-input mt-2 min-h-[130px] resize-y"
          />
        </div>
      </div>
    </div>
  );
}
