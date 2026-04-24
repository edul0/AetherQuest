"use client";

import { useEffect, useState } from "react";
import { BookOpen, FileText, RotateCcw, X } from "lucide-react";
import { Handout } from "@/src/lib/types";

type HandoutViewerProps = {
  handout: Handout | null;
  onClose: () => void;
};

export default function HandoutViewer({ handout, onClose }: HandoutViewerProps) {
  const [face, setFace] = useState<"front" | "back">("front");

  useEffect(() => {
    setFace("front");
  }, [handout?.id]);

  if (!handout) return null;

  const activeImage = face === "back" ? handout.image_back_url || handout.image_url : handout.image_url || handout.image_back_url;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(0,0,0,0.78)] px-3 py-6 backdrop-blur-sm">
      <button className="absolute inset-0" onClick={onClose} aria-label="Fechar item" />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-cyan-300/20 bg-[rgba(7,10,16,0.96)] shadow-[0_24px_80px_rgba(0,0,0,0.6)] md:flex-row">
        <div className="flex min-h-[320px] flex-1 items-center justify-center border-b border-cyan-300/10 bg-[radial-gradient(circle_at_top,rgba(74,217,217,0.14),transparent_38%),rgba(5,10,16,0.92)] p-4 md:min-h-[680px] md:border-b-0 md:border-r">
          {activeImage ? (
            <img
              src={activeImage}
              alt={handout.titulo}
              className="max-h-[72vh] w-auto max-w-full rounded-[22px] border border-white/10 object-contain shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
            />
          ) : (
            <div className="flex h-[320px] w-full max-w-[420px] flex-col items-center justify-center rounded-[22px] border border-dashed border-cyan-300/18 bg-[rgba(74,217,217,0.04)] text-center text-[var(--aq-text-muted)]">
              <FileText size={28} className="mb-3 text-[var(--aq-accent)]" />
              <p className="text-sm font-black uppercase tracking-[0.18em]">Item sem imagem</p>
              <p className="mt-2 max-w-[280px] text-xs leading-relaxed">Envie a frente e o verso para o item ficar no estilo documento encontrado.</p>
            </div>
          )}
        </div>

        <aside className="aq-scrollbar flex w-full max-w-[420px] flex-col overflow-y-auto p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--aq-accent)]">Inspecao</div>
              <h3 className="mt-2 text-2xl font-black uppercase tracking-[0.08em] text-[var(--aq-title)]">{handout.titulo}</h3>
              <p className="mt-2 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--aq-text-muted)]">{handout.tipo || "documento"}</p>
            </div>
            <button onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-2 text-[var(--aq-text-muted)] hover:text-[var(--aq-title)]">
              <X size={16} />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              onClick={() => setFace("front")}
              className={`rounded-2xl border px-3 py-3 text-[11px] font-black uppercase tracking-[0.18em] ${face === "front" ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-200" : "border-white/10 bg-white/5 text-[var(--aq-text-muted)]"}`}
            >
              <BookOpen size={14} className="mx-auto mb-2" />
              Frente
            </button>
            <button
              onClick={() => setFace("back")}
              className={`rounded-2xl border px-3 py-3 text-[11px] font-black uppercase tracking-[0.18em] ${face === "back" ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-200" : "border-white/10 bg-white/5 text-[var(--aq-text-muted)]"}`}
            >
              <RotateCcw size={14} className="mx-auto mb-2" />
              Verso
            </button>
          </div>

          <div className="mt-5 rounded-[22px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--aq-text-muted)]">Anotacoes</div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--aq-text)]">
              {handout.content?.trim() || "Sem texto ainda. Adicione descricao, puzzle, pistas ou lore do item."}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
