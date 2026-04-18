"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Circle,
  Line,
  Text as KonvaText,
  Rect,
  Group,
} from "react-konva";
import useImage from "use-image";
import { supabase } from "../../lib/supabase";
import { Token, FichaVTTSnapshot } from "../../lib/types";
import { useTokenFichaSync } from "../../lib/hooks/useTokenFichaSync";

const GRID_SIZE = 50;

// Paleta de cores: BOTW dark navy + teal (consistente com app/page.tsx)
const COLORS = {
  bg: "#050a14",
  grid: "#4ad9d9",
  selectionRing: "#4ad9d9",
  tokenLabel: "#c8dff0",
  hpHigh: "#22c55e",
  hpMid: "#f59e0b",
  hpLow: "#ef4444",
  hpBarBg: "#050a14",
  placeholderText: "#1e3a5f",
};

interface VTTCanvasProps {
  cenaId: string;
  mapaUrl?: string;
  /** ID do token atualmente selecionado. Controlado externamente pelo VTT page. */
  selectedTokenId: string | null;
  /** Chamado quando o usuário clica num token ou clica no fundo para deselecionar. */
  onSelectToken: (token: Token | null) => void;
  /** Expõe o mapa de fichas para o componente pai (TokenPanel usa isso). */
  onFichasMapChange?: (map: Record<string, FichaVTTSnapshot>) => void;
}

