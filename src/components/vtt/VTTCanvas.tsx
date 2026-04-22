"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
  Group,
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Stage,
  Text as KonvaText,
} from "react-konva";
import useImage from "use-image";
import { Minus, Plus, RotateCcw, X } from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { FichaVTTSnapshot, SceneViewPreferences, Token } from "@/src/lib/types";
import { useTokenFichaSync } from "@/src/lib/hooks/useTokenFichaSync";

const COLORS = {
  bg: "#050a10",
  grid: "#4ad9d9",
  selectionRing: "#4ad9d9",
  tokenLabel: "#f0ebd8",
  hpHigh: "#22c55e",
  hpMid: "#f59e0b",
  hpLow: "#ef4444",
  hpBarBg: "#0a0f18",
  placeholderText: "#6b7b94",
};

const DEFAULT_CAMERA = { x: 0, y: 0, scale: 1 };

type Point = { x: number; y: number };
type CameraState = typeof DEFAULT_CAMERA;
type ActiveGesture =
  | { type: "map"; pointer: Point; offset: Point }
  | { type: "camera"; pointer: Point; camera: CameraState }
  | { type: "pinch"; center: Point; distance: number; camera: CameraState }
  | { type: "token" };

interface VTTCanvasProps {
  cenaId: string;
  mapaUrl?: string;
  selectedTokenId: string | null;
  onSelectToken: (token: Token | null) => void;
  onFichasMapChange?: (map: Record<string, FichaVTTSnapshot>) => void;
  onTokensChange?: (tokens: Token[]) => void;
  scenePreferences: SceneViewPreferences;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatDistance(start: Point, end: Point, gridSize: number) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const px = Math.sqrt(dx * dx + dy * dy);
  const cells = px / gridSize;
  const meters = cells * 1.5;
  return `${cells.toFixed(1)} qd - ${meters.toFixed(1)} m`;
}

function AvatarToken({
  token,
  ficha,
  isSelected,
  size,
  draggable,
  onDragEnd,
  onDragStart,
  onClick,
}: {
  token: Token;
  ficha: FichaVTTSnapshot | null;
  isSelected: boolean;
  size: number;
  draggable: boolean;
  onDragEnd: (event: any) => void;
  onDragStart: (event: any) => void;
  onClick: (event: any) => void;
}) {
  const [avatar] = useImage(ficha?.avatar_url || "");

  const vida = ficha?.dados?.status?.vida;
  const hpRatio = vida ? Math.max(0, Math.min(1, vida.atual / (vida.max || 1))) : null;
  const hpColor = hpRatio === null ? COLORS.hpHigh : hpRatio > 0.5 ? COLORS.hpHigh : hpRatio > 0.25 ? COLORS.hpMid : COLORS.hpLow;

  const radius = size * 0.42;
  const cx = size / 2;
  const cy = size / 2;
  const barW = size * 0.9;
  const barH = 4;
  const barX = (size - barW) / 2;
  const barY = size + 5;
  const isDead = (vida?.atual ?? 1) <= 0;
  const avatarInset = 5;
  const avatarSize = size - avatarInset * 2;

  return (
    <Group
      x={token.x}
      y={token.y}
      name="aq-token"
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onTap={onClick}
      hitStrokeWidth={24}
    >
      {isSelected ? (
        <>
          <Circle x={cx} y={cy} radius={radius + 6} stroke={COLORS.selectionRing} strokeWidth={1.5} dash={[6, 3]} opacity={0.9} />
          <Circle x={cx} y={cy} radius={radius + 10} stroke={COLORS.selectionRing} strokeWidth={0.5} opacity={0.3} />
        </>
      ) : null}

      <Circle
        x={cx}
        y={cy}
        radius={radius}
        fill={isDead ? "#6b7280" : token.cor || "#ef4444"}
        shadowBlur={isSelected ? 24 : 10}
        shadowColor={isSelected ? COLORS.selectionRing : token.cor || "#ef4444"}
        shadowOpacity={isSelected ? 0.7 : 0.4}
        opacity={isDead ? 0.65 : 1}
      />

      {avatar ? (
        <Group
          listening={false}
          clipFunc={(context) => {
            context.arc(cx, cy, radius - 2, 0, Math.PI * 2, false);
          }}
        >
          <KonvaImage image={avatar} x={avatarInset} y={avatarInset} width={avatarSize} height={avatarSize} opacity={isDead ? 0.45 : 0.96} />
        </Group>
      ) : (
        <KonvaText
          x={8}
          y={cy - 8}
          width={size - 16}
          text={token.nome.slice(0, 2).toUpperCase()}
          fontSize={size >= 68 ? 15 : 13}
          fill="rgba(255,255,255,0.85)"
          align="center"
          fontStyle="bold"
          listening={false}
        />
      )}

      {ficha ? (
        <KonvaText
          x={cx - 5}
          y={cy - 5}
          text={isDead ? "X" : "+"}
          fontSize={10}
          fill="rgba(255,255,255,0.75)"
          listening={false}
        />
      ) : null}

      <KonvaText
        x={-10}
        y={cy + radius + 4}
        width={size + 20}
        text={token.nome}
        fontSize={size >= 68 ? 10 : 9}
        fill={isDead ? "#9ca3af" : COLORS.tokenLabel}
        align="center"
        fontFamily="monospace"
        listening={false}
      />

      {hpRatio !== null ? (
        <>
          <Rect
            x={barX}
            y={barY}
            width={barW}
            height={barH}
            fill={COLORS.hpBarBg}
            cornerRadius={2}
            stroke="#1a2b4c"
            strokeWidth={0.5}
            listening={false}
          />
          <Rect x={barX} y={barY} width={barW * hpRatio} height={barH} fill={hpColor} cornerRadius={2} listening={false} />
          <KonvaText
            x={barX}
            y={barY + barH + 2}
            width={barW}
            text={`${vida!.atual}/${vida!.max}`}
            fontSize={size >= 68 ? 8 : 7}
            fill={hpColor}
            align="center"
            fontFamily="monospace"
            listening={false}
          />
        </>
      ) : null}
    </Group>
  );
}

