"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { FichaVTTSnapshot, SceneViewPreferences, Token } from "@/src/lib/types";
import { useTokenFichaSync } from "@/src/lib/hooks/useTokenFichaSync";

type Point = { x: number; y: number };
type Camera = { x: number; y: number; zoom: number };
type DragState =
  | { type: "token"; tokenId: string; startPointer: Point; startToken: Point; moved: boolean }
  | { type: "camera"; startPointer: Point; startCamera: Camera }
  | { type: "map"; startPointer: Point; startOffset: Point }
  | { type: "pinch"; distance: number; center: Point; camera: Camera }
  | null;

interface VTTCanvasProps {
  cenaId: string;
  mapaUrl?: string;
  selectedTokenId: string | null;
  onSelectToken: (token: Token | null) => void;
  onFichasMapChange?: (map: Record<string, FichaVTTSnapshot>) => void;
  onTokensChange?: (tokens: Token[]) => void;
  scenePreferences: SceneViewPreferences;
}

const DEFAULT_CAMERA: Camera = { x: 0, y: 0, zoom: 1 };

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function tokenSize(width: number) {
  return width < 768 ? 76 : 68;
}

function getTokenImage(ficha?: FichaVTTSnapshot | null) {
  return ficha?.dados?.token_images?.portrait || ficha?.dados?.token_images?.top || ficha?.avatar_url || ficha?.dados?.avatar_url || "";
}

function initials(token: Token, ficha?: FichaVTTSnapshot | null) {
  return (ficha?.nome_personagem || token.nome || "??").slice(0, 2).toUpperCase();
}

