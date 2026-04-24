"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { supabase, withFreshSession } from "@/src/lib/supabase";
import { FichaVTTSnapshot, SceneViewPreferences, Token } from "@/src/lib/types";
import { useTokenFichaSync } from "@/src/lib/hooks/useTokenFichaSync";
import { DEFAULT_VTT_CAMERA, selectVTTCamera, selectVTTGrid, selectVTTTokens, selectVTTToolMode, useVTTStore } from "@/src/store/useVTTStore";

type Point = { x: number; y: number };
type Camera = { x: number; y: number; zoom: number };
type PixiModule = typeof import("pixi.js");
type TokenVisualMode = "portrait" | "top" | "standee";
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

const DEFAULT_CAMERA: Camera = DEFAULT_VTT_CAMERA;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const center = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

function resolveTokenSize(token: Token, viewportWidth: number) {
  const base = viewportWidth < 768 ? 96 : 82;
  const multiplier = Number(token.size ?? 1);
  return clamp(base * (Number.isFinite(multiplier) ? multiplier : 1), 64, viewportWidth < 768 ? 164 : 150);
}

function tokenConditions(token: Token) {
  return Array.isArray(token.conditions) ? token.conditions : [];
}

function tokenVisualMode(token: Token, ficha?: FichaVTTSnapshot | null): TokenVisualMode {
  const mode = tokenConditions(token).find((condition) => condition.startsWith("visual:"))?.replace("visual:", "");
  if (mode === "top" || mode === "standee" || mode === "portrait") return mode;
  if (ficha?.dados?.token_images?.side) return "standee";
  if (ficha?.dados?.token_images?.top) return "top";
  return "portrait";
}

function shouldCutoutWhite(token: Token, ficha?: FichaVTTSnapshot | null) {
  return tokenConditions(token).includes("cutout:white") || tokenVisualMode(token, ficha) === "standee";
}

function tokenVisual(token: Token, ficha?: FichaVTTSnapshot | null) {
  const images = ficha?.dados?.token_images;
  const activeFichaImage = ficha?.dados?.avatar_url || ficha?.avatar_url || "";
  const staleTokenImage = token.avatar_url || "";
  const mode = tokenVisualMode(token, ficha);
  if (mode === "standee") return images?.side || activeFichaImage || images?.portrait || images?.top || staleTokenImage || "";
  if (mode === "top") return images?.top || activeFichaImage || images?.portrait || staleTokenImage || "";
  return activeFichaImage || images?.portrait || images?.top || images?.side || staleTokenImage || "";
}

function tokenName(token: Token, ficha?: FichaVTTSnapshot | null) {
  return ficha?.nome_personagem || token.nome || "Entidade";
}

function initials(token: Token, ficha?: FichaVTTSnapshot | null) {
  return tokenName(token, ficha).slice(0, 2).toUpperCase();
}

function snapPoint(point: Point, gridSize: number, snapToGrid: boolean) {
  if (!snapToGrid) return point;
  const nextGrid = gridSize || 50;
  return { x: Math.round(point.x / nextGrid) * nextGrid, y: Math.round(point.y / nextGrid) * nextGrid };
}

