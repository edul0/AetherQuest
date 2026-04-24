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
  { id: "pan", label: "Pan Câmera", icon: Hand },
  { id: "measure", label: "Medição", icon: Ruler },
  { id: "map", label: "Ajustar Mapa", icon: Move },
];

// O Corte Angular tipo Sheikah Slate
const SHEIKAH_PANEL_STYLE = {
  clipPath: "polygon(14px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 14px 100%, 0 calc(100% - 14px), 0 14px)",
} as const;

function previewUrl(file: File | null) {
  return file ? URL.createObjectURL(file) : null;
}

function hasMissingTable(error: unknown, tableName: string) {
  const message = String((error as { message?: string } | null)?.message ?? "").toLowerCase();
  return message.includes(`public.${tableName}`.toLowerCase()) || message.includes(`relation \"public.${tableName}\"`.toLowerCase());
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
      alert(`Falha na gravação da relíquia: ${error.message}`);
      return;
    }

    const { data } = supabase.storage.from("mapas").getPublicUrl(path);
    const { error: updateError } = await supabase.from("cenas").update({ mapa_url: data.publicUrl }).eq("id", cenaId);
    if (updateError) {
      alert(`Artefato subiu, mas a mesa não reconheceu: ${updateError.message}`);
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
      alert(`Falha ao remover pintura: ${error.message}`);
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
      cor: "#4ad9d9", // Spawna com cyan ancestral por padrão
    };

    if (salaId) {
      payload.sala = salaId;
    }

    const { error } = await supabase.from("tokens").insert([payload]);
    if (error) {
      alert(`Falha ao invocar entidade: ${error.message}`);
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
        alert("A tabela map_items ainda nao existe no Supabase. Rode o SQL de reparo VTT Director Tools.");
        return;
      }
      alert(`Falha ao forjar objeto: ${error.message}`);
      return;
    }

    setPanelOpen(false);
  };

  const createHandout = async () => {
    if (!salaId || !handoutTitle.trim()) {
      alert("Defina um título para gravar a runa.");
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
          alert("A tabela handouts ainda nao existe no Supabase. Rode o SQL de reparo VTT Director Tools.");
          return;
        }
        alert(`Falha ao forjar item de inspeção: ${error.message}`);
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
          alert(`Item criado, mas não conseguiu manifestar no mundo: ${mapItemError.message}`);
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
      {/* Botão Flutuante (FAB) do Mestre */}
      <button
        onClick={() => setPanelOpen(true)}
        className="fixed bottom-[104px] right-3 z-50 flex items-center gap-2 border border-[var(--aq-border-strong)] bg-[var(--aq-surface)] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-[var(--aq-title)] shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-md md:bottom-5 md:right-4 transition-all hover:border-[var(--aq-accent)] hover:text-[var(--aq-accent)] hover:shadow-[0_0_15px_var(--aq-accent-soft)]"
        style={SHEIKAH_PANEL_STYLE}
      >
        <SlidersHorizontal size={15} />
        Diretrizes da Mesa
      </button>

      {/* Overlay Escuro */}
      {panelOpen ? (
        <button className="fixed inset-0 z-40 bg-[rgba(1,4,8,0.7)] backdrop-blur-sm" onClick={() => setPanelOpen(false)} aria-label="Fechar diretrizes" />
      ) : null}

      {/* Painel Principal (A Tabuleta) */}
      <div className={`${panelOpen ? "block" : "hidden"} aq-scrollbar fixed inset-x-2 bottom-3 z-50 max-h-[78svh] overflow-y-auto border border-[var(--aq-border)] bg-[var(--aq-bg)] p-5 shadow-[0_0_40px_rgba(0,0,0,0.8)] md:inset-x-auto md:bottom-20 md:right-4 md:max-h-[75vh] md:w-[380px]`} style={SHEIKAH_PANEL_STYLE}>
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between gap-3 border-b border-[var(--aq-border)] pb-4 mb-5">
          <div>
            <div className="aq-kicker text-[var(--aq-accent)] !mb-1">Comandos do Mestre</div>
            <div className="text-lg font-black tracking-wider text-[var(--aq-title)]" style={{ fontFamily: "Cinzel, serif" }}>Ferramentas</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => alert(`D20 ROLADO: ${Math.floor(Math.random() * 20) + 1}`)}
              className="aq-button-secondary aq-button-compact"
              title="Rolar D20"
            >
              <Dice5 size={18} />
            </button>
            <button onClick={() => setPanelOpen(false)} className="aq-button-secondary aq-button-compact text-[var(--aq-text-muted)] hover:text-[var(--aq-danger)] hover:border-[var(--aq-danger)] hover:bg-[var(--aq-danger)]/10">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Ferramentas Primárias (Modos de Cursor) */}
        <div className="grid grid-cols-2 gap-2 mb-6">
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
                className={`aq-panel p-3 text-[10px] font-black uppercase tracking-[0.12em] transition-all flex flex-col items-center gap-2 ${
                  active
                    ? "border-[var(--aq-accent)] bg-[var(--aq-accent-soft)] text-[var(--aq-accent)] shadow-[0_0_15px_var(--aq-accent-soft)]"
                    : "border-[var(--aq-border)] bg-transparent text-[var(--aq-text-muted)] hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-title)]"
                }`}
              >
                <Icon size={18} />
                {tool.label}
              </button>
            );
          })}
        </div>

        {/* Criação & Upload */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button onClick={addToken} className="aq-button-secondary py-3 flex-col gap-2">
            <Users size={16} />
            Invocar Token
          </button>
          <button onClick={addMapItem} disabled={!salaId} className="aq-button-secondary py-3 flex-col gap-2 disabled:opacity-40">
            <Layers3 size={16} />
            Forjar Item 3D
          </button>
          <label className="aq-button-secondary py-3 flex-col gap-2 cursor-pointer col-span-2 border-[var(--aq-border-strong)] hover:bg-[var(--aq-accent-soft)]">
            <MapIcon size={16} className="text-[var(--aq-accent)]" />
            Eternizar Mapa (Upload)
            <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
          </label>
        </div>

        {/* Configurações de Grid */}
        <div className="aq-panel p-4 mb-6" style={SHEIKAH_PANEL_STYLE}>
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-[var(--aq-border)] pb-3">
            <div className="flex items-center gap-2 text-[var(--aq-title)]">
              <Grid2x2 size={16} className="text-[var(--aq-accent)]" />
              <span className="text-xs font-black uppercase tracking-widest">Matriz de Grade</span>
            </div>
            <button
              onClick={() => {
                const next = !mergedPreferences.showGrid;
                setGrid({ showGrid: next });
                onPreferencesChange({ showGrid: next });
              }}
              className={`aq-pill ${mergedPreferences.showGrid ? "" : "aq-pill-muted"}`}
            >
              {mergedPreferences.showGrid ? "Visível" : "Oculto"}
            </button>
          </div>

          <div className="grid gap-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--aq-text-muted)]">
              Tamanho da Célula
              <div className="mt-2 flex items-center gap-3">
                <input type="range" min={20} max={120} step={5} value={mergedPreferences.gridSize} onChange={(event) => { const next = Number(event.target.value); setGrid({ gridSize: next }); onPreferencesChange({ gridSize: next }); }} className="w-full accent-[var(--aq-accent)]" />
                <span className="w-12 text-right text-[var(--aq-title)]">{mergedPreferences.gridSize}px</span>
              </div>
            </label>

            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--aq-text-muted)]">
              Brilho da Matriz
              <div className="mt-2 flex items-center gap-3">
                <input type="range" min={0} max={0.5} step={0.02} value={mergedPreferences.gridOpacity} onChange={(event) => { const next = Number(event.target.value); setGrid({ gridOpacity: next }); onPreferencesChange({ gridOpacity: next }); }} className="w-full accent-[var(--aq-accent)]" />
                <span className="w-12 text-right text-[var(--aq-title)]">{Math.round(mergedPreferences.gridOpacity * 100)}%</span>
              </div>
            </label>

            <button
              onClick={() => {
                const next = !mergedPreferences.snapToGrid;
                setGrid({ snapToGrid: next });
                onPreferencesChange({ snapToGrid: next });
              }}
              className={`aq-button-secondary w-full justify-center ${mergedPreferences.snapToGrid ? "border-[var(--aq-accent)] bg-[var(--aq-accent-soft)] text-[var(--aq-accent)]" : ""}`}
            >
              {mergedPreferences.snapToGrid ? "Atração Magnética (Snap)" : "Movimento Livre"}
            </button>
          </div>
        </div>

        {/* Handouts (Itens Narrativos) */}
        <div className="aq-panel p-4 mb-6" style={SHEIKAH_PANEL_STYLE}>
          <div className="mb-4 flex items-center gap-2 border-b border-[var(--aq-border)] pb-3 text-[var(--aq-title)]">
            <Text size={16} className="text-[var(--aq-accent)]" />
            <span className="text-xs font-black uppercase tracking-widest">Forjar Relíquia Narrativa</span>
          </div>

          <div className="grid gap-3">
            <input
              value={handoutTitle}
              onChange={(event) => setHandoutTitle(event.target.value)}
              placeholder="Nome da Relíquia..."
              className="aq-input"
            />
            <textarea
              value={handoutText}
              onChange={(event) => setHandoutText(event.target.value)}
              placeholder="Inscrições, lore, enigma ou texto oculto..."
              className="aq-input min-h-[100px] resize-none"
            />
            
            <div className="grid grid-cols-2 gap-2 mt-2">
              <label className="border border-[var(--aq-border)] bg-[var(--aq-surface)] rounded-[0.4rem] overflow-hidden group cursor-pointer transition-colors hover:border-[var(--aq-accent)]">
                <div className="border-b border-[var(--aq-border)] px-3 py-2 text-[9px] font-black uppercase tracking-widest text-[var(--aq-text)] flex justify-between">
                  Frente
                  {handoutFront && <span className="text-[var(--aq-accent)]">Ok</span>}
                </div>
                <div className="p-2 h-20 flex items-center justify-center bg-[var(--aq-bg-deep)]">
                  {handoutFrontPreview ? (
                    <img src={handoutFrontPreview} alt="Frente" className="h-full object-contain opacity-80 group-hover:opacity-100" />
                  ) : (
                    <span className="text-[8px] text-[var(--aq-text-subtle)] text-center">Selecionar<br/>Imagem</span>
                  )}
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={(event) => setHandoutFront(event.target.files?.[0] ?? null)} />
              </label>

              <label className="border border-[var(--aq-border)] bg-[var(--aq-surface)] rounded-[0.4rem] overflow-hidden group cursor-pointer transition-colors hover:border-[var(--aq-accent)]">
                <div className="border-b border-[var(--aq-border)] px-3 py-2 text-[9px] font-black uppercase tracking-widest text-[var(--aq-text)] flex justify-between">
                  Verso
                  {handoutBack && <span className="text-[var(--aq-accent)]">Ok</span>}
                </div>
                <div className="p-2 h-20 flex items-center justify-center bg-[var(--aq-bg-deep)]">
                  {handoutBackPreview ? (
                    <img src={handoutBackPreview} alt="Verso" className="h-full object-contain opacity-80 group-hover:opacity-100" />
                  ) : (
                    <span className="text-[8px] text-[var(--aq-text-subtle)] text-center">Selecionar<br/>(Opcional)</span>
                  )}
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={(event) => setHandoutBack(event.target.files?.[0] ?? null)} />
              </label>
            </div>

            <button onClick={createHandout} disabled={savingHandout || !salaId} className="aq-button-primary w-full mt-2 disabled:opacity-40">
              <Plus size={14} />
              {savingHandout ? "Eternizando..." : "Concluir Relíquia"}
            </button>
          </div>
        </div>

        {/* Alinhamento Espacial */}
        <div className="aq-panel p-4 mb-4" style={SHEIKAH_PANEL_STYLE}>
          <div className="mb-4 flex items-center gap-2 border-b border-[var(--aq-border)] pb-3 text-[var(--aq-title)]">
            <Crosshair size={16} className="text-[var(--aq-accent)]" />
            <span className="text-xs font-black uppercase tracking-widest">Alinhamento Espacial</span>
          </div>

          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--aq-text-muted)] block mb-3">
            Escala Bruta do Mapa
            <div className="mt-2 flex items-center gap-3">
              <input type="range" min={0.2} max={3} step={0.05} value={mergedPreferences.mapScale} onChange={(event) => onPreferencesChange({ mapScale: Number(event.target.value) })} className="w-full accent-[var(--aq-accent)]" />
              <span className="w-12 text-right text-[var(--aq-title)]">{mergedPreferences.mapScale.toFixed(2)}x</span>
            </div>
          </label>

          <div className="grid grid-cols-3 gap-2 w-max mx-auto mb-4">
            <div />
            <button onClick={() => nudgeMap(0, -10)} className="aq-button-secondary p-2"><ChevronUp size={16} /></button>
            <div />
            <button onClick={() => nudgeMap(-10, 0)} className="aq-button-secondary p-2"><ChevronLeft size={16} /></button>
            <button onClick={() => onPreferencesChange({ mapOffsetX: 0, mapOffsetY: 0, mapScale: 1 })} className="aq-button-secondary p-2 !border-[var(--aq-border-strong)] !text-[var(--aq-accent)]" title="Restaurar alinhamento"><RefreshCcw size={16} /></button>
            <button onClick={() => nudgeMap(10, 0)} className="aq-button-secondary p-2"><ChevronRight size={16} /></button>
            <div />
            <button onClick={() => nudgeMap(0, 10)} className="aq-button-secondary p-2"><ChevronDown size={16} /></button>
            <div />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[9px] font-black uppercase tracking-widest text-[var(--aq-text-muted)] text-center">
            <div className="rounded-[0.3rem] border border-[var(--aq-border)] bg-[var(--aq-bg-deep)] py-1.5">Off-X: {mergedPreferences.mapOffsetX}</div>
            <div className="rounded-[0.3rem] border border-[var(--aq-border)] bg-[var(--aq-bg-deep)] py-1.5">Off-Y: {mergedPreferences.mapOffsetY}</div>
          </div>
        </div>

        {/* Zona de Perigo */}
        <button onClick={removeMap} className="w-full mt-2 flex items-center justify-center gap-2 border border-[var(--aq-danger)]/30 bg-[var(--aq-danger)]/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-300 transition-all hover:bg-[var(--aq-danger)]/20 shadow-[0_0_15px_rgba(239,68,68,0.05)]" style={SHEIKAH_PANEL_STYLE}>
          <ImageMinus size={15} />
          Desintegrar Mapa do Setor
        </button>

      </div>
    </>
  );
}
