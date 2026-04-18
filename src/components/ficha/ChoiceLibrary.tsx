"use client";

import React, { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { ChoiceOption } from "../../lib/types";

type ChoiceLibraryProps = {
  title: string;
  description: string;
  items: ChoiceOption[];
  selectedName?: string;
  selectedCustom?: string;
  onApply: (item: ChoiceOption) => void;
};

export default function ChoiceLibrary({
  title,
  description,
  items,
  selectedName,
  selectedCustom,
  onApply,
}: ChoiceLibraryProps) {
  const [openName, setOpenName] = useState<string | null>(items[0]?.nome ?? null);

  return (
    <div className="rounded-3xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.66)] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="aq-kicker">{title}</div>
          <p className="mt-2 text-sm leading-relaxed text-[var(--aq-text-muted)]">{description}</p>
        </div>
        <span className="aq-pill aq-pill-muted">
          {selectedName === "Personalizada" ? selectedCustom || "Personalizada" : selectedName || "Nao definido"}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const isOpen = openName === item.nome;
          const isSelected = selectedName === item.nome;

          return (
            <div key={item.nome} className={`rounded-2xl border ${isSelected ? "border-[var(--aq-border-strong)] bg-[rgba(74,217,217,0.08)]" : "border-[var(--aq-border)] bg-[rgba(10,15,24,0.86)]"}`}>
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => setOpenName(isOpen ? null : item.nome)}
                  className="flex flex-1 items-center justify-between gap-3 text-left"
                >
                  <div>
                    <div className="text-sm font-black text-[var(--aq-title)]">{item.nome}</div>
                    {item.grupo ? <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--aq-text-muted)]">{item.grupo}</div> : null}
                  </div>
                  <ChevronDown size={16} className={`text-[var(--aq-accent)] transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <button onClick={() => onApply(item)} className="aq-button-primary !px-3 !py-2">
                  <Plus size={12} />
                  Adicionar
                </button>
              </div>

              {isOpen ? (
                <div className="border-t border-[var(--aq-border)] px-4 py-4">
                  {item.desc ? <p className="text-sm leading-relaxed text-[var(--aq-text)]">{item.desc}</p> : null}
                  {item.poder ? <p className="mt-3 text-sm leading-relaxed text-[var(--aq-text)]"><strong className="text-[var(--aq-title)]">Poder:</strong> {item.poder}</p> : null}
                  {item.tags?.length ? <p className="mt-3 text-sm leading-relaxed text-[var(--aq-text)]"><strong className="text-[var(--aq-title)]">Tags:</strong> {item.tags.join(", ")}</p> : null}
                  {item.proficiencias?.length ? <p className="mt-3 text-sm leading-relaxed text-[var(--aq-text)]"><strong className="text-[var(--aq-title)]">Pericias:</strong> {item.proficiencias.join(", ")}</p> : null}
                  {item.atributos && Object.keys(item.atributos).length > 0 ? (
                    <p className="mt-3 text-sm leading-relaxed text-[var(--aq-text)]">
                      <strong className="text-[var(--aq-title)]">Bonus:</strong>{" "}
                      {Object.entries(item.atributos)
                        .map(([key, value]) => `${key} +${value}`)
                        .join(", ")}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