export default function VTTCanvas({
  cenaId,
  mapaUrl,
  selectedTokenId,
  onSelectToken,
  onFichasMapChange,
}: VTTCanvasProps) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [image] = useImage(mapaUrl || "");
  const [windowSize, setWindowSize] = useState({ w: 1000, h: 800 });

  // IDs das fichas vinculadas nesta cena (derivado dos tokens)
  const fichaIds = tokens
    .map((t) => t.ficha_id)
    .filter((id): id is string => Boolean(id));

  const fichasMap = useTokenFichaSync(fichaIds);

  // Propaga o mapa para o pai sempre que atualizar
  useEffect(() => {
    onFichasMapChange?.(fichasMap);
  }, [fichasMap, onFichasMapChange]);

  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!cenaId) return;
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
            setTokens((prev) =>
              prev.map((t) =>
                t.id === payload.new.id ? (payload.new as Token) : t
              )
            );
          } else if (payload.eventType === "INSERT") {
            setTokens((prev) => [...prev, payload.new as Token]);
          } else if (payload.eventType === "DELETE") {
            setTokens((prev) => prev.filter((t) => t.id !== payload.old.id));
            // Se o token deletado estava selecionado, deseleciona
            if (selectedTokenId === payload.old.id) onSelectToken(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cenaId]);

  const carregarDadosIniciais = async () => {
    const { data } = await supabase
      .from("tokens")
      .select("*")
      .eq("cena_id", cenaId);
    if (data) setTokens(data as Token[]);
  };

  const handleDragEnd = useCallback(
    async (id: string, e: any) => {
      const newX = Math.round(e.target.x() / GRID_SIZE) * GRID_SIZE;
      const newY = Math.round(e.target.y() / GRID_SIZE) * GRID_SIZE;
      setTokens((prev) =>
        prev.map((t) => (t.id === id ? { ...t, x: newX, y: newY } : t))
      );
      await supabase
        .from("tokens")
        .update({ x: newX, y: newY })
        .eq("id", id);
    },
    []
  );

  const handleTokenClick = useCallback(
    (token: Token, e: any) => {
      e.cancelBubble = true; // Impede que o clique propague para o Stage
      onSelectToken(selectedTokenId === token.id ? null : token);
    },
    [selectedTokenId, onSelectToken]
  );

  const handleStageClick = useCallback(() => {
    onSelectToken(null);
  }, [onSelectToken]);

  // ---- Grid ----
  const gridLines = [];
  const cols = Math.ceil(windowSize.w / GRID_SIZE) + 1;
  const rows = Math.ceil(windowSize.h / GRID_SIZE) + 1;
  for (let i = 0; i < cols; i++) {
    gridLines.push(
      <Line
        key={`v-${i}`}
        points={[i * GRID_SIZE, 0, i * GRID_SIZE, windowSize.h]}
        stroke={COLORS.grid}
        strokeWidth={0.5}
        opacity={0.1}
      />
    );
  }
  for (let j = 0; j < rows; j++) {
    gridLines.push(
      <Line
        key={`h-${j}`}
        points={[0, j * GRID_SIZE, windowSize.w, j * GRID_SIZE]}
        stroke={COLORS.grid}
        strokeWidth={0.5}
        opacity={0.1}
      />
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: COLORS.bg }}>
      <Stage
        width={windowSize.w}
        height={windowSize.h}
        draggable
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        <Layer>
          {/* Mapa de fundo */}
          {image ? (
            <KonvaImage
              image={image}
              width={image.naturalWidth}
              height={image.naturalHeight}
            />
          ) : (
            <KonvaText
              x={windowSize.w / 2 - 220}
              y={windowSize.h / 2 - 10}
              text="Sem mapa. Use os controles para fazer upload da cena."
              fontSize={13}
              fill={COLORS.placeholderText}
              fontFamily="monospace"
            />
          )}

          {/* Grade */}
          {gridLines}

          {/* Tokens */}
          {tokens.map((t) => {
            const isSelected = selectedTokenId === t.id;
            const ficha = t.ficha_id ? fichasMap[t.ficha_id] : null;
            const vida = ficha?.dados?.status?.vida;
            const hpRatio = vida
              ? Math.max(0, Math.min(1, vida.atual / (vida.max || 1)))
              : null;

            const hpColor =
              hpRatio === null
                ? COLORS.hpHigh
                : hpRatio > 0.5
                ? COLORS.hpHigh
                : hpRatio > 0.25
                ? COLORS.hpMid
                : COLORS.hpLow;

            const cx = t.x + GRID_SIZE / 2;
            const cy = t.y + GRID_SIZE / 2;
            const radius = GRID_SIZE * 0.42;
            const barW = GRID_SIZE * 0.92;
            const barH = 4;
            const barX = t.x + (GRID_SIZE - barW) / 2;
            const barY = t.y + GRID_SIZE + 5;

            return (
              <Group
                key={t.id}
                onClick={(e) => handleTokenClick(t, e)}
                onTap={(e) => handleTokenClick(t, e)}
              >
                {/* Anel de seleção pulsante */}
                {isSelected && (
                  <>
                    <Circle
                      x={cx}
                      y={cy}
                      radius={radius + 6}
                      stroke={COLORS.selectionRing}
                      strokeWidth={1.5}
                      dash={[6, 3]}
                      opacity={0.9}
                    />
                    <Circle
                      x={cx}
                      y={cy}
                      radius={radius + 10}
                      stroke={COLORS.selectionRing}
                      strokeWidth={0.5}
                      opacity={0.3}
                    />
                  </>
                )}

                {/* Corpo do token */}
                <Circle
                  x={cx}
                  y={cy}
                  radius={radius}
                  fill={t.cor || "#ef4444"}
                  draggable
                  onDragEnd={(e) => handleDragEnd(t.id, e)}
                  shadowBlur={isSelected ? 24 : 10}
                  shadowColor={isSelected ? COLORS.selectionRing : t.cor || "#ef4444"}
                  shadowOpacity={isSelected ? 0.7 : 0.4}
                />

                {/* Indicador de ficha vinculada (ícone de link no centro) */}
                {ficha && (
                  <KonvaText
                    x={cx - 5}
                    y={cy - 5}
                    text="⚡"
                    fontSize={10}
                    fill="rgba(255,255,255,0.6)"
                    listening={false}
                  />
                )}

                {/* Nome do token */}
                <KonvaText
                  x={t.x - 5}
                  y={cy + radius + 4}
                  width={GRID_SIZE + 10}
                  text={t.nome}
                  fontSize={9}
                  fill={COLORS.tokenLabel}
                  align="center"
                  fontFamily="monospace"
                  listening={false}
                />

                {/* Barra de HP — só aparece se há ficha vinculada */}
                {hpRatio !== null && (
                  <>
                    {/* Fundo da barra */}
                    <Rect
                      x={barX}
                      y={barY}
                      width={barW}
                      height={barH}
                      fill={COLORS.hpBarBg}
                      cornerRadius={2}
                      stroke="#1e3a5f"
                      strokeWidth={0.5}
                      listening={false}
                    />
                    {/* Preenchimento HP */}
                    <Rect
                      x={barX}
                      y={barY}
                      width={barW * hpRatio}
                      height={barH}
                      fill={hpColor}
                      cornerRadius={2}
                      listening={false}
                    />
                    {/* Texto HP */}
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
                )}
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
