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
  Layers3,
  Map as MapIcon,
  MousePointer2,
  Move,
  Plus,
  RefreshCcw,
  Ruler,
  SlidersHorizontal,
  Text,
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

function previewUrl(file: File | null) {
  return file ? URL.createObjectURL(file) : null;
}

function hasMissingTable(error: unknown, tableName: string) {
  const message = String((error as { message?: string } | null)?.message ?? "").toLowerCase();
  return message.includes(`public.${tableName}`.toLowerCase()) || message.includes(`relation "public.${tableName}"`.toLowerCase());
}

export default function VTTControls({ cenaId, salaId, preferences, onPreferencesChange, onMapUrlChange }: VTTControlsProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [handoutTitle, setHandoutTitle] = useState("");
  const [handoutText, setHandoutText] = useState("");
  const [handoutFront, setHandoutFront] = useState<File | null>(null);
  const [handoutBack, setHandoutBack] = useState<File | null>(null);
  const [savingHandout, setSavingHandout] = useState(false);
  const runtimeGrid = useVTTStore(selectVTTGrid);
  const runtimeToolMode = useVTTStore(selectVTTToolMode);
  const setGrid = useVTTStore((state) => state.setGrid);
  const setToolMode = useVTTStore((state) => state.setToolMode);
  const handoutFrontPreview = handoutFront ? previewUrl(handoutFront) : null;
  const handoutBackPreview = handoutBack ? previewUrl(handoutBack) : null;

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

  useEffect(() => {
    return () => {
      if (handoutFrontPreview) URL.revokeObjectURL(handoutFrontPreview);
      if (handoutBackPreview) URL.revokeObjectURL(handoutBackPreview);
    };
  }, [handoutBackPreview, handoutFrontPreview]);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !cenaId) {
      return;
    }

    const extension = file.name.split(".").pop() || "png";
    const path = `mapas/${cenaId}-${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("mapas").upload(path, file);
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

  const uploadAsset = async (file: File, prefix: string) => {
    const extension = file.name.split(".").pop() || "png";
    const path = `${prefix}/${cenaId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${extension}`;
    const { error } = await supabase.storage.from("mapas").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("mapas").getPublicUrl(path);
    return data.publicUrl;
  };

  const addMapItem = async () => {
    if (!cenaId || !salaId) {
      return;
    }

    const { error } = await supabase.from("map_items").insert([
      {
        cena_id: cenaId,
        sala_id: salaId,
        nome: "Prop",
        tipo: "prop",
        x: 0,
        y: 0,
        width: 88,
        height: 88,
        z_index: -10,
        visible_to_players: true,
      },
    ]);

    if (error) {
      if (hasMissingTable(error, "map_items")) {
        alert("A tabela map_items ainda nao existe no Supabase. Rode o SQL de reparo VTT Director Tools antes de criar props da cena.");
        return;
      }
      alert(`Falha ao criar item da cena: ${error.message}`);
      return;
    }

    setPanelOpen(false);
  };

  const createHandout = async () => {
    if (!salaId || !handoutTitle.trim()) {
      alert("Defina pelo menos um titulo para o item.");
      return;
    }

    try {
      setSavingHandout(true);
      const imageUrl = handoutFront ? await uploadAsset(handoutFront, "handouts/front") : null;
      const imageBackUrl = handoutBack ? await uploadAsset(handoutBack, "handouts/back") : null;
      const { data: createdHandout, error } = await supabase.from("handouts").insert([
        {
          sala_id: salaId,
          cena_id: cenaId,
          titulo: handoutTitle.trim(),
          tipo: "item_inspecao",
          content: handoutText.trim() || null,
          image_url: imageUrl,
          image_back_url: imageBackUrl,
          visible_to_players: true,
        },
      ]).select("id, titulo, image_url").single();

      if (error) {
        if (hasMissingTable(error, "handouts")) {
          alert("A tabela handouts ainda nao existe no Supabase. Rode o SQL de reparo VTT Director Tools antes de criar itens de inspecao.");
          return;
        }
        alert(`Falha ao criar item de inspecao: ${error.message}`);
        return;
      }

      if (createdHandout?.id) {
        const { error: mapItemError } = await supabase.from("map_items").insert([
          {
            cena_id: cenaId,
            sala_id: salaId,
            nome: createdHandout.titulo,
            tipo: "item_inspecao",
            x: 0,
            y: 0,
            width: 82,
            height: 82,
            z_index: -6,
            image_url: createdHandout.image_url,
            visible_to_players: true,
            interactive: true,
            payload: { handout_id: createdHandout.id },
          },
        ]);

        if (mapItemError && !hasMissingTable(mapItemError, "map_items")) {
          alert(`Item criado, mas a peca do mapa falhou: ${mapItemError.message}`);
        }
        if (mapItemError && hasMissingTable(mapItemError, "map_items")) {
          alert("O item foi criado, mas a tabela map_items ainda nao existe no Supabase. Rode o SQL de reparo para ele aparecer fisicamente no mapa.");
        }
      }

      setHandoutTitle("");
      setHandoutText("");
      setHandoutFront(null);
      setHandoutBack(null);
      setPanelOpen(false);
    } finally {
      setSavingHandout(false);
    }
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
        className="aq-hud-button fixed bottom-[92px] right-3 z-50 flex h-11 items-center gap-2 px-4 text-[9px] font-black uppercase tracking-[0.18em] text-[var(--aq-title)] lg:bottom-4 lg:right-4"
      >
        <SlidersHorizontal size={15} />
        Ferramentas
      </button>

      {panelOpen ? (
        <button className="fixed inset-0 z-40 bg-[rgba(7,24,39,0.28)] backdrop-blur-[2px]" onClick={() => setPanelOpen(false)} aria-label="Fechar ferramentas" />
      ) : null}

      <div className={`${panelOpen ? "block" : "hidden"} aq-scrollbar aq-vtt-surface fixed inset-x-3 bottom-[86px] z-50 max-h-[66vh] overflow-y-auto p-4 lg:inset-x-auto lg:bottom-20 lg:right-4 lg:max-h-[76vh] lg:w-[316px]`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="aq-kicker text-[0.54rem]">Diretivas</div>
            <div className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-[var(--aq-title)]">Ferramentas</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => alert(`D20: ${Math.floor(Math.random() * 20) + 1}`)}
              className="aq-hud-button flex h-10 w-10 items-center justify-center text-[var(--aq-title)] transition-all active:scale-95"
              title="Rolar D20"
            >
              <Dice5 size={18} />
            </button>
            <button onClick={() => setPanelOpen(false)} className="aq-hud-button flex h-10 w-10 items-center justify-center text-[var(--aq-text-muted)]">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {TOOL_OPTIONS.map((tool) => {
            const Icon = tool.icon;
            const active = mergedPreferences.toolMode === tool.id;
            const shortLabel = tool.id === "measure" ? "Medir" : tool.id === "map" ? "Mapa" : tool.label;
            return (
              <button
                key={tool.id}
                title={tool.label}
                onClick={() => {
                  setToolMode(tool.id);
                  onPreferencesChange({ toolMode: tool.id });
                }}
                className={`flex h-[54px] flex-col items-center justify-center rounded-[0.85rem] border px-1.5 text-[8px] font-black uppercase tracking-[0.08em] transition-all ${
                  active
                    ? "border-[var(--aq-border-strong)] bg-[rgba(157,226,234,0.12)] text-[var(--aq-accent)]"
                    : "border-[var(--aq-border)] bg-[rgba(234,244,246,0.055)] text-[var(--aq-text-muted)] hover:text-[var(--aq-title)]"
                }`}
              >
                <Icon size={15} className="mb-1" />
                <span className="max-w-full truncate">{shortLabel}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <button onClick={addToken} className="flex h-11 items-center justify-center gap-1.5 rounded-[0.8rem] border border-[var(--aq-border)] bg-[rgba(234,244,246,0.055)] px-2 text-[9px] font-black uppercase tracking-[0.12em] text-[var(--aq-title)] transition-all hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)]">
            <Users size={15} />
            Token
          </button>

          <button onClick={addMapItem} disabled={!salaId} className="flex h-11 items-center justify-center gap-1.5 rounded-[0.8rem] border border-[var(--aq-border)] bg-[rgba(234,244,246,0.055)] px-2 text-[9px] font-black uppercase tracking-[0.12em] text-[var(--aq-title)] transition-all hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)] disabled:opacity-40">
            <Layers3 size={15} />
            Item
          </button>

          <label className="flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-[0.8rem] border border-[var(--aq-border)] bg-[rgba(234,244,246,0.055)] px-2 text-[9px] font-black uppercase tracking-[0.12em] text-[var(--aq-title)] transition-all hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)]">
            <MapIcon size={15} />
            Mapa
            <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
          </label>
        </div>

        <button onClick={removeMap} className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-[0.8rem] border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] px-3 text-[9px] font-black uppercase tracking-[0.14em] text-red-300 transition-all hover:bg-[rgba(239,68,68,0.14)]">
          <ImageMinus size={15} />
          Remover mapa
        </button>

        <div className="mt-3 rounded-[0.85rem] border border-[var(--aq-border)] bg-[rgba(35,82,106,0.32)] p-3">
          <div className="mb-3 flex items-center gap-2 text-[var(--aq-title)]">
            <Text size={15} className="text-[var(--aq-accent)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em]">Inspecao</span>
          </div>

          <div className="grid gap-3">
            <input
              value={handoutTitle}
              onChange={(event) => setHandoutTitle(event.target.value)}
              placeholder="Titulo do item"
              className="aq-input"
            />
            <textarea
              value={handoutText}
              onChange={(event) => setHandoutText(event.target.value)}
              placeholder="Texto do item, puzzle, anotacao ou lore"
              className="min-h-[84px] rounded-[0.85rem] border border-[var(--aq-border)] bg-[rgba(234,244,246,0.055)] px-4 py-3 text-sm text-[var(--aq-text)] outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <label className="overflow-hidden rounded-[0.85rem] border border-[var(--aq-border)] bg-[linear-gradient(180deg,rgba(18,27,38,0.96),rgba(7,10,16,0.96))]">
                <div className="flex items-center justify-between border-b border-white/8 px-3 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-[var(--aq-title)]">
                  <span>Frente</span>
                  <span className="text-[8px] text-[var(--aq-accent)]">{handoutFront ? "Pronta" : "Enviar"}</span>
                </div>
                <div className="px-3 py-2">
                  <div className="mb-2 flex h-20 items-center justify-center overflow-hidden rounded-[0.7rem] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(157,226,234,0.14),transparent_48%),rgba(255,255,255,0.03)]">
                    {handoutFrontPreview ? (
                      <img src={handoutFrontPreview} alt="Preview da frente" className="h-full w-full object-cover" />
                    ) : (
                      <div className="px-3 text-center text-[9px] font-black uppercase tracking-[0.18em] text-[var(--aq-text-muted)]">Preview da face frontal</div>
                    )}
                  </div>
                  <div className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-[var(--aq-text-muted)]">{handoutFront?.name || "Sem arquivo"}</div>
                  <input type="file" className="mt-3 block w-full text-[11px]" accept="image/*" onChange={(event) => setHandoutFront(event.target.files?.[0] ?? null)} />
                </div>
              </label>
              <label className="overflow-hidden rounded-[0.85rem] border border-[var(--aq-border)] bg-[linear-gradient(180deg,rgba(18,27,38,0.96),rgba(7,10,16,0.96))]">
                <div className="flex items-center justify-between border-b border-white/8 px-3 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-[var(--aq-title)]">
                  <span>Verso</span>
                  <span className="text-[8px] text-[var(--aq-accent)]">{handoutBack ? "Pronto" : "Opcional"}</span>
                </div>
                <div className="px-3 py-2">
                  <div className="mb-2 flex h-20 items-center justify-center overflow-hidden rounded-[0.7rem] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(157,226,234,0.14),transparent_48%),rgba(255,255,255,0.03)]">
                    {handoutBackPreview ? (
                      <img src={handoutBackPreview} alt="Preview do verso" className="h-full w-full object-cover" />
                    ) : (
                      <div className="px-3 text-center text-[9px] font-black uppercase tracking-[0.18em] text-[var(--aq-text-muted)]">Preview da face traseira</div>
                    )}
                  </div>
                  <div className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-[var(--aq-text-muted)]">{handoutBack?.name || "Sem arquivo"}</div>
                  <input type="file" className="mt-3 block w-full text-[11px]" accept="image/*" onChange={(event) => setHandoutBack(event.target.files?.[0] ?? null)} />
                </div>
              </label>
            </div>
            <button onClick={createHandout} disabled={savingHandout || !salaId} className="aq-button-primary w-full justify-center disabled:opacity-40">
              <Plus size={14} />
              {savingHandout ? "Salvando item" : "Criar item estilo RE"}
            </button>
          </div>
        </div>

        <details className="aq-vtt-section mt-3">
          <summary className="flex cursor-pointer items-center justify-between gap-2 text-[var(--aq-title)]">
            <span className="flex items-center gap-2">
              <Grid2x2 size={14} className="text-[var(--aq-accent)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.18em]">Grid</span>
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--aq-text-muted)]">{mergedPreferences.gridSize}px</span>
          </summary>
          <div className="mt-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div />
            <button
              onClick={() => {
                const next = !mergedPreferences.showGrid;
                setGrid({ showGrid: next });
                onPreferencesChange({ showGrid: next });
              }}
              className={`rounded-[0.7rem] border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                mergedPreferences.showGrid
                  ? "border-[var(--aq-border-strong)] bg-[rgba(157,226,234,0.12)] text-[var(--aq-accent)]"
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
                  ? "border-[var(--aq-border-strong)] bg-[rgba(157,226,234,0.12)] text-[var(--aq-accent)]"
                  : "border-[var(--aq-border)] bg-[rgba(234,244,246,0.055)] text-[var(--aq-text-muted)]"
              }`}
            >
              {mergedPreferences.snapToGrid ? "Snap ativo" : "Snap livre"}
            </button>
          </div>
          </div>
        </details>

        <details className="aq-vtt-section mt-3">
          <summary className="flex cursor-pointer items-center justify-between gap-2 text-[var(--aq-title)]">
            <span className="flex items-center gap-2">
              <Crosshair size={14} className="text-[var(--aq-accent)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.18em]">Mapa</span>
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--aq-text-muted)]">{mergedPreferences.mapScale.toFixed(2)}x</span>
          </summary>
          <div className="mt-3">
          <div className="mb-3 flex items-center gap-2 text-[var(--aq-title)]">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--aq-text-muted)]">Alinhamento fino</span>
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
        </details>
      </div>
    </>
  );
}