export default function VTTCanvas({
  cenaId,
  mapaUrl,
  selectedTokenId,
  onSelectToken,
  onFichasMapChange,
  onTokensChange,
  scenePreferences,
}: VTTCanvasProps) {
  const stageRef = useRef<any>(null);
  const activeGestureRef = useRef<ActiveGesture | null>(null);
  const gestureMovedRef = useRef(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [image] = useImage(mapaUrl || "");
  const [windowSize, setWindowSize] = useState({ w: 1000, h: 800 });
  const [camera, setCamera] = useState(DEFAULT_CAMERA);
  const [measureStart, setMeasureStart] = useState<Point | null>(null);
  const [measureEnd, setMeasureEnd] = useState<Point | null>(null);

  const fichaIds = tokens.map((token) => token.ficha_id).filter((id): id is string => Boolean(id));
  const fichasMap = useTokenFichaSync(fichaIds);
  const stageHeight = Math.max(windowSize.h, 320);
  const isMobile = windowSize.w < 768;
  const tokenSize = isMobile ? 74 : 62;

  const mapFraming = useMemo(() => {
    if (!image?.width || !image?.height) {
      return null;
    }

    const targetWidth = windowSize.w * (isMobile ? 1.02 : 1);
    const targetHeight = stageHeight;
    const autoScale = clamp(Math.max(targetWidth / image.width, targetHeight / image.height), 0.9, 4);
    const effectiveScale = autoScale * scenePreferences.mapScale;
    const effectiveWidth = image.width * effectiveScale;
    const effectiveHeight = image.height * effectiveScale;
    const baseOffsetX = (windowSize.w - effectiveWidth) / 2;
    const baseOffsetY = (stageHeight - effectiveHeight) / 2;

    return {
      effectiveScale,
      effectiveWidth,
      effectiveHeight,
      baseOffsetX,
      baseOffsetY,
    };
  }, [image, isMobile, scenePreferences.mapScale, stageHeight, windowSize.w]);

  const clampedSceneOffsets = useMemo(() => {
    if (!mapFraming) {
      return { x: scenePreferences.mapOffsetX, y: scenePreferences.mapOffsetY };
    }

    const minX = -(mapFraming.effectiveWidth * 0.35);
    const maxX = mapFraming.effectiveWidth * 0.35;
    const minY = -(mapFraming.effectiveHeight * 0.35);
    const maxY = mapFraming.effectiveHeight * 0.35;

    return {
      x: clamp(scenePreferences.mapOffsetX, minX, maxX),
      y: clamp(scenePreferences.mapOffsetY, minY, maxY),
    };
  }, [mapFraming, scenePreferences.mapOffsetX, scenePreferences.mapOffsetY]);

  const effectiveMapOffsetX = (mapFraming?.baseOffsetX ?? 0) + clampedSceneOffsets.x;
  const effectiveMapOffsetY = (mapFraming?.baseOffsetY ?? 0) + clampedSceneOffsets.y;
  const effectiveMapWidth = mapFraming?.effectiveWidth ?? (image?.width || windowSize.w) * scenePreferences.mapScale;
  const effectiveMapHeight = mapFraming?.effectiveHeight ?? (image?.height || stageHeight) * scenePreferences.mapScale;

  useEffect(() => {
    if (
      clampedSceneOffsets.x !== scenePreferences.mapOffsetX ||
      clampedSceneOffsets.y !== scenePreferences.mapOffsetY
    ) {
      window.dispatchEvent(
        new CustomEvent("aq-map-offset", {
          detail: {
            x: clampedSceneOffsets.x,
            y: clampedSceneOffsets.y,
          },
        }),
      );
    }
  }, [clampedSceneOffsets.x, clampedSceneOffsets.y, scenePreferences.mapOffsetX, scenePreferences.mapOffsetY]);

  useEffect(() => {
    onFichasMapChange?.(fichasMap);
  }, [fichasMap, onFichasMapChange]);

  useEffect(() => {
    onTokensChange?.(tokens);
  }, [onTokensChange, tokens]);

  useEffect(() => {
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (scenePreferences.toolMode !== "measure") {
      setMeasureStart(null);
      setMeasureEnd(null);
    }
  }, [scenePreferences.toolMode]);

  useEffect(() => {
    setCamera(DEFAULT_CAMERA);
    activeGestureRef.current = null;
    gestureMovedRef.current = false;
  }, [cenaId]);

  useEffect(() => {
    if (!cenaId) {
      return;
    }

    const carregarDadosIniciais = async () => {
      try {
        const { data, error } = await supabase.from("tokens").select("*").eq("cena_id", cenaId);
        if (error) {
          throw error;
        }
        setCanvasError(null);
        setTokens((data ?? []) as Token[]);
      } catch (error: any) {
        console.error("[VTTCanvas] erro ao carregar tokens:", error?.message ?? error);
        setCanvasError("Nao foi possivel carregar os tokens desta cena.");
      }
    };

    void carregarDadosIniciais();

    const channel = supabase
      .channel(`vtt_canvas_${cenaId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tokens",
          filter: `cena_id=eq.${cenaId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setTokens((prev) => prev.map((token) => (token.id === payload.new.id ? (payload.new as Token) : token)));
          } else if (payload.eventType === "INSERT") {
            setTokens((prev) => [...prev, payload.new as Token]);
          } else if (payload.eventType === "DELETE") {
            setTokens((prev) => prev.filter((token) => token.id !== payload.old.id));
            if (selectedTokenId === payload.old.id) {
              onSelectToken(null);
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cenaId, onSelectToken, selectedTokenId]);

  const worldFromPointer = useCallback(() => {
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) {
      return null;
    }

    return {
      x: (pointer.x - camera.x) / camera.scale,
      y: (pointer.y - camera.y) / camera.scale,
    };
  }, [camera]);

  const screenPointer = useCallback(() => {
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) {
      return null;
    }

    return { x: pointer.x, y: pointer.y };
  }, []);

  const touchPoint = useCallback((touch: Touch): Point => {
    const container = stageRef.current?.container?.();
    const rect = container?.getBoundingClientRect?.();
    return {
      x: touch.clientX - (rect?.left ?? 0),
      y: touch.clientY - (rect?.top ?? 0),
    };
  }, []);

  const isTokenTarget = useCallback((target: any) => {
    let node = target;
    while (node) {
      if (node?.name?.() === "aq-token") {
        return true;
      }
      node = node?.getParent?.();
    }
    return false;
  }, []);

  const isMapSurface = useCallback(
    (target: any) => {
      if (isTokenTarget(target)) {
        return false;
      }
      return target === target?.getStage?.() || target?.name?.() === "aq-map";
    },
    [isTokenTarget],
  );

  const emitMapOffset = useCallback((x: number, y: number) => {
    window.dispatchEvent(
      new CustomEvent("aq-map-offset", {
        detail: {
          x: Number(x.toFixed(0)),
          y: Number(y.toFixed(0)),
        },
      }),
    );
  }, []);

  const beginGesture = useCallback((event: any) => {
    const touches: TouchList | undefined = event?.evt?.touches;
    gestureMovedRef.current = false;

    if (touches?.length === 2) {
      event.evt.preventDefault();
      const pointA = touchPoint(touches[0]);
      const pointB = touchPoint(touches[1]);
      activeGestureRef.current = {
        type: "pinch",
        center: {
          x: (pointA.x + pointB.x) / 2,
          y: (pointA.y + pointB.y) / 2,
        },
        distance: Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y),
        camera,
      };
      return;
    }

    if (isTokenTarget(event?.target)) {
      activeGestureRef.current = null;
      return;
    }

    const pointer = screenPointer();
    if (!pointer) {
      return;
    }

    if (scenePreferences.toolMode === "map" && isMapSurface(event?.target)) {
      event.evt?.preventDefault?.();
      activeGestureRef.current = {
        type: "map",
        pointer,
        offset: {
          x: clampedSceneOffsets.x,
          y: clampedSceneOffsets.y,
        },
      };
      onSelectToken(null);
      return;
    }

    if (scenePreferences.toolMode === "pan") {
      event.evt?.preventDefault?.();
      activeGestureRef.current = { type: "camera", pointer, camera };
      onSelectToken(null);
      return;
    }

    activeGestureRef.current = null;
  }, [camera, clampedSceneOffsets.x, clampedSceneOffsets.y, isMapSurface, isTokenTarget, onSelectToken, scenePreferences.toolMode, screenPointer, touchPoint]);

  const updateGesture = useCallback((pointer?: Point) => {
    const gesture = activeGestureRef.current;
    if (!gesture) {
      return false;
    }

    const currentPointer = pointer ?? screenPointer();
    if (!currentPointer) {
      return false;
    }

    if (gesture.type === "map") {
      const deltaX = (currentPointer.x - gesture.pointer.x) / camera.scale;
      const deltaY = (currentPointer.y - gesture.pointer.y) / camera.scale;
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        gestureMovedRef.current = true;
      }
      emitMapOffset(gesture.offset.x + deltaX, gesture.offset.y + deltaY);
      return true;
    }

    if (gesture.type === "camera") {
      const deltaX = currentPointer.x - gesture.pointer.x;
      const deltaY = currentPointer.y - gesture.pointer.y;
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        gestureMovedRef.current = true;
      }
      setCamera({
        ...gesture.camera,
        x: gesture.camera.x + deltaX,
        y: gesture.camera.y + deltaY,
      });
      return true;
    }

    return false;
  }, [camera.scale, emitMapOffset, screenPointer]);

  const finishGesture = useCallback(() => {
    activeGestureRef.current = null;
  }, []);

  const snapPoint = useCallback(
    (point: Point) => {
      if (!scenePreferences.snapToGrid) {
        return point;
      }

      return {
        x: Math.round(point.x / scenePreferences.gridSize) * scenePreferences.gridSize,
        y: Math.round(point.y / scenePreferences.gridSize) * scenePreferences.gridSize,
      };
    },
    [scenePreferences.gridSize, scenePreferences.snapToGrid],
  );

  const applyZoom = useCallback(
    (factor: number, anchor?: { x: number; y: number }) => {
      const nextScale = clamp(camera.scale * factor, 0.4, 2.8);
      const pivot = anchor ?? { x: windowSize.w / 2, y: stageHeight / 2 };
      const worldX = (pivot.x - camera.x) / camera.scale;
      const worldY = (pivot.y - camera.y) / camera.scale;

      setCamera({
        scale: nextScale,
        x: pivot.x - worldX * nextScale,
        y: pivot.y - worldY * nextScale,
      });
    },
    [camera, stageHeight, windowSize.w],
  );

  const handleWheel = useCallback(
    (event: any) => {
      event.evt.preventDefault();
      const stage = stageRef.current;
      const pointer = stage?.getPointerPosition();
      if (!pointer) {
        return;
      }

      const direction = event.evt.deltaY > 0 ? 0.92 : 1.08;
      applyZoom(direction, pointer);
    },
    [applyZoom],
  );

  const handleDragEnd = useCallback(
    async (id: string, event: any) => {
      event.cancelBubble = true;
      const baseX = event.target.x();
      const baseY = event.target.y();
      const newX = scenePreferences.snapToGrid ? Math.round(baseX / scenePreferences.gridSize) * scenePreferences.gridSize : baseX;
      const newY = scenePreferences.snapToGrid ? Math.round(baseY / scenePreferences.gridSize) * scenePreferences.gridSize : baseY;

      setTokens((prev) => prev.map((token) => (token.id === id ? { ...token, x: newX, y: newY } : token)));
      await supabase.from("tokens").update({ x: newX, y: newY }).eq("id", id);
      activeGestureRef.current = null;
    },
    [scenePreferences.gridSize, scenePreferences.snapToGrid],
  );

  const handleTokenDragStart = useCallback(
    (_token: Token, event: any) => {
      event.cancelBubble = true;
      event.evt?.preventDefault?.();
      activeGestureRef.current = { type: "token" };
      gestureMovedRef.current = true;
    },
    [],
  );

  const handleTokenClick = useCallback(
    (token: Token, event: any) => {
      event.cancelBubble = true;
      event.evt?.preventDefault?.();
      if (scenePreferences.toolMode !== "select") {
        return;
      }
      onSelectToken(selectedTokenId === token.id ? null : token);
    },
    [onSelectToken, scenePreferences.toolMode, selectedTokenId],
  );

  const handleStageClick = useCallback(() => {
    if (gestureMovedRef.current) {
      gestureMovedRef.current = false;
      return;
    }

    if (scenePreferences.toolMode === "measure") {
      const world = worldFromPointer();
      if (!world) {
        return;
      }

      const point = snapPoint(world);
      if (!measureStart) {
        setMeasureStart(point);
        setMeasureEnd(point);
        return;
      }

      setMeasureEnd(point);
      return;
    }

    if (scenePreferences.toolMode === "map") {
      return;
    }

    onSelectToken(null);
  }, [measureStart, onSelectToken, scenePreferences.toolMode, snapPoint, worldFromPointer]);

  const handleStageMouseMove = useCallback(() => {
    if (updateGesture()) {
      return;
    }

    if (scenePreferences.toolMode !== "measure" || !measureStart) {
      return;
    }

    const world = worldFromPointer();
    if (!world) {
      return;
    }

    setMeasureEnd(snapPoint(world));
  }, [measureStart, scenePreferences.toolMode, snapPoint, updateGesture, worldFromPointer]);

  const handleTouchMove = useCallback(
    (event: any) => {
      const touches = event.evt.touches;
      if (touches.length === 2) {
        event.evt.preventDefault();

        const pointA = touchPoint(touches[0]);
        const pointB = touchPoint(touches[1]);
        const center = {
          x: (pointA.x + pointB.x) / 2,
          y: (pointA.y + pointB.y) / 2,
        };
        const distance = Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);

        if (activeGestureRef.current?.type !== "pinch") {
          activeGestureRef.current = { type: "pinch", center, distance, camera };
          return;
        }

        const gesture = activeGestureRef.current;
        const scaleBy = distance / gesture.distance;
        const nextScale = clamp(gesture.camera.scale * scaleBy, 0.4, 2.8);
        const worldX = (gesture.center.x - gesture.camera.x) / gesture.camera.scale;
        const worldY = (gesture.center.y - gesture.camera.y) / gesture.camera.scale;

        gestureMovedRef.current = true;
        setCamera({
          scale: nextScale,
          x: center.x - worldX * nextScale,
          y: center.y - worldY * nextScale,
        });
        return;
      }

      if (touches.length === 1 && updateGesture(touchPoint(touches[0]))) {
        event.evt.preventDefault();
        return;
      }

      handleStageMouseMove();
    },
    [camera, handleStageMouseMove, touchPoint, updateGesture],
  );

  const clearGesture = useCallback(() => {
    finishGesture();
  }, [finishGesture]);

  const gridLines = useMemo(() => {
    if (!scenePreferences.showGrid) {
      return [];
    }

    const lines: React.ReactNode[] = [];
    const grid = scenePreferences.gridSize;
    const left = -camera.x / camera.scale - grid * 2;
    const right = (windowSize.w - camera.x) / camera.scale + grid * 2;
    const top = -camera.y / camera.scale - grid * 2;
    const bottom = (stageHeight - camera.y) / camera.scale + grid * 2;

    const startX = Math.floor(left / grid) * grid;
    const endX = Math.ceil(right / grid) * grid;
    const startY = Math.floor(top / grid) * grid;
    const endY = Math.ceil(bottom / grid) * grid;

    for (let x = startX; x <= endX; x += grid) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, startY, x, endY]}
          stroke={COLORS.grid}
          strokeWidth={0.75 / camera.scale}
          opacity={scenePreferences.gridOpacity}
          listening={false}
        />,
      );
    }

    for (let y = startY; y <= endY; y += grid) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[startX, y, endX, y]}
          stroke={COLORS.grid}
          strokeWidth={0.75 / camera.scale}
          opacity={scenePreferences.gridOpacity}
          listening={false}
        />,
      );
    }

    return lines;
  }, [camera.scale, camera.x, camera.y, scenePreferences.gridOpacity, scenePreferences.gridSize, scenePreferences.showGrid, stageHeight, windowSize.w]);

  const measurementLabel = measureStart && measureEnd ? formatDistance(measureStart, measureEnd, scenePreferences.gridSize) : null;
  const hudInstruction =
    scenePreferences.toolMode === "pan"
      ? "Arraste para mover a camera"
      : scenePreferences.toolMode === "measure"
        ? "Toque duas vezes para medir"
        : scenePreferences.toolMode === "map"
          ? "Arraste o mapa para reposicionar"
          : "Arraste tokens livremente";

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: COLORS.bg }}>
      <Stage
        ref={stageRef}
        width={windowSize.w}
        height={stageHeight}
        x={camera.x}
        y={camera.y}
        scaleX={camera.scale}
        scaleY={camera.scale}
        draggable={false}
        onMouseDown={beginGesture}
        onMouseUp={finishGesture}
        onMouseLeave={finishGesture}
        onTouchStart={beginGesture}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onMouseMove={handleStageMouseMove}
        onTouchMove={handleTouchMove}
        onTouchEnd={clearGesture}
        onTouchCancel={clearGesture}
        onWheel={handleWheel}
      >
        <Layer>
          {image ? (
            <KonvaImage
              name="aq-map"
              image={image}
              x={effectiveMapOffsetX}
              y={effectiveMapOffsetY}
              width={effectiveMapWidth}
              height={effectiveMapHeight}
              opacity={0.96}
              listening={scenePreferences.toolMode === "map"}
            />
          ) : (
            <KonvaText
              x={-220}
              y={-10}
              text={canvasError || "Sem mapa. Use os controles para fazer upload da cena."}
              fontSize={13}
              fill={COLORS.placeholderText}
              fontFamily="monospace"
              listening={false}
            />
          )}

          {gridLines}

          {tokens.map((token) => {
            const ficha = token.ficha_id ? fichasMap[token.ficha_id] : null;
            return (
              <AvatarToken
                key={token.id}
                token={token}
                ficha={ficha}
                isSelected={selectedTokenId === token.id}
                size={tokenSize}
                draggable={scenePreferences.toolMode === "select"}
                onDragStart={(event) => handleTokenDragStart(token, event)}
                onDragEnd={(event) => handleDragEnd(token.id, event)}
                onClick={(event) => handleTokenClick(token, event)}
              />
            );
          })}

          {measureStart && measureEnd ? (
            <>
              <Line
                points={[measureStart.x, measureStart.y, measureEnd.x, measureEnd.y]}
                stroke="#f59e0b"
                strokeWidth={3 / camera.scale}
                dash={[10 / camera.scale, 8 / camera.scale]}
                listening={false}
              />
              <Circle x={measureStart.x} y={measureStart.y} radius={7 / camera.scale} fill="#f59e0b" listening={false} />
              <Circle x={measureEnd.x} y={measureEnd.y} radius={7 / camera.scale} fill="#f59e0b" listening={false} />
              {measurementLabel ? (
                <KonvaText
                  x={(measureStart.x + measureEnd.x) / 2 - 55 / camera.scale}
                  y={(measureStart.y + measureEnd.y) / 2 - 26 / camera.scale}
                  width={110 / camera.scale}
                  text={measurementLabel}
                  fontSize={12 / camera.scale}
                  padding={6 / camera.scale}
                  fill="#f8fafc"
                  align="center"
                  fontFamily="monospace"
                  listening={false}
                />
              ) : null}
            </>
          ) : null}
        </Layer>
      </Stage>

      <div className="pointer-events-none fixed left-1/2 top-[82px] z-50 flex w-[calc(100vw-0.75rem)] max-w-[560px] -translate-x-1/2 flex-col gap-2 md:top-[18px] md:w-auto md:min-w-[500px]">
        <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-[26px] border border-[var(--aq-border)] bg-[rgba(5,10,16,0.86)] px-3 py-2.5 shadow-[0_14px_34px_rgba(0,0,0,0.3)] backdrop-blur-xl md:rounded-full md:px-4 md:py-2">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => applyZoom(1.12)}
              className="rounded-full border border-[var(--aq-border)] bg-[rgba(10,15,24,0.9)] p-3 text-[var(--aq-title)] transition-all hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)] md:p-2.5"
              title="Aproximar"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={() => applyZoom(0.88)}
              className="rounded-full border border-[var(--aq-border)] bg-[rgba(10,15,24,0.9)] p-3 text-[var(--aq-title)] transition-all hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)] md:p-2.5"
              title="Afastar"
            >
              <Minus size={18} />
            </button>
            <button
              onClick={() => {
                setCamera(DEFAULT_CAMERA);
                window.dispatchEvent(
                  new CustomEvent("aq-map-offset", {
                    detail: { x: 0, y: 0 },
                  }),
                );
              }}
              className="rounded-full border border-[var(--aq-border)] bg-[rgba(10,15,24,0.9)] p-3 text-[var(--aq-title)] transition-all hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)] md:p-2.5"
              title="Recentralizar mapa"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          <div className="min-w-0 text-right">
            <div className="truncate text-[11px] font-black uppercase tracking-[0.18em] text-[var(--aq-title)] md:text-xs">
              {`Zoom ${Math.round(camera.scale * 100)}%`}
            </div>
            <div className="mt-1 line-clamp-2 text-right text-[9px] uppercase leading-relaxed tracking-[0.14em] text-[var(--aq-text-muted)] md:truncate md:text-[10px]">
              {hudInstruction}
            </div>
          </div>
        </div>

        {measurementLabel ? (
          <div className="pointer-events-auto rounded-2xl border border-[rgba(245,158,11,0.35)] bg-[rgba(15,10,2,0.9)] px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-amber-200 backdrop-blur-md md:text-xs md:tracking-[0.16em]">
            <div className="flex items-center justify-between gap-4">
              <span>{measurementLabel}</span>
              <button
                onClick={() => {
                  setMeasureStart(null);
                  setMeasureEnd(null);
                }}
                className="text-amber-100 transition-colors hover:text-white"
                title="Limpar medicao"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
