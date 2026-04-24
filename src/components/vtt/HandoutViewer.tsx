"use client";

import { useEffect, useState } from "react";
import { BookOpen, ChevronRight, FileText, RotateCcw, X } from "lucide-react";
import { Handout } from "@/src/lib/types";

const SHEIKAH_PANEL_STYLE = {
  clipPath: "polygon(18px 0, calc(100% - 18px) 0, 100% 18px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 18px 100%, 0 calc(100% - 18px), 0 18px)",
} as const;

type HandoutViewerProps = {
  handout: Handout | null;
  onClose: () => void;
};

export default function HandoutViewer({ handout, onClose }: HandoutViewerProps) {
  const [panel, setPanel] = useState<"front" | "back" | "text">("front");

  useEffect(() => {
    if (!handout) return;
    if (handout.image_url) {
      setPanel("front");
      return;
    }
    if (handout.image_back_url) {
      setPanel("back");
      return;
    }
    setPanel("text");
  }, [handout]);

  if (!handout) return null;

  const activeImage =
    panel === "back" ? handout.image_back_url || handout.image_url : panel === "front" ? handout.image_url || handout.image_back_url : null;
  const hasFront = Boolean(handout.image_url);
  const hasBack = Boolean(handout.image_back_url);
  const hasText = Boolean(handout.content?.trim());

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(2,6,12,0.88)] px-2 py-2 backdrop-blur-md md:px-4 md:py-4">
      <button className="absolute inset-0" onClick={onClose} aria-label="Fechar item" />
      <div className="relative z-10 grid h-[96svh] w-full max-w-6xl grid-rows-[minmax(0,1fr)_auto] overflow-hidden border border-cyan-300/16 bg-[linear-gradient(180deg,rgba(8,12,18,0.98),rgba(4,8,14,0.98))] shadow-[0_24px_90px_rgba(0,0,0,0.62)] md:h-[92vh] md:grid-cols-[minmax(0,1.2fr)_380px] md:grid-rows-1" style={SHEIKAH_PANEL_STYLE}>
        <div className="relative flex min-h-0 items-center justify-center overflow-hidden border-b border-cyan-300/10 bg-[radial-gradient(circle_at_top,rgba(74,217,217,0.16),transparent_34%),linear-gradient(180deg,rgba(9,14,21,0.96),rgba(4,8,14,0.98))] px-4 pb-20 pt-14 md:border-b-0 md:border-r md:px-8 md:py-8">
          <div className="pointer-events-none absolute left-4 top-4 rounded-full border border-cyan-300/20 bg-[rgba(74,217,217,0.08)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200 md:left-6 md:top-6">
            Documento Encontrado
          </div>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full border border-white/10 bg-[rgba(255,255,255,0.04)] p-2 text-[var(--aq-text-muted)] transition hover:border-cyan-300/24 hover:text-[var(--aq-title)] md:right-6 md:top-6"
          >
            <X size={16} />
          </button>

          {panel === "text" ? (
            <div className="relative flex h-full w-full items-center justify-center">
              <div className="w-full max-w-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(245,238,224,0.98),rgba(224,215,198,0.96))] p-6 text-[#16120f] shadow-[0_24px_40px_rgba(0,0,0,0.42)] md:p-10" style={SHEIKAH_PANEL_STYLE}>
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[#5b5248]">Arquivo Lido</div>
                <div className="mt-3 text-2xl font-black uppercase tracking-[0.06em] md:text-3xl">{handout.titulo}</div>
                <div className="mt-6 whitespace-pre-wrap text-sm leading-7 md:text-[15px]">
                  {handout.content?.trim() || "Sem texto ainda. Adicione descricao, puzzle, pistas ou lore do item."}
                </div>
              </div>
            </div>
          ) : activeImage ? (
            <div className="relative flex h-full w-full items-center justify-center">
              <div className="absolute inset-x-[8%] bottom-8 h-20 rounded-full bg-cyan-300/10 blur-3xl md:inset-x-[20%]" />
              <img
                src={activeImage}
                alt={handout.titulo}
                className="relative z-10 max-h-[calc(100%-12px)] w-auto max-w-full object-contain drop-shadow-[0_24px_40px_rgba(0,0,0,0.55)]"
              />
            </div>
          ) : (
            <div className="flex h-[320px] w-full max-w-[420px] flex-col items-center justify-center rounded-[24px] border border-dashed border-cyan-300/18 bg-[rgba(74,217,217,0.04)] text-center text-[var(--aq-text-muted)]">
              <FileText size={28} className="mb-3 text-[var(--aq-accent)]" />
              <p className="text-sm font-black uppercase tracking-[0.18em]">Item sem imagem</p>
              <p className="mt-2 max-w-[280px] text-xs leading-relaxed">Envie a frente e o verso para o item ficar no estilo documento encontrado.</p>
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-center justify-center md:bottom-6">
            <div className="border border-white/10 bg-[rgba(8,12,18,0.82)] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--aq-title)] shadow-[0_12px_36px_rgba(0,0,0,0.4)] backdrop-blur-md" style={SHEIKAH_PANEL_STYLE}>
              {panel === "front" ? "Foto Frente" : panel === "back" ? "Foto Verso" : "Texto"}
            </div>
          </div>
        </div>

        <aside className="aq-scrollbar flex min-h-0 flex-col overflow-y-auto border-t border-white/8 px-4 py-4 md:border-l md:border-t-0 md:px-6 md:py-6">
          <div className="border-b border-white/8 pb-4">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--aq-accent)]">Inspecao</div>
            <h3 className="mt-2 text-2xl font-black uppercase tracking-[0.08em] text-[var(--aq-title)] md:text-[2rem]">{handout.titulo}</h3>
            <div className="mt-3 inline-flex rounded-full border border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--aq-text-muted)]">
              {handout.tipo || "documento"}
            </div>
          </div>

          <div className="py-4">
            <div className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--aq-text-muted)]">Explorar item</div>
            <div className="space-y-2">
              {hasFront ? (
                <button
                  onClick={() => setPanel("front")}
                  className={`flex w-full items-center justify-between border px-4 py-3 text-left transition ${
                    panel === "front"
                      ? "border-cyan-300/24 bg-cyan-400/10 text-cyan-100"
                      : "border-white/10 bg-white/[0.03] text-[var(--aq-title)] hover:border-white/20"
                  }`}
                  style={SHEIKAH_PANEL_STYLE}
                >
                  <span className="flex items-center gap-3">
                    <BookOpen size={15} />
                    <span className="text-[11px] font-black uppercase tracking-[0.18em]">Foto frente</span>
                  </span>
                  <ChevronRight size={15} />
                </button>
              ) : null}

              {hasBack ? (
                <button
                  onClick={() => setPanel("back")}
                  className={`flex w-full items-center justify-between border px-4 py-3 text-left transition ${
                    panel === "back"
                      ? "border-cyan-300/24 bg-cyan-400/10 text-cyan-100"
                      : "border-white/10 bg-white/[0.03] text-[var(--aq-title)] hover:border-white/20"
                  }`}
                  style={SHEIKAH_PANEL_STYLE}
                >
                  <span className="flex items-center gap-3">
                    <RotateCcw size={15} />
                    <span className="text-[11px] font-black uppercase tracking-[0.18em]">Foto verso</span>
                  </span>
                  <ChevronRight size={15} />
                </button>
              ) : null}

              {hasText ? (
                <button
                  onClick={() => setPanel("text")}
                  className={`flex w-full items-center justify-between border px-4 py-3 text-left transition ${
                    panel === "text"
                      ? "border-cyan-300/24 bg-cyan-400/10 text-cyan-100"
                      : "border-white/10 bg-white/[0.03] text-[var(--aq-title)] hover:border-white/20"
                  }`}
                  style={SHEIKAH_PANEL_STYLE}
                >
                  <span className="flex items-center gap-3">
                    <FileText size={15} />
                    <span className="text-[11px] font-black uppercase tracking-[0.18em]">Texto</span>
                  </span>
                  <ChevronRight size={15} />
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-auto border-t border-white/8 pt-4">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--aq-text-muted)]">Estado da peca</div>
            <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-[var(--aq-text-muted)]">
              <span>Face ativa</span>
              <span className="font-black text-[var(--aq-title)]">{panel === "front" ? "Frente" : panel === "back" ? "Verso" : "Texto"}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
