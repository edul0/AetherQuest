"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Circle,
  Group,
  Image as KonvaImage,"use client";

import React, { useCallback, useEffect, useState } from "react";
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
import { supabase } from "../../lib/supabase";
import { FichaVTTSnapshot, Token } from "../../lib/types";
import { useTokenFichaSync } from "../../lib/hooks/useTokenFichaSync";

const GRID_SIZE = 50;

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

interface VTTCanvasProps {
  cenaId: string;
  mapaUrl?: string;
  selectedTokenId: string | null;
  onSelectToken: (token: Token | null) => void;
  onFichasMapChange?: (map: Record<string, FichaVTTSnapshot>) => void;
  onTokensChange?: (tokens: Token[]) => void;
}

export default function VTTCanvas({
  cenaId,
  mapaUrl,
  selectedTokenId,
  onSelectToken,
  onFichasMapChange,
  onTokensChange,
}: VTTCanvasProps) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [image] = useImage(mapaUrl || "");
  const [windowSize, setWindowSize] = useState({ w: 1000, h: 800 });

  const fichaIds = tokens.map((token) => token.ficha_id).filter((id): id is string => Boolean(id));
  const fichasMap = useTokenFichaSync(fichaIds);

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
        if (data) {
          setTokens(data as Token[]);
        }
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

  const handleDragEnd = useCallback(async (id: string, event: any) => {
    const newX = Math.round(event.target.x() / GRID_SIZE) * GRID_SIZE;
    const newY = Math.round(event.target.y() / GRID_SIZE) * GRID_SIZE;

    setTokens((prev) => prev.map((token) => (token.id === id ? { ...token, x: newX, y: newY } : token)));

    await supabase.from("tokens").update({ x: newX, y: newY }).eq("id", id);
  }, []);

  const handleTokenClick = useCallback(
    (token: Token, event: any) => {
      event.cancelBubble = true;
      onSelectToken(selectedTokenId === token.id ? null : token);
    },
    [onSelectToken, selectedTokenId],
  );

  const handleStageClick = useCallback(() => {
    onSelectToken(null);
  }, [onSelectToken]);

  const gridLines = [];
  const cols = Math.ceil(windowSize.w / GRID_SIZE) + 1;
  const rows = Math.ceil(windowSize.h / GRID_SIZE) + 1;

  for (let i = 0; i < cols; i += 1) {
    gridLines.push(
      <Line
        key={`v-${i}`}
        points={[i * GRID_SIZE, 0, i * GRID_SIZE, windowSize.h]}
        stroke={COLORS.grid}
        strokeWidth={0.5}
        opacity={0.1}
      />,
    );
  }

  for (let j = 0; j < rows; j += 1) {
    gridLines.push(
      <Line
        key={`h-${j}`}
        points={[0, j * GRID_SIZE, windowSize.w, j * GRID_SIZE]}
        stroke={COLORS.grid}
        strokeWidth={0.5}
        opacity={0.1}
      />,
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: COLORS.bg }}>
      <Stage width={windowSize.w} height={windowSize.h} draggable onClick={handleStageClick} onTap={handleStageClick}>
        <Layer>
          {image ? (
            <KonvaImage image={image} width={image.width || windowSize.w} height={image.height || windowSize.h} />
          ) : (
            <KonvaText
              x={windowSize.w / 2 - 220}
              y={windowSize.h / 2 - 10}
              text={canvasError || "Sem mapa. Use os controles para fazer upload da cena."}
              fontSize={13}
              fill={COLORS.placeholderText}
              fontFamily="monospace"
            />
          )}

          {gridLines}

          {tokens.map((token) => {
            const isSelected = selectedTokenId === token.id;
            const ficha = token.ficha_id ? fichasMap[token.ficha_id] : null;
            const vida = ficha?.dados?.status?.vida;
            const hpRatio = vida ? Math.max(0, Math.min(1, vida.atual / (vida.max || 1))) : null;
            const hpColor =
              hpRatio === null ? COLORS.hpHigh : hpRatio > 0.5 ? COLORS.hpHigh : hpRatio > 0.25 ? COLORS.hpMid : COLORS.hpLow;

            const cx = token.x + GRID_SIZE / 2;
            const cy = token.y + GRID_SIZE / 2;
            const radius = GRID_SIZE * 0.42;
            const barW = GRID_SIZE * 0.92;
            const barH = 4;
            const barX = token.x + (GRID_SIZE - barW) / 2;
            const barY = token.y + GRID_SIZE + 5;
            const isDead = (vida?.atual ?? 1) <= 0;

            return (
              <Group key={token.id} onClick={(event) => handleTokenClick(token, event)} onTap={(event) => handleTokenClick(token, event)}>
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
                  draggable
                  onDragEnd={(event) => handleDragEnd(token.id, event)}
                  shadowBlur={isSelected ? 24 : 10}
                  shadowColor={isSelected ? COLORS.selectionRing : token.cor || "#ef4444"}
                  shadowOpacity={isSelected ? 0.7 : 0.4}
                  opacity={isDead ? 0.65 : 1}
                />

                {ficha ? (
                  <KonvaText
                    x={cx - 5}
                    y={cy - 5}
                    text={isDead ? "X" : "+"}
                    fontSize={10}
                    fill="rgba(255,255,255,0.7)"
                    listening={false}
                  />
                ) : null}

                <KonvaText
                  x={token.x - 5}
                  y={cy + radius + 4}
                  width={GRID_SIZE + 10}
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
                    <Rect
                      x={barX}
                      y={barY}
                      width={barW * hpRatio}
                      height={barH}
                      fill={hpColor}
                      cornerRadius={2}
                      listening={false}
                    />
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
          })}
        </Layer>
      </Stage>
    </div>
  );
}

  Layer,
  Line,
  Rect,
  Stage,
  Text as KonvaText,
} from "react-konva";
import useImage from "use-image";
import { supabase } from "../../lib/supabase";
import { FichaVTTSnapshot, Token } from "../../lib/types";
import { useTokenFichaSync } from "../../lib/hooks/useTokenFichaSync";