function snapPoint(point: Point, prefs: SceneViewPreferences) {
  if (!prefs.snapToGrid) return point;
  const grid = prefs.gridSize || 50;
  return { x: Math.round(point.x / grid) * grid, y: Math.round(point.y / grid) * grid };
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function center(a: Point, b: Point) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export default function OnlineVTTCanvas({
  cenaId,
  mapaUrl,
  selectedTokenId,
  onSelectToken,
  onFichasMapChange,
  onTokensChange,
  scenePreferences,
}: VTTCanvasProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, Point>());
  const dragRef = useRef<DragState>(null);
  const latestTokensRef = useRef<Token[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [camera, setCamera] = useState<Camera>(DEFAULT_CAMERA);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [mapSize, setMapSize] = useState<{ width: number; height: number } | null>(null);
  const [canvasError, setCanvasError] = useState("");

  const fichaIds = useMemo(() => tokens.map((token) => token.ficha_id).filter((id): id is string => Boolean(id)), [tokens]);
  const fichasMap = useTokenFichaSync(fichaIds);
  const currentTokenSize = tokenSize(size.width);

  const worldToScreen = useCallback((point: Point) => ({ x: (point.x - camera.x) * camera.zoom, y: (point.y - camera.y) * camera.zoom }), [camera.x, camera.y, camera.zoom]);
  const screenToWorld = useCallback((point: Point, cam = camera) => ({ x: cam.x + point.x / cam.zoom, y: cam.y + point.y / cam.zoom }), [camera]);

  const mapFrame = useMemo(() => {
    if (!mapaUrl || !mapSize) return null;
    const baseScale = Math.max(size.width / mapSize.width, size.height / mapSize.height);
    const scale = baseScale * scenePreferences.mapScale;
    const width = mapSize.width * scale;
    const height = mapSize.height * scale;
    const worldX = (size.width - width) / 2 + scenePreferences.mapOffsetX;
    const worldY = (size.height - height) / 2 + scenePreferences.mapOffsetY;
    return {
      x: (worldX - camera.x) * camera.zoom,
      y: (worldY - camera.y) * camera.zoom,
      width: width * camera.zoom,
      height: height * camera.zoom,
    };
  }, [camera.x, camera.y, camera.zoom, mapaUrl, mapSize, scenePreferences.mapOffsetX, scenePreferences.mapOffsetY, scenePreferences.mapScale, size.height, size.width]);

  useEffect(() => {
    latestTokensRef.current = tokens;
    onTokensChange?.(tokens);
  }, [onTokensChange, tokens]);

  useEffect(() => {
    onFichasMapChange?.(fichasMap);
  }, [fichasMap, onFichasMapChange]);

  useEffect(() => {
    const resize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    if (!mapaUrl) {
      setMapSize(null);
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setMapSize({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
    };
    img.onerror = () => {
      if (!cancelled) setMapSize(null);
    };
    img.src = mapaUrl;
    return () => {
      cancelled = true;
    };
  }, [mapaUrl]);

  useEffect(() => {
    let active = true;
    const loadTokens = async () => {
      const { data, error } = await supabase.from("tokens").select("*").eq("cena_id", cenaId);
      if (!active) return;
      if (error) {
        console.error("[OnlineVTTCanvas] erro ao carregar tokens:", error);
        setCanvasError("Nao foi possivel carregar tokens desta cena.");
        return;
      }
      setCanvasError("");
      setTokens((data ?? []) as Token[]);
    };

    void loadTokens();
    const channel = supabase
      .channel(`online_vtt_tokens_${cenaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tokens", filter: `cena_id=eq.${cenaId}` }, (payload) => {
        if (payload.eventType === "INSERT") setTokens((current) => [...current.filter((token) => token.id !== payload.new.id), payload.new as Token]);
        if (payload.eventType === "UPDATE") setTokens((current) => current.map((token) => (token.id === payload.new.id ? (payload.new as Token) : token)));
        if (payload.eventType === "DELETE") {
          setTokens((current) => current.filter((token) => token.id !== payload.old.id));
          if (selectedTokenId === payload.old.id) onSelectToken(null);
        }
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [cenaId, onSelectToken, selectedTokenId]);

  const persistToken = useCallback(async (tokenId: string, point: Point) => {
    const { error } = await supabase.from("tokens").update({ x: point.x, y: point.y }).eq("id", tokenId);
    if (error) console.error("[OnlineVTTCanvas] erro ao mover token:", error);
  }, []);

  const zoomAt = useCallback((screenPoint: Point, targetZoom: number, baseCamera = camera, baseScreenPoint = screenPoint) => {
    const nextZoom = clamp(targetZoom, 0.35, 3.4);
    const world = screenToWorld(baseScreenPoint, baseCamera);
    setCamera({ x: world.x - screenPoint.x / nextZoom, y: world.y - screenPoint.y / nextZoom, zoom: nextZoom });
  }, [camera, screenToWorld]);

  const updatePinchIfNeeded = (nextPointers: Map<number, Point>) => {
    if (nextPointers.size < 2) return false;
    const [a, b] = [...nextPointers.values()];
    const nextCenter = center(a, b);
    const nextDistance = distance(a, b);
    if (dragRef.current?.type !== "pinch") {
      dragRef.current = { type: "pinch", center: nextCenter, distance: nextDistance, camera };
      return true;
    }
    const factor = nextDistance / Math.max(1, dragRef.current.distance);
    zoomAt(nextCenter, dragRef.current.camera.zoom * factor, dragRef.current.camera, dragRef.current.center);
    return true;
  };

  const handleStagePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, point);
    if (updatePinchIfNeeded(pointersRef.current)) return;

    if (scenePreferences.toolMode === "map") {
      dragRef.current = { type: "map", startPointer: point, startOffset: { x: scenePreferences.mapOffsetX, y: scenePreferences.mapOffsetY } };
      onSelectToken(null);
      return;
    }

    if (scenePreferences.toolMode === "pan") {
      dragRef.current = { type: "camera", startPointer: point, startCamera: camera };
      onSelectToken(null);
      return;
    }
  };

  const handleTokenPointerDown = (event: React.PointerEvent<HTMLButtonElement>, token: Token) => {
    if (scenePreferences.toolMode !== "select") return;
    event.stopPropagation();
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, point);
    dragRef.current = { type: "token", tokenId: token.id, startPointer: point, startToken: { x: token.x, y: token.y }, moved: false };
    onSelectToken(token);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    pointersRef.current.set(event.pointerId, point);
    if (updatePinchIfNeeded(pointersRef.current)) return;

    const drag = dragRef.current;
    if (!drag) return;

    if (drag.type === "token") {
      const dx = (point.x - drag.startPointer.x) / camera.zoom;
      const dy = (point.y - drag.startPointer.y) / camera.zoom;
      const next = snapPoint({ x: drag.startToken.x + dx, y: drag.startToken.y + dy }, scenePreferences);
      dragRef.current = { ...drag, moved: true };
      setTokens((current) => current.map((token) => (token.id === drag.tokenId ? { ...token, ...next } : token)));
      return;
    }

    if (drag.type === "camera") {
      setCamera({ ...drag.startCamera, x: drag.startCamera.x - (point.x - drag.startPointer.x) / drag.startCamera.zoom, y: drag.startCamera.y - (point.y - drag.startPointer.y) / drag.startCamera.zoom });
      return;
    }

    if (drag.type === "map") {
      window.dispatchEvent(new CustomEvent("aq-map-offset", { detail: { x: Math.round(drag.startOffset.x + (point.x - drag.startPointer.x) / camera.zoom), y: Math.round(drag.startOffset.y + (point.y - drag.startPointer.y) / camera.zoom) } }));
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    const drag = dragRef.current;
    if (drag?.type === "token") {
      const token = latestTokensRef.current.find((entry) => entry.id === drag.tokenId);
      if (token && drag.moved) void persistToken(drag.tokenId, { x: token.x, y: token.y });
      if (token && !drag.moved) onSelectToken(selectedTokenId === token.id ? null : token);
    }
    if (pointersRef.current.size === 0) dragRef.current = null;
  };

  const gridStyle = scenePreferences.showGrid
    ? {
        backgroundImage: `linear-gradient(to right, rgba(74,217,217,${scenePreferences.gridOpacity}) 1px, transparent 1px), linear-gradient(to bottom, rgba(74,217,217,${scenePreferences.gridOpacity}) 1px, transparent 1px)`,
        backgroundSize: `${scenePreferences.gridSize * camera.zoom}px ${scenePreferences.gridSize * camera.zoom}px`,
        backgroundPosition: `${-camera.x * camera.zoom}px ${-camera.y * camera.zoom}px`,
      }
    : undefined;

  return (
    <div
      ref={stageRef}
      className="fixed inset-0 overflow-hidden touch-none select-none bg-[#050a10]"
      onPointerDown={handleStagePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={(event) => {
        event.preventDefault();
        zoomAt({ x: event.clientX, y: event.clientY }, camera.zoom * (event.deltaY > 0 ? 0.9 : 1.1));
      }}
    >
      {mapaUrl && mapFrame ? (
        <img
          src={mapaUrl}
          alt="Mapa da cena"
          draggable={false}
          className="pointer-events-none absolute left-0 top-0 max-w-none object-fill opacity-95"
          style={{ width: mapFrame.width, height: mapFrame.height, transform: `translate3d(${mapFrame.x}px, ${mapFrame.y}px, 0)` }}
        />
      ) : null}

      <div className="pointer-events-none absolute inset-0" style={gridStyle} />

      {tokens.map((token) => {
        const ficha = token.ficha_id ? fichasMap[token.ficha_id] : null;
        const image = getTokenImage(ficha);
        const screen = worldToScreen({ x: token.x, y: token.y });
        const selected = selectedTokenId === token.id;
        const vida = ficha?.dados?.status?.vida;
        const hp = vida?.max ? clamp(vida.atual / vida.max, 0, 1) : 0;
        return (
          <button
            key={token.id}
            type="button"
            onPointerDown={(event) => handleTokenPointerDown(event, token)}
            className={`absolute z-30 flex flex-col items-center justify-start rounded-2xl border bg-[#050a10]/55 p-1 text-white shadow-[0_10px_28px_rgba(0,0,0,0.5)] backdrop-blur-sm ${selected ? "border-[#4ad9d9] ring-4 ring-[#4ad9d9]/20" : "border-[#4ad9d9]/35"}`}
            style={{ width: currentTokenSize, minHeight: currentTokenSize + 24, transform: `translate3d(${screen.x}px, ${screen.y}px, 0)` }}
          >
            <span className="flex items-center justify-center overflow-hidden rounded-full border-2 border-[#050a10]" style={{ width: currentTokenSize - 14, height: currentTokenSize - 14, background: token.cor || "#4ad9d9" }}>
              {image ? <img src={image} alt={token.nome} className="h-full w-full object-cover" draggable={false} /> : <span className="text-lg font-black">{initials(token, ficha)}</span>}
            </span>
            <span className="mt-1 max-w-full truncate px-1 font-mono text-[10px] font-black uppercase tracking-[0.08em] text-[#f0ebd8]">{ficha?.nome_personagem || token.nome}</span>
            {vida?.max ? <span className="mt-1 h-1 w-full rounded bg-white/10"><span className="block h-1 rounded bg-gradient-to-r from-emerald-400 to-red-500" style={{ width: `${hp * 100}%` }} /></span> : null}
          </button>
        );
      })}

      <div className="fixed left-1/2 top-[86px] z-40 flex w-[calc(100vw-1rem)] max-w-[540px] -translate-x-1/2 items-center justify-between gap-2 rounded-[26px] border border-[#4ad9d9]/20 bg-[#050a10]/88 px-3 py-2 shadow-2xl backdrop-blur-xl md:top-4">
        <div className="flex gap-2">
          <button className="rounded-full border border-white/10 bg-white/5 p-3 text-white" onClick={() => zoomAt({ x: size.width / 2, y: size.height / 2 }, camera.zoom * 1.12)}><Plus size={18} /></button>
          <button className="rounded-full border border-white/10 bg-white/5 p-3 text-white" onClick={() => zoomAt({ x: size.width / 2, y: size.height / 2 }, camera.zoom * 0.88)}><Minus size={18} /></button>
          <button className="rounded-full border border-white/10 bg-white/5 p-3 text-white" onClick={() => setCamera(DEFAULT_CAMERA)}><RotateCcw size={18} /></button>
        </div>
        <div className="text-right">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-white">Zoom {Math.round(camera.zoom * 100)}%</div>
          <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-slate-400">{scenePreferences.toolMode === "map" ? "Movendo fundo" : scenePreferences.toolMode === "pan" ? "Movendo camera" : "Arraste tokens"}</div>
        </div>
      </div>

      {canvasError ? <div className="fixed left-1/2 top-1/2 z-50 max-w-[84vw] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-red-500/30 bg-red-950/80 px-5 py-4 text-center text-sm text-red-100">{canvasError}</div> : null}
    </div>
  );
}
