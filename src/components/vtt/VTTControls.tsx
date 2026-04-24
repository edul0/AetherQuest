"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Crosshair,
  Dice5,
  Grid2x2,
  Hand,
  ImageMinus,
  Map as MapIcon,
  MousePointer2,
  Move,
  Plus,
  RefreshCcw,
  Ruler,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { SceneViewPreferences, VTTToolMode } from "@/src/lib/types";
import { selectVTTGrid, selectVTTToolMode, useVTTStore } from "@/src/store/useVTTStore";

type VTTControlsProps = {
  cenaId: string;
  salaId?: string | null;
  preferences: SceneViewPreferences;
  onPreferencesChange: (patch: Partial<SceneViewPreferences>) => void;
  onMapUrlChange?: (url: string | null) => void;
};

const TOOL_OPTIONS: Array<{ id: VTTToolMode; label: string; icon: typeof MousePointer2 }> = [
  { id: "select", label: "Selecionar", icon: MousePointer2 },
  { id: "pan", label: "Pan", icon: Hand },
  { id: "measure", label: "Medir", icon: Ruler },
  { id: "map", label: "Mover mapa", icon: Move },
];

export default function VTTControls({ cenaId, salaId, preferences, onPreferencesChange, onMapUrlChange }: VTTControlsProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const runtimeGrid = useVTTStore(selectVTTGrid);
  const runtimeToolMode = useVTTStore(selectVTTToolMode);
  const setGrid = useVTTStore((state) => state.setGrid);
  const setToolMode = useVTTStore((state) => state.setToolMode);

  const mergedPreferences: SceneViewPreferences = {
    ...preferences,
    ...runtimeGrid,
    toolMode: runtimeToolMode,
  };

  useEffect(() => {
    setGrid({
      gridSize: preferences.gridSize,
      gridOpacity: preferences.gridOpacity,
      showGrid: preferences.showGrid,
      snapToGrid: preferences.snapToGrid,
    });
    setToolMode(preferences.toolMode);
  }, [preferences.gridOpacity, preferences.gridSize, preferences.showGrid, preferences.snapToGrid, preferences.toolMode, setGrid, setToolMode]);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !cenaId) {
      return;
    }

    const extension = file.name.split(".").pop() || "png";
    const path = `mapas/${cenaId}-${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("mapas").upload(path, file, { upsert: true });
    if (error) {
      alert(`Falha no upload do mapa: ${error.message}`);
      return;
    }

    const { data } = supabase.storage.from("mapas").getPublicUrl(path);
    const { error: updateError } = await supabase.from("cenas").update({ mapa_url: data.publicUrl }).eq("id", cenaId);
    if (updateError) {
      alert(`Falha ao vincular mapa na cena: ${updateError.message}`);
      return;
    }

    onMapUrlChange?.(data.publicUrl);
    setToolMode("map");
    onPreferencesChange({ mapScale: 1, mapOffsetX: 0, mapOffsetY: 0, toolMode: "map" });
    setPanelOpen(false);
  };

  const removeMap = async () => {
    const { error } = await supabase.from("cenas").update({ mapa_url: null }).eq("id", cenaId);
    if (error) {
      alert(`Falha ao remover mapa: ${error.message}`);
      return;
    }

    onMapUrlChange?.(null);
    setToolMode("select");
    onPreferencesChange({ mapScale: 1, mapOffsetX: 0, mapOffsetY: 0, toolMode: "select" });
    setPanelOpen(false);
  };

  const addToken = async () => {
    if (!cenaId) {
      return;
    }

    const payload: Record<string, unknown> = {
      cena_id: cenaId,
      nome: "Entidade",
      x: 0,
      y: 0,
      cor: "#ef4444",
    };

    if (salaId) {
      payload.sala = salaId;
    }

    const { error } = await supabase.from("tokens").insert([payload]);
    if (error) {
      alert(`Falha ao criar token: ${error.message}`);
      return;
    }

    setPanelOpen(false);
  };

  const nudgeMap = (dx: number, dy: number) => {
    onPreferencesChange({
      mapOffsetX: mergedPreferences.mapOffsetX + dx,
      mapOffsetY: mergedPreferences.mapOffsetY + dy,
    });
  };

  const bumpMapScale = (delta: number) => {
    onPreferencesChange({
      mapScale: Math.max(0.2, Math.min(3, Number((mergedPreferences.mapScale + delta).toFixed(2)))),
    });
  };

  return (
    <>
      <button
        onClick={() => setPanelOpen(true)}
        className="fixed bottom-[104px] right-3 z-50 flex items-center gap-2 rounded-full border border-[var(--aq-border-strong)] bg-[rgba(5,10,16,0.92)] px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--aq-title)] shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md md:bottom-5 md:right-4"
      >
        <SlidersHorizontal size={15} />
        Ferramentas
      </button>

      {panelOpen ? (
        <button className="fixed inset-0 z-40 bg-[rgba(0,0,0,0.35)]" onClick={() => setPanelOpen(false)} aria-label="Fechar ferramentas" />
      ) : null}

      <div className={`${panelOpen ? "block" : "hidden"} aq-scrollbar fixed inset-x-3 bottom-[96px] z-50 max-h-[64vh] overflow-y-auto rounded-3xl border border-[var(--aq-border-strong)] bg-[rgba(10,15,24,0.96)] p-4 shadow-[0_0_28px_rgba(0,0,0,0.48)] backdrop-blur-md md:inset-x-auto md:bottom-20 md:right-4 md:max-h-[72vh] md:w-[340px]`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="aq-kicker">Tactical Deck</div>
            <div className="mt-1 text-sm font-black uppercase tracking-[0.16em] text-[var(--aq-title)]">Ferramentas da Cena</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => alert(`D20: ${Math.floor(Math.random() * 20) + 1}`)}
              className="rounded-xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] p-3 text-[var(--aq-title)] transition-all hover:border-[var(--aq-border-strong)] hover:bg-[rgba(74,217,217,0.14)] hover:text-[var(--aq-accent)] active:scale-95"
              title="Rolar D20"
            >
              <Dice5 size={20} />
            </button>
            <button onClick={() => setPanelOpen(false)} className="rounded-xl border border-[var(--aq-border)] p-3 text-[var(--aq-text-muted)]">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {TOOL_OPTIONS.map((tool) => {
            const Icon = tool.icon;
            const active = mergedPreferences.toolMode === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  setToolMode(tool.id);
                  onPreferencesChange({ toolMode: tool.id });
                }}
                className={`rounded-2xl border px-3 py-3 text-[10px] font-black uppercase tracking-[0.16em] transition-all md:text-xs md:tracking-[0.18em] ${
                  active
                    ? "border-[var(--aq-border-strong)] bg-[rgba(74,217,217,0.14)] text-[var(--aq-accent)]"
                    : "border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] text-[var(--aq-text-muted)] hover:text-[var(--aq-title)]"
                }`}
              >
                <Icon size={15} className="mx-auto mb-2" />
                {tool.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={addToken} className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] px-3 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--aq-title)] transition-all hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)] md:text-xs md:tracking-[0.18em]">
            <Users size={15} />
            Token
          </button>

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] px-3 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--aq-title)] transition-all hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)] md:text-xs md:tracking-[0.18em]">
            <MapIcon size={15} />
            Enviar mapa
            <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
          </label>
        </div>

        <button onClick={removeMap} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] px-3 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-red-300 transition-all hover:bg-[rgba(239,68,68,0.14)] md:text-xs">
          <ImageMinus size={15} />
          Remover mapa da cena
        </button>

        <div className="mt-4 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.68)] p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[var(--aq-title)]">
              <Grid2x2 size={15} className="text-[var(--aq-accent)]" />
              <span className="text-xs font-black uppercase tracking-[0.18em]">Grid</span>
            </div>
            <button
              onClick={() => {
                const next = !mergedPreferences.showGrid;
                setGrid({ showGrid: next });
                onPreferencesChange({ showGrid: next });
              }}
              className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                mergedPreferences.showGrid
                  ? "border-[var(--aq-border-strong)] bg-[rgba(74,217,217,0.12)] text-[var(--aq-accent)]"
                  : "border-[var(--aq-border)] text-[var(--aq-text-muted)]"
              }`}
            >
              {mergedPreferences.showGrid ? "Visivel" : "Oculto"}
            </button>
          </div>

          <div className="grid gap-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--aq-text-muted)]">
              Tamanho da celula
              <div className="mt-2 flex items-center gap-2">
                <input type="range" min={20} max={120} step={5} value={mergedPreferences.gridSize} onChange={(event) => { const next = Number(event.target.value); setGrid({ gridSize: next }); onPreferencesChange({ gridSize: next }); }} className="w-full" />
                <span className="w-12 text-right text-[var(--aq-title)]">{mergedPreferences.gridSize}</span>
              </div>
            </label>

            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--aq-text-muted)]">
              Opacidade
              <div className="mt-2 flex items-center gap-2">
                <input type="range" min={0} max={0.5} step={0.02} value={mergedPreferences.gridOpacity} onChange={(event) => { const next = Number(event.target.value); setGrid({ gridOpacity: next }); onPreferencesChange({ gridOpacity: next }); }} className="w-full" />
                <span className="w-12 text-right text-[var(--aq-title)]">{Math.round(mergedPreferences.gridOpacity * 100)}%</span>
              </div>
            </label>

            <button
              onClick={() => {
                const next = !mergedPreferences.snapToGrid;
                setGrid({ snapToGrid: next });
                onPreferencesChange({ snapToGrid: next });
              }}
              className={`rounded-2xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all ${
                mergedPreferences.snapToGrid
                  ? "border-[var(--aq-border-strong)] bg-[rgba(74,217,217,0.12)] text-[var(--aq-accent)]"
                  : "border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] text-[var(--aq-text-muted)]"
              }`}
            >
              {mergedPreferences.snapToGrid ? "Snap ativo" : "Snap livre"}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.68)] p-3">
          <div className="mb-3 flex items-center gap-2 text-[var(--aq-title)]">
            <Crosshair size={15} className="text-[var(--aq-accent)]" />
            <span className="text-xs font-black uppercase tracking-[0.18em]">Alinhamento do mapa</span>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <button onClick={() => bumpMapScale(-0.1)} className="rounded-xl border border-[var(--aq-border)] p-2 text-[var(--aq-title)] hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)]">Diminuir</button>
            <button onClick={() => bumpMapScale(0.1)} className="rounded-xl border border-[var(--aq-border)] p-2 text-[var(--aq-title)] hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)]">Aumentar</button>
          </div>

          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--aq-text-muted)]">
            Escala do mapa
            <div className="mt-2 flex items-center gap-2">
              <input type="range" min={0.2} max={3} step={0.05} value={mergedPreferences.mapScale} onChange={(event) => onPreferencesChange({ mapScale: Number(event.target.value) })} className="w-full" />
              <span className="w-12 text-right text-[var(--aq-title)]">{mergedPreferences.mapScale.toFixed(2)}x</span>
            </div>
          </label>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div />
            <button onClick={() => nudgeMap(0, -10)} className="rounded-xl border border-[var(--aq-border)] p-2 text-[var(--aq-title)] hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)]"><ChevronUp size={15} className="mx-auto" /></button>
            <div />
            <button onClick={() => nudgeMap(-10, 0)} className="rounded-xl border border-[var(--aq-border)] p-2 text-[var(--aq-title)] hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)]"><ChevronLeft size={15} className="mx-auto" /></button>
            <button onClick={() => onPreferencesChange({ mapOffsetX: 0, mapOffsetY: 0, mapScale: 1 })} className="rounded-xl border border-[var(--aq-border)] p-2 text-[var(--aq-title)] hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)]" title="Resetar alinhamento"><RefreshCcw size={15} className="mx-auto" /></button>
            <button onClick={() => nudgeMap(10, 0)} className="rounded-xl border border-[var(--aq-border)] p-2 text-[var(--aq-title)] hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)]"><ChevronRight size={15} className="mx-auto" /></button>
            <div />
            <button onClick={() => nudgeMap(0, 10)} className="rounded-xl border border-[var(--aq-border)] p-2 text-[var(--aq-title)] hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)]"><ChevronDown size={15} className="mx-auto" /></button>
            <div />
          </div>

          <div className="mt-3 rounded-xl border border-[var(--aq-border)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--aq-text-muted)]">
            {mergedPreferences.toolMode === "map" ? "Modo mover mapa ativo: arraste a imagem no tabuleiro." : "Ative Mover mapa para arrastar a imagem no tabuleiro."}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--aq-text-muted)]">
            <div className="rounded-xl border border-[var(--aq-border)] px-3 py-2">Offset X: {mergedPreferences.mapOffsetX}</div>
            <div className="rounded-xl border border-[var(--aq-border)] px-3 py-2">Offset Y: {mergedPreferences.mapOffsetY}</div>
          </div>
        </div>
      </div>
    </>
  );
}
