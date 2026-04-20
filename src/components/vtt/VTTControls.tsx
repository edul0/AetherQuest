"use client";

import type { ChangeEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Crosshair,
  Dice5,
  Grid2x2,
  Hand,
  Map as MapIcon,
  MousePointer2,
  RefreshCcw,
  Ruler,
  Users,
} from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { SceneViewPreferences, VTTToolMode } from "@/src/lib/types";

type VTTControlsProps = {
  cenaId: string;
  salaId?: string | null;
  preferences: SceneViewPreferences;
  onPreferencesChange: (patch: Partial<SceneViewPreferences>) => void;
};

const TOOL_OPTIONS: Array<{ id: VTTToolMode; label: string; icon: typeof MousePointer2 }> = [
  { id: "select", label: "Selecionar", icon: MousePointer2 },
  { id: "pan", label: "Pan", icon: Hand },
  { id: "measure", label: "Medir", icon: Ruler },
];

export default function VTTControls({ cenaId, salaId, preferences, onPreferencesChange }: VTTControlsProps) {
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
    await supabase.from("cenas").update({ mapa_url: data.publicUrl }).eq("id", cenaId);
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
    }
  };

  const nudgeMap = (dx: number, dy: number) => {
    onPreferencesChange({
      mapOffsetX: preferences.mapOffsetX + dx,
      mapOffsetY: preferences.mapOffsetY + dy,
    });
  };

  return (
    <div className="aq-scrollbar fixed bottom-[190px] left-1/2 z-50 max-h-[42vh] w-[calc(100vw-1rem)] max-w-[420px] -translate-x-1/2 overflow-y-auto rounded-3xl border border-[var(--aq-border-strong)] bg-[rgba(10,15,24,0.96)] p-4 shadow-[0_0_28px_rgba(0,0,0,0.48)] backdrop-blur-md md:bottom-[220px] md:left-auto md:right-4 md:w-[340px] md:max-h-[68vh] md:translate-x-0">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="aq-kicker">Tactical Deck</div>
          <div className="mt-1 text-sm font-black uppercase tracking-[0.16em] text-[var(--aq-title)]">Ferramentas da Cena</div>
        </div>
        <button
          onClick={() => alert(`D20: ${Math.floor(Math.random() * 20) + 1}`)}
          className="rounded-xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] p-3 text-[var(--aq-title)] transition-all hover:border-[var(--aq-border-strong)] hover:bg-[rgba(74,217,217,0.14)] hover:text-[var(--aq-accent)] active:scale-95"
          title="Rolar D20"
        >
          <Dice5 size={20} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {TOOL_OPTIONS.map((tool) => {
          const Icon = tool.icon;
          const active = preferences.toolMode === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => onPreferencesChange({ toolMode: tool.id })}
              className={`rounded-2xl border px-2 py-3 text-[10px] font-black uppercase tracking-[0.16em] transition-all md:px-3 md:text-xs md:tracking-[0.18em] ${
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
        <button
          onClick={addToken}
          className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] px-3 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--aq-title)] transition-all hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)] md:text-xs md:tracking-[0.18em]"
        >
          <Users size={15} />
          Token
        </button>

        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] px-3 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--aq-title)] transition-all hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)] md:text-xs md:tracking-[0.18em]">
          <MapIcon size={15} />
          Mapa
          <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
        </label>
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.68)] p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[var(--aq-title)]">
            <Grid2x2 size={15} className="text-[var(--aq-accent)]" />
            <span className="text-xs font-black uppercase tracking-[0.18em]">Grid</span>
          </div>
          <button
            onClick={() => onPreferencesChange({ showGrid: !preferences.showGrid })}
            className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
              preferences.showGrid
                ? "border-[var(--aq-border-strong)] bg-[rgba(74,217,217,0.12)] text-[var(--aq-accent)]"
                : "border-[var(--aq-border)] text-[var(--aq-text-muted)]"
            }`}
          >
            {preferences.showGrid ? "Visivel" : "Oculto"}
          </button>
        </div>

        <div className="grid gap-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--aq-text-muted)]">
            Tamanho da celula
            <div className="mt-2 flex items-center gap-2">
              <input
                type="range"
                min={20}
                max={120}
                step={5}
                value={preferences.gridSize}
                onChange={(event) => onPreferencesChange({ gridSize: Number(event.target.value) })}
                className="w-full"
              />
              <span className="w-12 text-right text-[var(--aq-title)]">{preferences.gridSize}</span>
            </div>
          </label>

          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--aq-text-muted)]">
            Opacidade
            <div className="mt-2 flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={0.5}
                step={0.02}
                value={preferences.gridOpacity}
                onChange={(event) => onPreferencesChange({ gridOpacity: Number(event.target.value) })}
                className="w-full"
              />
              <span className="w-12 text-right text-[var(--aq-title)]">{Math.round(preferences.gridOpacity * 100)}%</span>
            </div>
          </label>

          <button
            onClick={() => onPreferencesChange({ snapToGrid: !preferences.snapToGrid })}
            className={`rounded-2xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all ${
              preferences.snapToGrid
                ? "border-[var(--aq-border-strong)] bg-[rgba(74,217,217,0.12)] text-[var(--aq-accent)]"
                : "border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] text-[var(--aq-text-muted)]"
            }`}
          >
            {preferences.snapToGrid ? "Snap ativo" : "Snap livre"}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.68)] p-3">
        <div className="mb-3 flex items-center gap-2 text-[var(--aq-title)]">
          <Crosshair size={15} className="text-[var(--aq-accent)]" />
          <span className="text-xs font-black uppercase tracking-[0.18em]">Alinhamento do mapa</span>
        </div>

        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--aq-text-muted)]">
          Escala do mapa
          <div className="mt-2 flex items-center gap-2">
            <input
              type="range"
              min={0.4}
              max={2.5}
              step={0.05}
              value={preferences.mapScale}
              onChange={(event) => onPreferencesChange({ mapScale: Number(event.target.value) })}
              className="w-full"
            />
            <span className="w-12 text-right text-[var(--aq-title)]">{preferences.mapScale.toFixed(2)}x</span>
          </div>
        </label>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div />
          <button onClick={() => nudgeMap(0, -10)} className="rounded-xl border border-[var(--aq-border)] p-2 text-[var(--aq-title)] hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)]">
            <ChevronUp size={15} className="mx-auto" />
          </button>
          <div />
          <button onClick={() => nudgeMap(-10, 0)} className="rounded-xl border border-[var(--aq-border)] p-2 text-[var(--aq-title)] hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)]">
            <ChevronLeft size={15} className="mx-auto" />
          </button>
          <button
            onClick={() => onPreferencesChange({ mapOffsetX: 0, mapOffsetY: 0, mapScale: 1 })}
            className="rounded-xl border border-[var(--aq-border)] p-2 text-[var(--aq-title)] hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)]"
            title="Resetar alinhamento"
          >
            <RefreshCcw size={15} className="mx-auto" />
          </button>
          <button onClick={() => nudgeMap(10, 0)} className="rounded-xl border border-[var(--aq-border)] p-2 text-[var(--aq-title)] hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)]">
            <ChevronRight size={15} className="mx-auto" />
          </button>
          <div />
          <button onClick={() => nudgeMap(0, 10)} className="rounded-xl border border-[var(--aq-border)] p-2 text-[var(--aq-title)] hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)]">
            <ChevronDown size={15} className="mx-auto" />
          </button>
          <div />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--aq-text-muted)]">
          <div className="rounded-xl border border-[var(--aq-border)] px-3 py-2">Offset X: {preferences.mapOffsetX}</div>
          <div className="rounded-xl border border-[var(--aq-border)] px-3 py-2">Offset Y: {preferences.mapOffsetY}</div>
        </div>
      </div>
    </div>
  );
}
