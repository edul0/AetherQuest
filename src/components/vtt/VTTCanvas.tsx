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
import { Minus, Move, Plus, RotateCcw, X } from "lucide-react";
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
const MOBILE_ROSTER_HEIGHT = 176;
const DESKTOP_ROSTER_HEIGHT = 228;

type Point = { x: number; y: number };

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
  return `${cells.toFixed(1)} qd • ${meters.toFixed(1)} m`;
}

function AvatarToken({
  token,
  ficha,
  isSelected,
  draggable,
  onDragEnd,
  onClick,
}: {
  token: Token;
  ficha: FichaVTTSnapshot | null;
  isSelected: boolean;
  draggable: boolean;
  onDragEnd: (event: any) => void;
  onClick: (event: any) => void;
}) {
  const [avatar] = useImage(ficha?.avatar_url || "");

  const vida = ficha?.dados?.status?.vida;
  const hpRatio = vida ? Math.max(0, Math.min(1, vida.atual / (vida.max || 1))) : null;
  const hpColor = hpRatio === null ? COLORS.hpHigh : hpRatio > 0.5 ? COLORS.hpHigh : hpRatio > 0.25 ? COLORS.hpMid : COLORS.hpLow;

  const radius = 21;
  const cx = token.x + 25;
  const cy = token.y + 25;
  const barW = 46;
  const barH = 4;
  const barX = token.x + 2;
  const barY = token.y + 55;
  const isDead = (vida?.atual ?? 1) <= 0;

  return (
    <Group onClick={onClick} onTap={onClick}>
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
        draggable={draggable}
        onDragEnd={onDragEnd}
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
          <KonvaImage image={avatar} x={token.x + 4} y={token.y + 4} width={42} height={42} opacity={isDead ? 0.45 : 0.96} />
        </Group>
      ) : (
        <KonvaText
          x={token.x + 8}
          y={token.y + 15}
          width={34}
          text={token.nome.slice(0, 2).toUpperCase()}
          fontSize={12}
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
        x={token.x - 5}
        y={cy + radius + 4}
        width={60}
        text={token.nome}
        fontSize={9}
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
            fontSize={7}
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
  const pinchCenterRef = useRef<Point | null>(null);
  const pinchDistanceRef = useRef(0);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [image] = useImage(mapaUrl || "");
  const [windowSize, setWindowSize] = useState({ w: 1000, h: 800 });
  const [camera, setCamera] = useState(DEFAULT_CAMERA);
  const [measureStart, setMeasureStart] = useState<Point | null>(null);
  const [measureEnd, setMeasureEnd] = useState<Point | null>(null);

  const fichaIds = tokens.map((token) => token.ficha_id).filter((id): id is string => Boolean(id));
  const fichasMap = useTokenFichaSync(fichaIds);
  const rosterHeight = windowSize.w < 768 ? MOBILE_ROSTER_HEIGHT : DESKTOP_ROSTER_HEIGHT;
  const stageHeight = Math.max(windowSize.h - rosterHeight, 320);

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
    pinchCenterRef.current = null;
    pinchDistanceRef.current = 0;
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

    carregarDadosIniciais();

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

  const applyZoom = useCallback((factor: number, anchor?: { x: number; y: number }) => {
    const nextScale = clamp(camera.scale * factor, 0.4, 2.8);
    const pivot = anchor ?? { x: windowSize.w / 2, y: stageHeight / 2 };
    const worldX = (pivot.x - camera.x) / camera.scale;
    const worldY = (pivot.y - camera.y) / camera.scale;

    setCamera({
      scale: nextScale,
      x: pivot.x - worldX * nextScale,
      y: pivot.y - worldY * nextScale,
    });
  }, [camera, stageHeight, windowSize.w]);

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
      const baseX = event.target.x();
      const baseY = event.target.y();
      const newX = scenePreferences.snapToGrid ? Math.round(baseX / scenePreferences.gridSize) * scenePreferences.gridSize : baseX;
      const newY = scenePreferences.snapToGrid ? Math.round(baseY / scenePreferences.gridSize) * scenePreferences.gridSize : baseY;

      setTokens((prev) => prev.map((token) => (token.id === id ? { ...token, x: newX, y: newY } : token)));
      await supabase.from("tokens").update({ x: newX, y: newY }).eq("id", id);
    },
    [scenePreferences.gridSize, scenePreferences.snapToGrid],
  );

  const handleTokenClick = useCallback(
    (token: Token, event: any) => {
      event.cancelBubble = true;
      if (scenePreferences.toolMode !== "select") {
        return;
      }
      onSelectToken(selectedTokenId === token.id ? null : token);
    },
    [onSelectToken, scenePreferences.toolMode, selectedTokenId],
  );

  const handleStageClick = useCallback(() => {
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

    onSelectToken(null);
  }, [measureStart, onSelectToken, scenePreferences.toolMode, snapPoint, worldFromPointer]);

  const handleStageMouseMove = useCallback(() => {
    if (scenePreferences.toolMode !== "measure" || !measureStart) {
      return;
    }

    const world = worldFromPointer();
    if (!world) {
      return;
    }

    setMeasureEnd(snapPoint(world));
  }, [measureStart, scenePreferences.toolMode, snapPoint, worldFromPointer]);

  const handleTouchMove = useCallback(
    (event: any) => {
      const touches = event.evt.touches;
      if (touches.length === 2) {
        event.evt.preventDefault();

        const pointA = { x: touches[0].clientX, y: touches[0].clientY };
        const pointB = { x: touches[1].clientX, y: touches[1].clientY };
        const center = {
          x: (pointA.x + pointB.x) / 2,
          y: (pointA.y + pointB.y) / 2,
        };
        const distance = Math.hypot(pointB.x - pointA.x, pointB.y - pointA.y);

        if (!pinchCenterRef.current || !pinchDistanceRef.current) {
          pinchCenterRef.current = center;
          pinchDistanceRef.current = distance;
          return;
        }

        setCamera((current) => {
          const scaleBy = distance / pinchDistanceRef.current;
          const nextScale = clamp(current.scale * scaleBy, 0.4, 2.8);
          const worldX = (center.x - current.x) / current.scale;
          const worldY = (center.y - current.y) / current.scale;
          const deltaX = center.x - pinchCenterRef.current!.x;
          const deltaY = center.y - pinchCenterRef.current!.y;

          return {
            scale: nextScale,
            x: center.x - worldX * nextScale + deltaX,
            y: center.y - worldY * nextScale + deltaY,
          };
        });

        pinchCenterRef.current = center;
        pinchDistanceRef.current = distance;
        return;
      }

      handleStageMouseMove();
    },
    [handleStageMouseMove],
  );

  const clearPinch = useCallback(() => {
    pinchCenterRef.current = null;
    pinchDistanceRef.current = 0;
  }, []);

  const gridLines = useMemo(() => {
    if (!scenePreferences.showGrid) {
      return [];
    }

    const lines: React.ReactNode[] = [];
    const grid = scenePreferences.gridSize;
    const left = (-camera.x / camera.scale) - grid * 2;
    const right = ((windowSize.w - camera.x) / camera.scale) + grid * 2;
    const top = (-camera.y / camera.scale) - grid * 2;
    const bottom = ((stageHeight - camera.y) / camera.scale) + grid * 2;

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

  return (
    <div className="fixed left-0 right-0 top-0 overflow-hidden" style={{ background: COLORS.bg, bottom: rosterHeight }}>
      <Stage
        ref={stageRef}
        width={windowSize.w}
        height={stageHeight}
        x={camera.x}
        y={camera.y}
        scaleX={camera.scale}
        scaleY={camera.scale}
        draggable={scenePreferences.toolMode === "pan"}
        onDragEnd={(event) => setCamera((current) => ({ ...current, x: event.target.x(), y: event.target.y() }))}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onMouseMove={handleStageMouseMove}
        onTouchMove={handleTouchMove}
        onTouchEnd={clearPinch}
        onTouchCancel={clearPinch}
        onWheel={handleWheel}
      >
        <Layer>
          {image ? (
            <KonvaImage
              image={image}
              x={scenePreferences.mapOffsetX}
              y={scenePreferences.mapOffsetY}
              width={(image.width || windowSize.w) * scenePreferences.mapScale}
              height={(image.height || stageHeight) * scenePreferences.mapScale}
              opacity={0.95}
              listening={false}
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
                draggable={scenePreferences.toolMode === "select"}
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

      <div className="pointer-events-none fixed left-1/2 top-[72px] z-50 flex w-[calc(100vw-1rem)] max-w-[360px] -translate-x-1/2 flex-col gap-2 md:left-auto md:right-[370px] md:top-20 md:w-auto md:max-w-none md:translate-x-0">
        <div className="pointer-events-auto flex items-center justify-center gap-2 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.9)] p-2 backdrop-blur-md">
          <button
            onClick={() => applyZoom(1.12)}
            className="rounded-xl border border-[var(--aq-border)] bg-[rgba(10,15,24,0.86)] p-2 text-[var(--aq-title)] transition-all hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)]"
            title="Aproximar"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => applyZoom(0.88)}
            className="rounded-xl border border-[var(--aq-border)] bg-[rgba(10,15,24,0.86)] p-2 text-[var(--aq-title)] transition-all hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)]"
            title="Afastar"
          >
            <Minus size={16} />
          </button>
          <button
            onClick={() => setCamera(DEFAULT_CAMERA)}
            className="rounded-xl border border-[var(--aq-border)] bg-[rgba(10,15,24,0.86)] p-2 text-[var(--aq-title)] transition-all hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)]"
            title="Resetar camera"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        <div className="pointer-events-auto rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.9)] px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-[var(--aq-text-muted)] backdrop-blur-md md:text-xs md:tracking-[0.18em]">
          <div>{`Zoom ${Math.round(camera.scale * 100)}%`}</div>
          <div className="mt-2 leading-relaxed">{scenePreferences.toolMode === "pan" ? "Arraste para mover a camera" : scenePreferences.toolMode === "measure" ? "Toque para medir no grid" : "Toque no token e arraste para reposicionar"}</div>
        </div>

        {measurementLabel ? (
          <div className="pointer-events-auto rounded-2xl border border-[rgba(245,158,11,0.35)] bg-[rgba(15,10,2,0.92)] px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-amber-200 backdrop-blur-md md:text-xs md:tracking-[0.16em]">
            <div className="flex items-center justify-between gap-4">
              <span>{measurementLabel}</span>
              <button onClick={() => { setMeasureStart(null); setMeasureEnd(null); }} className="text-amber-100 transition-colors hover:text-white" title="Limpar medicao">
                <X size={14} />
              </button>
            </div>
          </div>
        ) : null}

        <div className="pointer-events-auto hidden rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.9)] px-4 py-3 text-xs uppercase tracking-[0.16em] text-[var(--aq-text-muted)] backdrop-blur-md md:block">
          <div className="flex items-center gap-2 text-[var(--aq-accent)]">
            <Move size={14} />
            Navegacao
          </div>
          <div className="mt-2 leading-relaxed">Scroll faz zoom. Pan move a camera. Select move tokens. Dois dedos fazem pinch no mobile. Measure calcula alcance no grid atual.</div>
        </div>
      </div>
    </div>
  );
}