export default function PixiVTTCanvas({
  cenaId,
  mapaUrl,
  selectedTokenId,
  onSelectToken,
  onFichasMapChange,
  onTokensChange,
  scenePreferences,
}: VTTCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const pixiRef = useRef<PixiModule | null>(null);
  const appRef = useRef<any>(null);
  const worldRef = useRef<any>(null);
  const gridRef = useRef<any>(null);
  const tokenLayerRef = useRef<any>(null);
  const textureCacheRef = useRef(new Map<string, any>());
  const pointersRef = useRef(new Map<number, Point>());
  const dragRef = useRef<DragState>(null);
  const latestTokensRef = useRef<Token[]>([]);

  const tokens = useVTTStore(selectVTTTokens);
  const camera = useVTTStore(selectVTTCamera);
  const runtimeGrid = useVTTStore(selectVTTGrid);
  const toolMode = useVTTStore(selectVTTToolMode);
  const setStoreTokens = useVTTStore((state) => state.setTokens);
  const addStoreToken = useVTTStore((state) => state.addToken);
  const patchStoreToken = useVTTStore((state) => state.patchToken);
  const moveStoreToken = useVTTStore((state) => state.moveToken);
  const removeStoreToken = useVTTStore((state) => state.removeToken);
  const setCamera = useVTTStore((state) => state.setCamera);
  const hydrateSceneRuntime = useVTTStore((state) => state.hydrateSceneRuntime);
  const resetRuntime = useVTTStore((state) => state.resetRuntime);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [mapSize, setMapSize] = useState<{ width: number; height: number } | null>(null);
  const [canvasError, setCanvasError] = useState("");
  const [cutoutImages, setCutoutImages] = useState<Record<string, string>>({});
  const [imageSizes, setImageSizes] = useState<Record<string, { width: number; height: number }>>({});

  const fichaIds = useMemo(() => tokens.map((token) => token.ficha_id).filter((id): id is string => Boolean(id)), [tokens]);
  const fichasMap = useTokenFichaSync(fichaIds);
  const screenToWorld = useCallback((point: Point, cam = camera) => ({ x: cam.x + point.x / cam.zoom, y: cam.y + point.y / cam.zoom }), [camera]);

  const mapFrame = useMemo(() => {
    if (!mapaUrl || !mapSize) return null;
    const fitScale = Math.max(size.width / mapSize.width, size.height / mapSize.height);
    const scale = fitScale * scenePreferences.mapScale;
    const width = mapSize.width * scale;
    const height = mapSize.height * scale;
    return {
      x: (size.width - width) / 2 + scenePreferences.mapOffsetX,
      y: (size.height - height) / 2 + scenePreferences.mapOffsetY,
      width,
      height,
    };
  }, [mapSize, mapaUrl, scenePreferences.mapOffsetX, scenePreferences.mapOffsetY, scenePreferences.mapScale, size.height, size.width]);

  const domMapStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (!mapFrame) return undefined;
    return {
      position: "absolute",
      left: 0,
      top: 0,
      width: mapFrame.width * camera.zoom,
      height: mapFrame.height * camera.zoom,
      transform: `translate3d(${(mapFrame.x - camera.x) * camera.zoom}px, ${(mapFrame.y - camera.y) * camera.zoom}px, 0)`,
      transformOrigin: "0 0",
      zIndex: 1,
    };
  }, [camera.x, camera.y, camera.zoom, mapFrame]);

  const tokenImageOverlays = useMemo(() => {
    return tokens
      .map((token) => {
        const ficha = token.ficha_id ? fichasMap[token.ficha_id] : null;
        const url = tokenVisual(token, ficha);
        if (!url) return null;
        const tokenPx = resolveTokenSize(token, size.width);
        const natural = imageSizes[url];
        const aspect = natural?.height ? natural.width / natural.height : 0.72;
        const requestedMode = tokenVisualMode(token, ficha);
        const mode = requestedMode === "portrait" && natural && aspect < 0.82 ? "standee" : requestedMode;
        const cutout = shouldCutoutWhite(token, ficha) || mode === "standee";
        const base = tokenPx * camera.zoom;
        const width =
          mode === "standee"
            ? clamp(base * 1.45 * aspect, base * 0.46, base * 1.25)
            : mode === "top"
              ? base * 0.92
              : base * 0.82;
        const height = mode === "standee" ? base * 1.45 : mode === "top" ? base * 0.92 : base * 0.82;
        const yAnchor = mode === "standee" ? 0.94 : 0.5;
        const processedCutout = cutoutImages[url];
        const useBlendFallback = cutout && (!processedCutout || processedCutout === url);
        return {
          id: token.id,
          url: cutout ? processedCutout ?? url : url,
          rawUrl: url,
          label: tokenName(token, ficha),
          mode,
          cutout,
          style: {
            position: "absolute",
            left: 0,
            top: 0,
            width,
            height,
            transform: `translate3d(${(token.x - camera.x) * camera.zoom - width / 2}px, ${(token.y - camera.y) * camera.zoom - height * yAnchor}px, 0)`,
            zIndex: 4 + (token.z_index ?? 0),
            border: mode === "standee" ? "none" : "1px solid rgba(165, 243, 252, 0.35)",
            borderRadius: mode === "portrait" ? "9999px" : mode === "top" ? "30%" : "0px",
            objectFit: mode === "portrait" ? "cover" : "contain",
            objectPosition: mode === "standee" ? "center bottom" : "center center",
            backgroundColor: "transparent",
            filter: useBlendFallback ? "contrast(1.08) saturate(1.12)" : "none",
            mixBlendMode: useBlendFallback ? "multiply" : "normal",
          } satisfies React.CSSProperties,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));
  }, [camera.x, camera.y, camera.zoom, cutoutImages, fichasMap, imageSizes, size.width, tokens]);

  useEffect(() => {
    hydrateSceneRuntime(scenePreferences);
  }, [hydrateSceneRuntime, scenePreferences]);

  useEffect(() => {
    resetRuntime();
  }, [cenaId, resetRuntime]);

  useEffect(() => {
    const urls = tokens
      .map((token) => {
        const ficha = token.ficha_id ? fichasMap[token.ficha_id] : null;
        return tokenVisual(token, ficha);
      })
      .filter(Boolean);

    Array.from(new Set(urls)).forEach((url) => {
      if (imageSizes[url]) return;
      const img = new Image();
      img.onload = () => {
        setImageSizes((current) => ({
          ...current,
          [url]: { width: img.naturalWidth || img.width || 1, height: img.naturalHeight || img.height || 1 },
        }));
      };
      img.src = url;
    });
  }, [fichasMap, imageSizes, tokens]);

  useEffect(() => {
    const targets = tokens
      .map((token) => {
        const ficha = token.ficha_id ? fichasMap[token.ficha_id] : null;
        const url = tokenVisual(token, ficha);
        return url && !cutoutImages[url] ? url : "";
      })
      .filter(Boolean);

    Array.from(new Set(targets)).forEach((url) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) return;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const sample = (x: number, y: number) => {
            const index = (Math.max(0, Math.min(canvas.height - 1, y)) * canvas.width + Math.max(0, Math.min(canvas.width - 1, x))) * 4;
            return [data[index], data[index + 1], data[index + 2]] as const;
          };
          const corners = [
            sample(0, 0),
            sample(canvas.width - 1, 0),
            sample(0, canvas.height - 1),
            sample(canvas.width - 1, canvas.height - 1),
          ];
          const bg = corners.reduce(
            (acc, color) => [acc[0] + color[0] / corners.length, acc[1] + color[1] / corners.length, acc[2] + color[2] / corners.length],
            [0, 0, 0],
          );
          for (let index = 0; index < data.length; index += 4) {
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            const lowSaturation = max - min < 42;
            const distanceFromBg = Math.hypot(r - bg[0], g - bg[1], b - bg[2]);
            const sameFlatBackground = lowSaturation && distanceFromBg < 46 && luminance > 178;
            if ((lowSaturation && luminance > 224) || sameFlatBackground) data[index + 3] = 0;
            else if (lowSaturation && luminance > 195) data[index + 3] = Math.min(data[index + 3], 52);
          }
          ctx.putImageData(imageData, 0, 0);
          setCutoutImages((current) => ({ ...current, [url]: canvas.toDataURL("image/png") }));
        } catch {
          setCutoutImages((current) => ({ ...current, [url]: url }));
        }
      };
      img.onerror = () => setCutoutImages((current) => ({ ...current, [url]: url }));
      img.src = url;
    });
  }, [cutoutImages, fichasMap, tokens]);

  useEffect(() => {
    latestTokensRef.current = tokens;
    onTokensChange?.(tokens);
  }, [onTokensChange, tokens]);

  useEffect(() => onFichasMapChange?.(fichasMap), [fichasMap, onFichasMapChange]);

  useEffect(() => {
    const resize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    let destroyed = false;
    const boot = async () => {
      if (!hostRef.current || appRef.current) return;
      const PIXI = await import("pixi.js");
      if (destroyed || !hostRef.current) return;
      pixiRef.current = PIXI;
      const app = new PIXI.Application();
      await app.init({
        resizeTo: hostRef.current,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        powerPreference: "high-performance",
      });
      app.stage.eventMode = "static";
      app.stage.hitArea = app.screen;
      Object.assign(app.canvas.style, {
        position: "absolute",
        inset: "0",
        zIndex: "5",
        width: "100%",
        height: "100%",
        touchAction: "none",
      });
      hostRef.current.appendChild(app.canvas);

      const world = new PIXI.Container();
      const grid = new PIXI.Graphics();
      const tokenLayer = new PIXI.Container();
      tokenLayer.sortableChildren = true;
      world.addChild(grid, tokenLayer);
      app.stage.addChild(world);
      appRef.current = app;
      worldRef.current = world;
      gridRef.current = grid;
      tokenLayerRef.current = tokenLayer;
    };
    void boot();
    return () => {
      destroyed = true;
      textureCacheRef.current.clear();
      appRef.current?.destroy(true, { children: true, texture: false });
      appRef.current = null;
      pixiRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapaUrl) {
      setMapSize(null);
      setCanvasError("");
      return;
    }
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      setMapSize({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
      setCanvasError("");
    };
    img.onerror = () => {
      if (cancelled) return;
      setMapSize(null);
      setCanvasError("Mapa encontrado, mas a imagem nao abriu. Reenvie o arquivo no bucket publico de mapas.");
    };
    img.src = mapaUrl;
    return () => {
      cancelled = true;
    };
  }, [mapaUrl]);

  useEffect(() => {
    let active = true;
    const loadTokens = async () => {
      const { data, error } = await withFreshSession<Token[]>(() => supabase.from("tokens").select("*").eq("cena_id", cenaId));
      if (!active) return;
      if (error) {
        console.error("[PixiVTTCanvas] erro ao carregar tokens:", error);
        setCanvasError("Nao foi possivel carregar tokens desta cena.");
        return;
      }
      setCanvasError("");
      setStoreTokens((data ?? []) as Token[]);
    };
    void loadTokens();
    const channel = supabase
      .channel(`pixi_vtt_tokens_${cenaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tokens", filter: `cena_id=eq.${cenaId}` }, (payload) => {
        if (payload.eventType === "INSERT") addStoreToken(payload.new as Token);
        if (payload.eventType === "UPDATE") patchStoreToken(payload.new.id, payload.new as Token);
        if (payload.eventType === "DELETE") removeStoreToken(payload.old.id);
      })
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [addStoreToken, cenaId, patchStoreToken, removeStoreToken, setStoreTokens]);

  const persistToken = useCallback(async (tokenId: string, point: Point) => {
    const { error } = await withFreshSession(() => supabase.from("tokens").update({ x: point.x, y: point.y }).eq("id", tokenId));
    if (error) console.error("[PixiVTTCanvas] erro ao mover token:", error);
  }, []);

  const zoomAt = useCallback(
    (screenPoint: Point, targetZoom: number, baseCamera = camera, baseScreenPoint = screenPoint) => {
      const nextZoom = clamp(targetZoom, 0.35, 3.6);
      const world = screenToWorld(baseScreenPoint, baseCamera);
      setCamera({ x: world.x - screenPoint.x / nextZoom, y: world.y - screenPoint.y / nextZoom, zoom: nextZoom });
    },
    [camera, screenToWorld],
  );

  const pointerFromEvent = (event: PointerEvent): Point => {
    const rect = hostRef.current?.getBoundingClientRect();
    return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) };
  };

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

  const beginTokenDrag = (event: any, token: Token) => {
    if (toolMode !== "select") return;
    const nativeEvent = event?.nativeEvent ?? event;
    nativeEvent.preventDefault?.();
    nativeEvent.stopPropagation?.();
    const point = pointerFromEvent(nativeEvent as PointerEvent);
    pointersRef.current.set(nativeEvent.pointerId ?? 1, point);
    dragRef.current = { type: "token", tokenId: token.id, startPointer: point, startToken: { x: token.x, y: token.y }, moved: false };
    onSelectToken(token);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = pointerFromEvent(event.nativeEvent);
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, point);
    if (updatePinchIfNeeded(pointersRef.current)) return;
    if (toolMode === "map") {
      dragRef.current = { type: "map", startPointer: point, startOffset: { x: scenePreferences.mapOffsetX, y: scenePreferences.mapOffsetY } };
      onSelectToken(null);
      return;
    }
    if (toolMode === "pan") {
      dragRef.current = { type: "camera", startPointer: point, startCamera: camera };
      onSelectToken(null);
    }
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = pointerFromEvent(event.nativeEvent);
    pointersRef.current.set(event.pointerId, point);
    if (updatePinchIfNeeded(pointersRef.current)) return;
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.type === "token") {
      const next = snapPoint(
        {
          x: drag.startToken.x + (point.x - drag.startPointer.x) / camera.zoom,
          y: drag.startToken.y + (point.y - drag.startPointer.y) / camera.zoom,
        },
        runtimeGrid.gridSize,
        runtimeGrid.snapToGrid,
      );
      dragRef.current = { ...drag, moved: true };
      moveStoreToken(drag.tokenId, next.x, next.y);
      return;
    }
    if (drag.type === "camera") {
      setCamera({
        ...drag.startCamera,
        x: drag.startCamera.x - (point.x - drag.startPointer.x) / drag.startCamera.zoom,
        y: drag.startCamera.y - (point.y - drag.startPointer.y) / drag.startCamera.zoom,
      });
      return;
    }
    if (drag.type === "map") {
      window.dispatchEvent(
        new CustomEvent("aq-map-offset", {
          detail: {
            x: Math.round(drag.startOffset.x + (point.x - drag.startPointer.x) / camera.zoom),
            y: Math.round(drag.startOffset.y + (point.y - drag.startPointer.y) / camera.zoom),
          },
        }),
      );
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

  useEffect(() => {
    const PIXI = pixiRef.current;
    const world = worldRef.current;
    const pixiGrid = gridRef.current;
    const tokenLayer = tokenLayerRef.current;
    if (!PIXI || !world || !pixiGrid || !tokenLayer) return;

    world.position.set(-camera.x * camera.zoom, -camera.y * camera.zoom);
    world.scale.set(camera.zoom);

    pixiGrid.clear();
    if (runtimeGrid.showGrid) {
      const gridSize = runtimeGrid.gridSize || 50;
      const startX = Math.floor(camera.x / gridSize) * gridSize - gridSize * 2;
      const startY = Math.floor(camera.y / gridSize) * gridSize - gridSize * 2;
      const endX = camera.x + size.width / camera.zoom + gridSize * 2;
      const endY = camera.y + size.height / camera.zoom + gridSize * 2;
      for (let x = startX; x <= endX; x += gridSize) {
        pixiGrid.moveTo(x, startY);
        pixiGrid.lineTo(x, endY);
      }
      for (let y = startY; y <= endY; y += gridSize) {
        pixiGrid.moveTo(startX, y);
        pixiGrid.lineTo(endX, y);
      }
      pixiGrid.stroke({ width: 1 / camera.zoom, color: 0x4ad9d9, alpha: runtimeGrid.gridOpacity });
    }

    tokenLayer.removeChildren();
    tokens.forEach((token) => {
      const ficha = token.ficha_id ? fichasMap[token.ficha_id] : null;
      const tokenPx = resolveTokenSize(token, size.width);
      const wrapper = new PIXI.Container();
      wrapper.x = token.x;
      wrapper.y = token.y;
      wrapper.rotation = ((token.rotation ?? 0) * Math.PI) / 180;
      wrapper.zIndex = token.z_index ?? 0;
      wrapper.eventMode = toolMode === "select" ? "static" : "none";
      wrapper.cursor = toolMode === "select" ? "grab" : "default";
      wrapper.on("pointerdown", (event: any) => beginTokenDrag(event, token));

      const shadow = new PIXI.Graphics();
      shadow.ellipse(0, tokenPx * 0.48, tokenPx * 0.42, tokenPx * 0.13).fill({ color: 0x000000, alpha: 0.42 });
      wrapper.addChild(shadow);

      const imageUrl = tokenVisual(token, ficha);
      const ring = new PIXI.Graphics();
      ring.circle(0, 0, tokenPx * 0.45).fill({ color: selectedTokenId === token.id ? 0x4ad9d9 : 0x050a10, alpha: imageUrl ? (selectedTokenId === token.id ? 0.2 : 0.08) : selectedTokenId === token.id ? 0.42 : 0.78 });
      ring.circle(0, 0, tokenPx * 0.41).stroke({ color: token.visible_to_players === false ? 0xf59e0b : 0x4ad9d9, alpha: selectedTokenId === token.id ? 1 : 0.55, width: 3 });
      wrapper.addChild(ring);

      if (!imageUrl) {
        const body = new PIXI.Graphics();
        body.circle(0, 0, tokenPx * 0.38).fill({ color: Number.parseInt((token.cor || "#4ad9d9").replace("#", ""), 16) || 0x4ad9d9, alpha: 0.94 });
        wrapper.addChild(body);
        const label = new PIXI.Text({ text: initials(token, ficha), style: { fill: 0xffffff, fontSize: Math.max(18, tokenPx * 0.24), fontWeight: "900", align: "center" } });
        label.anchor.set(0.5);
        wrapper.addChild(label);
      }

      const name = new PIXI.Text({ text: tokenName(token, ficha), style: { fill: 0xf0ebd8, fontSize: Math.max(10, tokenPx * 0.13), fontWeight: "900", align: "center" } });
      name.anchor.set(0.5, 0);
      name.y = tokenPx * 0.46;
      wrapper.addChild(name);

      const vida = ficha?.dados?.status?.vida;
      const hpSource = typeof token.hp === "number" && typeof token.max_hp === "number" ? { atual: token.hp, max: token.max_hp } : vida;
      if (hpSource?.max) {
        const hp = clamp(hpSource.atual / hpSource.max, 0, 1);
        const bar = new PIXI.Graphics();
        bar.roundRect(-tokenPx * 0.38, tokenPx * 0.64, tokenPx * 0.76, 5, 3).fill({ color: 0xffffff, alpha: 0.14 });
        bar.roundRect(-tokenPx * 0.38, tokenPx * 0.64, tokenPx * 0.76 * hp, 5, 3).fill({ color: hp > 0.45 ? 0x22c55e : hp > 0.2 ? 0xf59e0b : 0xef4444, alpha: 1 });
        wrapper.addChild(bar);
      }
      tokenLayer.addChild(wrapper);
    });
    tokenLayer.sortChildren();
  }, [camera, fichasMap, runtimeGrid.gridOpacity, runtimeGrid.gridSize, runtimeGrid.showGrid, selectedTokenId, size.height, size.width, tokens, toolMode]);

  return (
    <div
      ref={hostRef}
      className="fixed inset-0 overflow-hidden touch-none select-none bg-[#050a10]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={(event) => {
        event.preventDefault();
        zoomAt({ x: event.clientX, y: event.clientY }, camera.zoom * (event.deltaY > 0 ? 0.9 : 1.1));
      }}
    >
      {mapaUrl && domMapStyle ? <img src={mapaUrl} alt="" aria-hidden="true" className="pointer-events-none max-w-none object-fill opacity-95" style={domMapStyle} /> : null}
      {tokenImageOverlays.map((tokenImage) => (
        <img
          key={tokenImage.id}
          src={tokenImage.url}
          alt=""
          aria-hidden="true"
          title={tokenImage.label}
          className={`pointer-events-none shadow-[0_12px_34px_rgba(0,0,0,0.55)] ${tokenImage.mode === "standee" ? "drop-shadow-[0_18px_18px_rgba(0,0,0,0.62)]" : ""}`}
          style={tokenImage.style}
        />
      ))}
      <div className="pointer-events-none fixed inset-0 z-10 bg-[radial-gradient(circle_at_50%_20%,rgba(74,217,217,0.08),transparent_38%),linear-gradient(to_bottom,rgba(0,0,0,0.02),rgba(0,0,0,0.22))]" />
      <div className="fixed left-1/2 top-[92px] z-40 flex w-[min(calc(100vw-1rem),560px)] -translate-x-1/2 items-center justify-between gap-2 rounded-[26px] border border-[#4ad9d9]/20 bg-[#050a10]/88 px-3 py-2 shadow-2xl backdrop-blur-xl md:top-4">
        <div className="flex gap-2">
          <button className="rounded-full border border-white/10 bg-white/5 p-3 text-white" onClick={() => zoomAt({ x: size.width / 2, y: size.height / 2 }, camera.zoom * 1.12)}>
            <Plus size={18} />
          </button>
          <button className="rounded-full border border-white/10 bg-white/5 p-3 text-white" onClick={() => zoomAt({ x: size.width / 2, y: size.height / 2 }, camera.zoom * 0.88)}>
            <Minus size={18} />
          </button>
          <button className="rounded-full border border-white/10 bg-white/5 p-3 text-white" onClick={() => setCamera(DEFAULT_CAMERA)}>
            <RotateCcw size={18} />
          </button>
        </div>
        <div className="text-right">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-white">Zoom {Math.round(camera.zoom * 100)}%</div>
          <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-slate-400">{toolMode === "map" ? "Reposicionando cena" : toolMode === "pan" ? "Camera livre" : "Tokens cinematicos"}</div>
        </div>
      </div>
      {mapaUrl && !domMapStyle && !canvasError ? (
        <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-cyan-400/20 bg-[#050a10]/80 px-5 py-4 text-center text-xs font-black uppercase tracking-[0.24em] text-cyan-200">
          Carregando mapa...
        </div>
      ) : null}
      {canvasError ? <div className="fixed left-1/2 top-1/2 z-50 max-w-[84vw] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-red-500/30 bg-red-950/80 px-5 py-4 text-center text-sm text-red-100">{canvasError}</div> : null}
    </div>
  );
}
