"use client";

import { create } from "zustand";
import { SceneViewPreferences, Token, VTTToolMode } from "@/src/lib/types";

export type VTTCamera = {
  x: number;
  y: number;
  zoom: number;
};

export type VTTStoreToken = Token & {
  img_url?: string | null;
};

export type VTTGridState = Pick<SceneViewPreferences, "gridSize" | "gridOpacity" | "showGrid" | "snapToGrid">;

type VTTState = {
  tokens: VTTStoreToken[];
  camera: VTTCamera;
  grid: VTTGridState;
  toolMode: VTTToolMode;
  selectedTokenId: string | null;
  setTokens: (tokens: VTTStoreToken[]) => void;
  addToken: (token: VTTStoreToken) => void;
  patchToken: (id: string, patch: Partial<VTTStoreToken>) => void;
  moveToken: (id: string, x: number, y: number) => void;
  removeToken: (id: string) => void;
  setCamera: (camera: Partial<VTTCamera> | ((camera: VTTCamera) => VTTCamera)) => void;
  setGrid: (grid: Partial<VTTGridState>) => void;
  setToolMode: (toolMode: VTTToolMode) => void;
  hydrateSceneRuntime: (preferences: Partial<SceneViewPreferences>) => void;
  selectToken: (id: string | null) => void;
  resetRuntime: () => void;
};

export const DEFAULT_VTT_CAMERA: VTTCamera = { x: 0, y: 0, zoom: 1 };

export const DEFAULT_VTT_GRID: VTTGridState = {
  gridSize: 50,
  gridOpacity: 0.12,
  showGrid: true,
  snapToGrid: true,
};

export const useVTTStore = create<VTTState>((set) => ({
  tokens: [],
  camera: DEFAULT_VTT_CAMERA,
  grid: DEFAULT_VTT_GRID,
  toolMode: "select",
  selectedTokenId: null,
  setTokens: (tokens) => set({ tokens }),
  addToken: (token) => set((state) => ({ tokens: [...state.tokens.filter((entry) => entry.id !== token.id), token] })),
  patchToken: (id, patch) =>
    set((state) => ({
      tokens: state.tokens.map((token) => (token.id === id ? { ...token, ...patch } : token)),
    })),
  moveToken: (id, x, y) =>
    set((state) => ({
      tokens: state.tokens.map((token) => (token.id === id ? { ...token, x, y } : token)),
    })),
  removeToken: (id) => set((state) => ({ tokens: state.tokens.filter((token) => token.id !== id) })),
  setCamera: (camera) =>
    set((state) => ({
      camera: typeof camera === "function" ? camera(state.camera) : { ...state.camera, ...camera },
    })),
  setGrid: (grid) => set((state) => ({ grid: { ...state.grid, ...grid } })),
  setToolMode: (toolMode) => set({ toolMode }),
  hydrateSceneRuntime: (preferences) =>
    set((state) => ({
      grid: {
        ...state.grid,
        ...(typeof preferences.gridSize === "number" ? { gridSize: preferences.gridSize } : {}),
        ...(typeof preferences.gridOpacity === "number" ? { gridOpacity: preferences.gridOpacity } : {}),
        ...(typeof preferences.showGrid === "boolean" ? { showGrid: preferences.showGrid } : {}),
        ...(typeof preferences.snapToGrid === "boolean" ? { snapToGrid: preferences.snapToGrid } : {}),
      },
      toolMode: preferences.toolMode ?? state.toolMode,
    })),
  selectToken: (id) => set({ selectedTokenId: id }),
  resetRuntime: () =>
    set({
      tokens: [],
      camera: DEFAULT_VTT_CAMERA,
      grid: DEFAULT_VTT_GRID,
      toolMode: "select",
      selectedTokenId: null,
    }),
}));

export const selectVTTTokens = (state: VTTState) => state.tokens;
export const selectVTTCamera = (state: VTTState) => state.camera;
export const selectVTTGrid = (state: VTTState) => state.grid;
export const selectVTTToolMode = (state: VTTState) => state.toolMode;
export const selectVTTSelectedTokenId = (state: VTTState) => state.selectedTokenId;
export const selectVTTTokenCount = (state: VTTState) => state.tokens.length;
export const selectVTTGridSize = (state: VTTState) => state.grid.gridSize;
export const selectVTTGridOpacity = (state: VTTState) => state.grid.gridOpacity;
export const selectVTTShowGrid = (state: VTTState) => state.grid.showGrid;
export const selectVTTSnapToGrid = (state: VTTState) => state.grid.snapToGrid;

export const vttActions = {
  setTokens: () => useVTTStore.getState().setTokens,
  addToken: () => useVTTStore.getState().addToken,
  patchToken: () => useVTTStore.getState().patchToken,
  moveToken: () => useVTTStore.getState().moveToken,
  removeToken: () => useVTTStore.getState().removeToken,
  setCamera: () => useVTTStore.getState().setCamera,
  setGrid: () => useVTTStore.getState().setGrid,
  setToolMode: () => useVTTStore.getState().setToolMode,
  hydrateSceneRuntime: () => useVTTStore.getState().hydrateSceneRuntime,
  selectToken: () => useVTTStore.getState().selectToken,
  resetRuntime: () => useVTTStore.getState().resetRuntime,
};