const GRID_SIZE = 50;

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

interface VTTCanvasProps {
  cenaId: string;
  mapaUrl?: string;
  selectedTokenId: string | null;
  onSelectToken: (token: Token | null) => void;
  onFichasMapChange?: (map: Record<string, FichaVTTSnapshot>) => void;
  onTokensChange?: (tokens: Token[]) => void;
}

export default function VTTCanvas({
  cenaId,
  mapaUrl,
  selectedTokenId,
  onSelectToken,
  onFichasMapChange,
  onTokensChange,
}: VTTCanvasProps) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [image] = useImage(mapaUrl || "");
  const [windowSize, setWindowSize] = useState({ w: 1000, h: 800 });

  const fichaIds = tokens.map((token) => token.ficha_id).filter((id): id is string => Boolean(id));
  const fichasMap = useTokenFichaSync(fichaIds);

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
        if (data) {
          setTokens(data as Token[]);
        }
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

  const handleDragEnd = useCallback(async (id: string, event: any) => {
    const newX = Math.round(event.target.x() / GRID_SIZE) * GRID_SIZE;
    const newY = Math.round(event.target.y() / GRID_SIZE) * GRID_SIZE;

    setTokens((prev) => prev.map((token) => (token.id === id ? { ...token, x: newX, y: newY } : token)));

    await supabase.from("tokens").update({ x: newX, y: newY }).eq("id", id);
  }, []);

  const handleTokenClick = useCallback(
    (token: Token, event: any) => {
      event.cancelBubble = true;
      onSelectToken(selectedTokenId === token.id ? null : token);
    },
    [onSelectToken, selectedTokenId],
  );

  const handleStageClick = useCallback(() => {
    onSelectToken(null);
  }, [onSelectToken]);

  const gridLines = [];
  const cols = Math.ceil(windowSize.w / GRID_SIZE) + 1;
  const rows = Math.ceil(windowSize.h / GRID_SIZE) + 1;

  for (let i = 0; i < cols; i += 1) {
    gridLines.push(
      <Line
        key={`v-${i}`}
        points={[i * GRID_SIZE, 0, i * GRID_SIZE, windowSize.h]}
        stroke={COLORS.grid}
        strokeWidth={0.5}
        opacity={0.1}
      />,
    );
  }

  for (let j = 0; j < rows; j += 1) {
    gridLines.push(
      <Line
        key={`h-${j}`}
        points={[0, j * GRID_SIZE, windowSize.w, j * GRID_SIZE]}
        stroke={COLORS.grid}
        strokeWidth={0.5}
        opacity={0.1}
      />,
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: COLORS.bg }}>
      <Stage width={windowSize.w} height={windowSize.h} draggable onClick={handleStageClick} onTap={handleStageClick}>
        <Layer>
          {image ? (
            <KonvaImage image={image} width={image.width || windowSize.w} height={image.height || windowSize.h} />
          ) : (
            <KonvaText
              x={windowSize.w / 2 - 220}
              y={windowSize.h / 2 - 10}
              text={canvasError || "Sem mapa. Use os controles para fazer upload da cena."}
              fontSize={13}
              fill={COLORS.placeholderText}
              fontFamily="monospace"
            />
          )}

          {gridLines}

          {tokens.map((token) => {
            const isSelected = selectedTokenId === token.id;
            const ficha = token.ficha_id ? fichasMap[token.ficha_id] : null;
            const vida = ficha?.dados?.status?.vida;
            const hpRatio = vida ? Math.max(0, Math.min(1, vida.atual / (vida.max || 1))) : null;
            const hpColor =
              hpRatio === null ? COLORS.hpHigh : hpRatio > 0.5 ? COLORS.hpHigh : hpRatio > 0.25 ? COLORS.hpMid : COLORS.hpLow;

            const cx = token.x + GRID_SIZE / 2;
            const cy = token.y + GRID_SIZE / 2;
            const radius = GRID_SIZE * 0.42;
            const barW = GRID_SIZE * 0.92;
            const barH = 4;
            const barX = token.x + (GRID_SIZE - barW) / 2;
            const barY = token.y + GRID_SIZE + 5;
            const isDead = (vida?.atual ?? 1) <= 0;

            return (
              <Group key={token.id} onClick={(event) => handleTokenClick(token, event)} onTap={(event) => handleTokenClick(token, event)}>
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
                  draggable
                  onDragEnd={(event) => handleDragEnd(token.id, event)}
                  shadowBlur={isSelected ? 24 : 10}
                  shadowColor={isSelected ? COLORS.selectionRing : token.cor || "#ef4444"}
                  shadowOpacity={isSelected ? 0.7 : 0.4}
                  opacity={isDead ? 0.65 : 1}
                />

                {ficha ? (
                  <KonvaText
                    x={cx - 5}
                    y={cy - 5}
                    text={isDead ? "X" : "+"}
                    fontSize={10}
                    fill="rgba(255,255,255,0.7)"
                    listening={false}
                  />
                ) : null}

                <KonvaText
                  x={token.x - 5}
                  y={cy + radius + 4}
                  width={GRID_SIZE + 10}
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
                    <Rect
                      x={barX}
                      y={barY}
                      width={barW * hpRatio}
                      height={barH}
                      fill={hpColor}
                      cornerRadius={2}
                      listening={false}
                    />
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
          })}
        </Layer>
      </Stage>
    </div>
  );
}
