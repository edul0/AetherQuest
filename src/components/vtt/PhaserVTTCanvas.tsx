"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, RotateCcw, X } from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { FichaVTTSnapshot, SceneViewPreferences, Token } from "@/src/lib/types";
import { useTokenFichaSync } from "@/src/lib/hooks/useTokenFichaSync";

const COLORS = {
  bg: "#050a10",
  grid: "#4ad9d9",
  tokenLabel: "#f0ebd8",
  hpHigh: "#22c55e",
  hpMid: "#f59e0b",
  hpLow: "#ef4444",
  hpBarBg: "#0a0f18",
  placeholderText: "#6b7b94",
};

const DEFAULT_CAMERA = { x: 0, y: 0, zoom: 1 };

type PhaserModule = typeof import("phaser");
type Point = { x: number; y: number };
type CameraState = typeof DEFAULT_CAMERA;
type GestureState =
  | { type: "camera"; pointer: Point; camera: CameraState }
  | { type: "map"; pointer: Point; offset: Point }
  | { type: "token"; id: string; pointer: Point; start: Point; moved: boolean }
  | { type: "pinch"; center: Point; distance: number; camera: CameraState }
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

type SceneApi = {
  setState: (state: RenderState) => void;
  setTool: (toolMode: SceneViewPreferences["toolMode"]) => void;
  resetCamera: () => void;
  zoomBy: (factor: number) => void;
  destroy: () => void;
};

type RenderState = {
  tokens: Token[];
  fichasMap: Record<string, FichaVTTSnapshot>;
  selectedTokenId: string | null;
  mapaUrl?: string;
  preferences: SceneViewPreferences;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getTokenImage(ficha?: FichaVTTSnapshot | null) {
  return (
    ficha?.dados?.token_images?.portrait ||
    ficha?.dados?.token_images?.top ||
    ficha?.avatar_url ||
    ficha?.dados?.avatar_url ||
    ""
  );
}

function getInitials(token: Token, ficha?: FichaVTTSnapshot | null) {
  return (ficha?.nome_personagem || token.nome || "??").slice(0, 2).toUpperCase();
}

function hpColor(ratio: number) {
  if (ratio > 0.5) return COLORS.hpHigh;
  if (ratio > 0.25) return COLORS.hpMid;
  return COLORS.hpLow;
}

function screenDistance(a: Touch, b: Touch) {
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

function screenCenter(a: Touch, b: Touch, rect: DOMRect): Point {
  return {
    x: (a.clientX + b.clientX) / 2 - rect.left,
    y: (a.clientY + b.clientY) / 2 - rect.top,
  };
}

function tokenSizeForViewport(width: number) {
  return width < 768 ? 86 : 72;
}

function createPhaserScene(
  Phaser: PhaserModule,
  callbacks: {
    onSelectToken: (token: Token | null) => void;
    onMoveToken: (token: Token, point: Point) => void;
    onMapOffset: (point: Point) => void;
    onCamera: (camera: CameraState) => void;
  },
) {
  return class AetherQuestScene extends Phaser.Scene {
    private state: RenderState = {
      tokens: [],
      fichasMap: {},
      selectedTokenId: null,
      preferences: {
        gridSize: 50,
        gridOpacity: 0.12,
        showGrid: true,
        mapScale: 1,
        mapOffsetX: 0,
        mapOffsetY: 0,
        toolMode: "select",
        snapToGrid: true,
      },
    };

    private grid?: Phaser.GameObjects.Graphics;
    private tokenLayer?: Phaser.GameObjects.Container;
    private measurementLayer?: Phaser.GameObjects.Container;
    private tokenObjects = new Map<string, Phaser.GameObjects.Container>();
    private textureKeys = new Map<string, string>();
    private gesture: GestureState = null;
    private measurementStart: Point | null = null;
    private measurementEnd: Point | null = null;

    create() {
      this.cameras.main.setBackgroundColor("rgba(0,0,0,0)");
      this.grid = this.add.graphics();
      this.tokenLayer = this.add.container(0, 0);
      this.measurementLayer = this.add.container(0, 0);
      this.input.mouse?.disableContextMenu();

      this.input.on("pointerdown", this.handlePointerDown, this);
      this.input.on("pointermove", this.handlePointerMove, this);
      this.input.on("pointerup", this.handlePointerUp, this);
      this.input.on("pointerupoutside", this.handlePointerUp, this);
      this.input.on("wheel", this.handleWheel, this);
      this.scale.on("resize", this.handleResize, this);
    }

    public setState(next: RenderState) {
      this.state = next;
      this.renderGrid();
      this.renderTokens();
      this.renderMeasurement();
    }

    public setTool(toolMode: SceneViewPreferences["toolMode"]) {
      this.state = {
        ...this.state,
        preferences: { ...this.state.preferences, toolMode },
      };
    }

    public resetCamera() {
      this.cameras.main.setZoom(1);
      this.cameras.main.scrollX = 0;
      this.cameras.main.scrollY = 0;
      callbacks.onCamera(DEFAULT_CAMERA);
      callbacks.onMapOffset({ x: 0, y: 0 });
    }

    public zoomBy(factor: number) {
      const camera = this.cameras.main;
      const center = new Phaser.Math.Vector2(this.scale.width / 2, this.scale.height / 2);
      this.zoomAt(center, camera.zoom * factor);
    }

    private handleResize() {
      this.renderGrid();
      this.renderTokens();
    }

    private pointerToWorld(pointer: Phaser.Input.Pointer): Point {
      return {
        x: this.cameras.main.scrollX + pointer.x / this.cameras.main.zoom,
        y: this.cameras.main.scrollY + pointer.y / this.cameras.main.zoom,
      };
    }

    private snap(point: Point): Point {
      if (!this.state.preferences.snapToGrid) return point;
      const grid = this.state.preferences.gridSize;
      return {
        x: Math.round(point.x / grid) * grid,
        y: Math.round(point.y / grid) * grid,
      };
    }

    private getTokenAt(pointer: Phaser.Input.Pointer) {
      const world = this.pointerToWorld(pointer);
      const size = tokenSizeForViewport(this.scale.width) / this.cameras.main.zoom;
      return [...this.state.tokens].reverse().find((token) => {
        const cx = token.x + size / 2;
        const cy = token.y + size / 2;
        return Math.hypot(world.x - cx, world.y - cy) <= size * 0.62;
      });
    }

    private handlePointerDown(pointer: Phaser.Input.Pointer) {
      const event = pointer.event as PointerEvent | TouchEvent | undefined;
      const touches = "touches" in (event ?? {}) ? (event as TouchEvent).touches : null;
      if (touches && touches.length >= 2) {
        const rect = this.game.canvas.getBoundingClientRect();
        const center = screenCenter(touches[0], touches[1], rect);
        this.gesture = {
          type: "pinch",
          center,
          distance: screenDistance(touches[0], touches[1]),
          camera: this.getCameraState(),
        };
        event?.preventDefault();
        return;
      }

      const token = this.getTokenAt(pointer);
      if (token && this.state.preferences.toolMode === "select") {
        const world = this.pointerToWorld(pointer);
        this.gesture = {
          type: "token",
          id: token.id,
          pointer: world,
          start: { x: token.x, y: token.y },
          moved: false,
        };
        event?.preventDefault();
        return;
      }

      if (this.state.preferences.toolMode === "map") {
        this.gesture = {
          type: "map",
          pointer: { x: pointer.x, y: pointer.y },
          offset: {
            x: this.state.preferences.mapOffsetX,
            y: this.state.preferences.mapOffsetY,
          },
        };
        callbacks.onSelectToken(null);
        event?.preventDefault();
        return;
      }

      if (this.state.preferences.toolMode === "pan") {
        this.gesture = {
          type: "camera",
          pointer: { x: pointer.x, y: pointer.y },
          camera: this.getCameraState(),
        };
        callbacks.onSelectToken(null);
      }
    }

    private handlePointerMove(pointer: Phaser.Input.Pointer) {
      const event = pointer.event as PointerEvent | TouchEvent | undefined;
      const touches = "touches" in (event ?? {}) ? (event as TouchEvent).touches : null;

      if (touches && touches.length >= 2) {
        event?.preventDefault();
        const rect = this.game.canvas.getBoundingClientRect();
        const center = screenCenter(touches[0], touches[1], rect);
        const distance = screenDistance(touches[0], touches[1]);
        if (this.gesture?.type !== "pinch") {
          this.gesture = {
            type: "pinch",
            center,
            distance,
            camera: this.getCameraState(),
          };
          return;
        }

        const nextZoom = this.gesture.camera.zoom * (distance / this.gesture.distance);
        this.zoomAt(center, nextZoom, this.gesture.camera, this.gesture.center);
        return;
      }

      if (!this.gesture) {
        if (this.state.preferences.toolMode === "measure" && this.measurementStart) {
          this.measurementEnd = this.snap(this.pointerToWorld(pointer));
          this.renderMeasurement();
        }
        return;
      }

      if (this.gesture.type === "token") {
        const world = this.pointerToWorld(pointer);
        const dx = world.x - this.gesture.pointer.x;
        const dy = world.y - this.gesture.pointer.y;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) this.gesture.moved = true;
        const token = this.state.tokens.find((entry) => entry.id === this.gesture?.id);
        if (!token) return;
        const point = this.snap({ x: this.gesture.start.x + dx, y: this.gesture.start.y + dy });
        this.moveTokenVisual(token.id, point);
        event?.preventDefault();
        return;
      }

      if (this.gesture.type === "map") {
        callbacks.onMapOffset({
          x: Math.round(this.gesture.offset.x + (pointer.x - this.gesture.pointer.x) / this.cameras.main.zoom),
          y: Math.round(this.gesture.offset.y + (pointer.y - this.gesture.pointer.y) / this.cameras.main.zoom),
        });
        event?.preventDefault();
        return;
      }

      if (this.gesture.type === "camera") {
        const camera = this.cameras.main;
        camera.scrollX = this.gesture.camera.x - (pointer.x - this.gesture.pointer.x) / camera.zoom;
        camera.scrollY = this.gesture.camera.y - (pointer.y - this.gesture.pointer.y) / camera.zoom;
        callbacks.onCamera(this.getCameraState());
        this.renderGrid();
      }
    }

    private handlePointerUp(pointer: Phaser.Input.Pointer) {
      if (this.gesture?.type === "token") {
        const token = this.state.tokens.find((entry) => entry.id === this.gesture?.id);
        if (token) {
          const world = this.pointerToWorld(pointer);
          const dx = world.x - this.gesture.pointer.x;
          const dy = world.y - this.gesture.pointer.y;
          const point = this.snap({ x: this.gesture.start.x + dx, y: this.gesture.start.y + dy });
          if (this.gesture.moved) {
            callbacks.onMoveToken(token, point);
          } else {
            callbacks.onSelectToken(this.state.selectedTokenId === token.id ? null : token);
          }
        }
      } else if (!this.gesture && this.state.preferences.toolMode === "measure") {
        const point = this.snap(this.pointerToWorld(pointer));
        if (!this.measurementStart) {
          this.measurementStart = point;
          this.measurementEnd = point;
        } else {
          this.measurementEnd = point;
        }
        this.renderMeasurement();
      } else if (!this.gesture && this.state.preferences.toolMode === "select") {
        callbacks.onSelectToken(null);
      }

      this.gesture = null;
    }

    private handleWheel(pointer: Phaser.Input.Pointer, _objects: unknown, _dx: number, dy: number) {
      const factor = dy > 0 ? 0.9 : 1.1;
      this.zoomAt({ x: pointer.x, y: pointer.y }, this.cameras.main.zoom * factor);
    }

    private zoomAt(screenPoint: Point, targetZoom: number, baseCamera?: CameraState, baseScreenPoint?: Point) {
      const camera = this.cameras.main;
      const source = baseCamera ?? this.getCameraState();
      const anchor = baseScreenPoint ?? screenPoint;
      const nextZoom = clamp(targetZoom, 0.35, 3.2);
      const worldX = source.x + anchor.x / source.zoom;
      const worldY = source.y + anchor.y / source.zoom;

      camera.setZoom(nextZoom);
      camera.scrollX = worldX - screenPoint.x / nextZoom;
      camera.scrollY = worldY - screenPoint.y / nextZoom;
      callbacks.onCamera(this.getCameraState());
      this.renderGrid();
    }

    private getCameraState(): CameraState {
      const camera = this.cameras.main;
      return {
        x: camera.scrollX,
        y: camera.scrollY,
        zoom: camera.zoom,
      };
    }

    private renderGrid() {
      if (!this.grid) return;
      this.grid.clear();
      if (!this.state.preferences.showGrid) return;

      const camera = this.cameras.main;
      const gridSize = this.state.preferences.gridSize;
      const left = camera.scrollX - gridSize * 2;
      const right = camera.scrollX + this.scale.width / camera.zoom + gridSize * 2;
      const top = camera.scrollY - gridSize * 2;
      const bottom = camera.scrollY + this.scale.height / camera.zoom + gridSize * 2;

      this.grid.lineStyle(1 / camera.zoom, Phaser.Display.Color.HexStringToColor(COLORS.grid).color, this.state.preferences.gridOpacity);
      for (let x = Math.floor(left / gridSize) * gridSize; x <= right; x += gridSize) {
        this.grid.lineBetween(x, top, x, bottom);
      }
      for (let y = Math.floor(top / gridSize) * gridSize; y <= bottom; y += gridSize) {
        this.grid.lineBetween(left, y, right, y);
      }
    }

    private renderTokens() {
      if (!this.tokenLayer) return;
      const existing = new Set(this.state.tokens.map((token) => token.id));
      for (const [id, object] of this.tokenObjects) {
        if (!existing.has(id)) {
          object.destroy();
          this.tokenObjects.delete(id);
        }
      }

      this.state.tokens.forEach((token) => {
        let container = this.tokenObjects.get(token.id);
        if (!container) {
          container = this.add.container(token.x, token.y).setDepth(20);
          this.tokenLayer?.add(container);
          this.tokenObjects.set(token.id, container);
        }
        this.drawToken(container, token);
      });
    }

    private drawToken(container: Phaser.GameObjects.Container, token: Token) {
      const ficha = token.ficha_id ? this.state.fichasMap[token.ficha_id] : null;
      const size = tokenSizeForViewport(this.scale.width);
      const radius = size * 0.42;
      const selected = this.state.selectedTokenId === token.id;
      const imageUrl = getTokenImage(ficha);
      container.setPosition(token.x, token.y);
      container.removeAll(true);

      if (selected) {
        container.add(this.add.circle(size / 2, size / 2, radius + 8, 0x4ad9d9, 0.14).setStrokeStyle(2, 0x4ad9d9, 0.9));
      }

      container.add(this.add.circle(size / 2, size / 2, radius, Phaser.Display.Color.HexStringToColor(token.cor || "#ef4444").color, 0.95));

      if (imageUrl) {
        const key = this.textureKeys.get(imageUrl) ?? `token-${btoa(imageUrl).replace(/[^a-zA-Z0-9]/g, "").slice(0, 32)}`;
        this.textureKeys.set(imageUrl, key);
        if (this.textures.exists(key)) {
          const image = this.add.image(size / 2, size / 2, key).setDisplaySize(radius * 1.8, radius * 1.8).setAlpha(0.96);
          container.add(image);
        } else {
          this.load.image(key, imageUrl);
          this.load.once(Phaser.Loader.Events.COMPLETE, () => this.renderTokens());
          this.load.start();
          container.add(this.add.text(size / 2, size / 2 - 8, getInitials(token, ficha), { color: "#ffffff", fontSize: "16px", fontStyle: "700" }).setOrigin(0.5));
        }
      } else {
        container.add(this.add.text(size / 2, size / 2 - 8, getInitials(token, ficha), { color: "#ffffff", fontSize: "16px", fontStyle: "700" }).setOrigin(0.5));
      }

      container.add(this.add.text(size / 2, size + 3, token.nome, { color: COLORS.tokenLabel, fontSize: "10px", fontFamily: "monospace" }).setOrigin(0.5, 0));

      const vida = ficha?.dados?.status?.vida;
      if (vida?.max) {
        const ratio = clamp(vida.atual / vida.max, 0, 1);
        const barWidth = size * 0.92;
        container.add(this.add.rectangle(size / 2, size + 19, barWidth, 5, Phaser.Display.Color.HexStringToColor(COLORS.hpBarBg).color).setOrigin(0.5, 0.5));
        container.add(this.add.rectangle(size / 2 - barWidth / 2, size + 19, barWidth * ratio, 5, Phaser.Display.Color.HexStringToColor(hpColor(ratio)).color).setOrigin(0, 0.5));
      }
    }

    private moveTokenVisual(id: string, point: Point) {
      const object = this.tokenObjects.get(id);
      object?.setPosition(point.x, point.y);
    }

    private renderMeasurement() {
      if (!this.measurementLayer) return;
      this.measurementLayer.removeAll(true);
      if (!this.measurementStart || !this.measurementEnd) return;

      const camera = this.cameras.main;
      const start = this.measurementStart;
      const end = this.measurementEnd;
      const distance = Math.hypot(end.x - start.x, end.y - start.y);
      const cells = distance / this.state.preferences.gridSize;
      const label = `${cells.toFixed(1)} qd - ${(cells * 1.5).toFixed(1)} m`;
      const line = this.add.line(0, 0, start.x, start.y, end.x, end.y, 0xf59e0b, 1).setOrigin(0, 0).setLineWidth(3 / camera.zoom);
      const text = this.add.text((start.x + end.x) / 2, (start.y + end.y) / 2 - 24 / camera.zoom, label, {
        color: "#f8fafc",
        fontFamily: "monospace",
        fontSize: `${12 / camera.zoom}px`,
        backgroundColor: "rgba(5,10,16,0.85)",
        padding: { x: 6, y: 4 },
      }).setOrigin(0.5);
      this.measurementLayer.add([line, text]);
    }
  };
}

export default function PhaserVTTCanvas({
  cenaId,
  mapaUrl,
  selectedTokenId,
  onSelectToken,
  onFichasMapChange,
  onTokensChange,
  scenePreferences,
}: VTTCanvasProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<any>(null);
  const sceneApiRef = useRef<SceneApi | null>(null);
  const stateRef = useRef<RenderState>({
    tokens: [],
    fichasMap: {},
    selectedTokenId,
    mapaUrl,
    preferences: scenePreferences,
  });
  const [tokens, setTokens] = useState<Token[]>([]);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [camera, setCamera] = useState(DEFAULT_CAMERA);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [mapSize, setMapSize] = useState<{ width: number; height: number } | null>(null);

  const fichaIds = tokens.map((token) => token.ficha_id).filter((id): id is string => Boolean(id));
  const fichasMap = useTokenFichaSync(fichaIds);

  const updateSceneState = useCallback((patch: Partial<RenderState>) => {
    stateRef.current = { ...stateRef.current, ...patch };
    sceneApiRef.current?.setState(stateRef.current);
  }, []);

  useEffect(() => {
    const updateSize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (!mapaUrl) {
      setMapSize(null);
      return;
    }

    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      setMapSize({ width: image.naturalWidth || image.width || 1, height: image.naturalHeight || image.height || 1 });
    };
    image.onerror = () => {
      if (cancelled) return;
      console.error("[PhaserVTTCanvas] Falha ao carregar mapa DOM:", mapaUrl);
      setMapSize(null);
    };
    image.src = mapaUrl;

    return () => {
      cancelled = true;
    };
  }, [mapaUrl]);

  const mapFrame = useMemo(() => {
    if (!mapaUrl || !mapSize || !windowSize.width || !windowSize.height) return null;

    const baseScale = Math.max(windowSize.width / mapSize.width, windowSize.height / mapSize.height);
    const mapScale = baseScale * scenePreferences.mapScale;
    const displayWidth = mapSize.width * mapScale;
    const displayHeight = mapSize.height * mapScale;
    const worldX = (windowSize.width - displayWidth) / 2 + scenePreferences.mapOffsetX;
    const worldY = (windowSize.height - displayHeight) / 2 + scenePreferences.mapOffsetY;

    return {
      x: (worldX - camera.x) * camera.zoom,
      y: (worldY - camera.y) * camera.zoom,
      width: displayWidth * camera.zoom,
      height: displayHeight * camera.zoom,
    };
  }, [camera.x, camera.y, camera.zoom, mapaUrl, mapSize, scenePreferences.mapOffsetX, scenePreferences.mapOffsetY, scenePreferences.mapScale, windowSize.height, windowSize.width]);

  useEffect(() => {
    onFichasMapChange?.(fichasMap);
    updateSceneState({ fichasMap });
  }, [fichasMap, onFichasMapChange, updateSceneState]);

  useEffect(() => {
    onTokensChange?.(tokens);
    updateSceneState({ tokens });
  }, [onTokensChange, tokens, updateSceneState]);

  useEffect(() => {
    updateSceneState({ selectedTokenId, mapaUrl, preferences: scenePreferences });
    sceneApiRef.current?.setTool(scenePreferences.toolMode);
  }, [mapaUrl, scenePreferences, selectedTokenId, updateSceneState]);

  useEffect(() => {
    let destroyed = false;

    const boot = async () => {
      if (!parentRef.current || gameRef.current) return;
      const Phaser = await import("phaser");
      if (destroyed || !parentRef.current) return;

      const SceneClass = createPhaserScene(Phaser, {
        onSelectToken,
        onMoveToken: async (token, point) => {
          const next = { ...token, x: point.x, y: point.y };
          setTokens((current) => current.map((entry) => (entry.id === token.id ? next : entry)));
          await supabase.from("tokens").update({ x: point.x, y: point.y }).eq("id", token.id);
        },
        onMapOffset: (point) => {
          window.dispatchEvent(new CustomEvent("aq-map-offset", { detail: point }));
        },
        onCamera: setCamera,
      });

      const game = new Phaser.Game({
        type: Phaser.WEBGL,
        parent: parentRef.current,
        backgroundColor: "rgba(0,0,0,0)",
        width: window.innerWidth,
        height: window.innerHeight,
        scene: SceneClass,
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        input: {
          activePointers: 3,
        },
        render: {
          antialias: true,
          pixelArt: false,
          transparent: true,
        },
      });

      gameRef.current = game;
      window.setTimeout(() => {
        const activeScene = game.scene.scenes[0] as unknown as SceneApi | undefined;
        if (!activeScene) return;
        sceneApiRef.current = activeScene;
        activeScene.setState(stateRef.current);
      }, 0);
    };

    void boot();

    return () => {
      destroyed = true;
      sceneApiRef.current = null;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, [onSelectToken]);

  useEffect(() => {
    if (!cenaId) return;

    const carregarDadosIniciais = async () => {
      try {
        const { data, error } = await supabase.from("tokens").select("*").eq("cena_id", cenaId);
        if (error) throw error;
        setCanvasError(null);
        setTokens((data ?? []) as Token[]);
      } catch (error: any) {
        console.error("[PhaserVTTCanvas] erro ao carregar tokens:", error?.message ?? error);
        setCanvasError("Nao foi possivel carregar os tokens desta cena.");
      }
    };

    void carregarDadosIniciais();

    const channel = supabase
      .channel(`phaser_vtt_canvas_${cenaId}`)
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
            setTokens((prev) => [...prev.filter((token) => token.id !== payload.new.id), payload.new as Token]);
          } else if (payload.eventType === "DELETE") {
            setTokens((prev) => prev.filter((token) => token.id !== payload.old.id));
            if (selectedTokenId === payload.old.id) onSelectToken(null);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cenaId, onSelectToken, selectedTokenId]);

  const hudInstruction = useMemo(() => {
    if (scenePreferences.toolMode === "pan") return "Arraste a camera";
    if (scenePreferences.toolMode === "measure") return "Toque para medir";
    if (scenePreferences.toolMode === "map") return "Arraste apenas o mapa";
    return "Arraste tokens. Dois dedos movem/zoomam a camera.";
  }, [scenePreferences.toolMode]);

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: COLORS.bg }}>
      {mapaUrl && mapFrame ? (
        <img
          src={mapaUrl}
          alt="Mapa da cena"
          draggable={false}
          className="pointer-events-none absolute left-0 top-0 max-w-none select-none"
          style={{
            zIndex: 1,
            width: `${mapFrame.width}px`,
            height: `${mapFrame.height}px`,
            transform: `translate3d(${mapFrame.x}px, ${mapFrame.y}px, 0)`,
            transformOrigin: "top left",
            opacity: 0.96,
          }}
        />
      ) : null}

      <div ref={parentRef} className="absolute inset-0 z-10 h-full w-full touch-none" />

      {canvasError ? (
        <div className="pointer-events-none fixed left-1/2 top-1/2 z-40 max-w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-center text-sm text-red-100 backdrop-blur-xl">
          {canvasError}
        </div>
      ) : null}

      <div className="pointer-events-none fixed left-1/2 top-[82px] z-50 flex w-[calc(100vw-0.75rem)] max-w-[560px] -translate-x-1/2 flex-col gap-2 md:top-[18px] md:w-auto md:min-w-[500px]">
        <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-[26px] border border-[var(--aq-border)] bg-[rgba(5,10,16,0.86)] px-3 py-2.5 shadow-[0_14px_34px_rgba(0,0,0,0.3)] backdrop-blur-xl md:rounded-full md:px-4 md:py-2">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => sceneApiRef.current?.zoomBy(1.12)}
              className="rounded-full border border-[var(--aq-border)] bg-[rgba(10,15,24,0.9)] p-3 text-[var(--aq-title)] transition-all hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)] md:p-2.5"
              title="Aproximar"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={() => sceneApiRef.current?.zoomBy(0.88)}
              className="rounded-full border border-[var(--aq-border)] bg-[rgba(10,15,24,0.9)] p-3 text-[var(--aq-title)] transition-all hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)] md:p-2.5"
              title="Afastar"
            >
              <Minus size={18} />
            </button>
            <button
              onClick={() => sceneApiRef.current?.resetCamera()}
              className="rounded-full border border-[var(--aq-border)] bg-[rgba(10,15,24,0.9)] p-3 text-[var(--aq-title)] transition-all hover:border-[var(--aq-border-strong)] hover:text-[var(--aq-accent)] md:p-2.5"
              title="Recentralizar mapa"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          <div className="min-w-0 text-right">
            <div className="truncate text-[11px] font-black uppercase tracking-[0.18em] text-[var(--aq-title)] md:text-xs">
              {`Zoom ${Math.round(camera.zoom * 100)}%`}
            </div>
            <div className="mt-1 line-clamp-2 text-right text-[9px] uppercase leading-relaxed tracking-[0.14em] text-[var(--aq-text-muted)] md:truncate md:text-[10px]">
              {hudInstruction}
            </div>
          </div>
        </div>

        {scenePreferences.toolMode === "measure" ? (
          <button
            className="pointer-events-auto rounded-2xl border border-[rgba(245,158,11,0.35)] bg-[rgba(15,10,2,0.9)] px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-amber-200 backdrop-blur-md md:text-xs md:tracking-[0.16em]"
            onClick={() => sceneApiRef.current?.setTool("measure")}
          >
            <div className="flex items-center justify-between gap-4">
              <span>Medicao Phaser ativa</span>
              <X size={14} />
            </div>
          </button>
        ) : null}
      </div>
    </div>
  );
}
