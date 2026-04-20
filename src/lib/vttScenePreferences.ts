import { SceneViewPreferences } from "./types";

const STORAGE_PREFIX = "aq:scene-view:";

export const DEFAULT_SCENE_VIEW_PREFERENCES: SceneViewPreferences = {
  gridSize: 50,
  gridOpacity: 0.12,
  showGrid: true,
  mapScale: 1,
  mapOffsetX: 0,
  mapOffsetY: 0,
  toolMode: "select",
  snapToGrid: true,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeScenePreferences(input?: Partial<SceneViewPreferences>): SceneViewPreferences {
  return {
    gridSize: clamp(Number(input?.gridSize ?? DEFAULT_SCENE_VIEW_PREFERENCES.gridSize), 20, 200),
    gridOpacity: clamp(Number(input?.gridOpacity ?? DEFAULT_SCENE_VIEW_PREFERENCES.gridOpacity), 0, 0.8),
    showGrid: input?.showGrid ?? DEFAULT_SCENE_VIEW_PREFERENCES.showGrid,
    mapScale: clamp(Number(input?.mapScale ?? DEFAULT_SCENE_VIEW_PREFERENCES.mapScale), 0.2, 4),
    mapOffsetX: Number(input?.mapOffsetX ?? DEFAULT_SCENE_VIEW_PREFERENCES.mapOffsetX),
    mapOffsetY: Number(input?.mapOffsetY ?? DEFAULT_SCENE_VIEW_PREFERENCES.mapOffsetY),
    toolMode: input?.toolMode ?? DEFAULT_SCENE_VIEW_PREFERENCES.toolMode,
    snapToGrid: input?.snapToGrid ?? DEFAULT_SCENE_VIEW_PREFERENCES.snapToGrid,
  };
}

export function loadScenePreferences(sceneId?: string | null): SceneViewPreferences {
  if (!sceneId || typeof window === "undefined") {
    return DEFAULT_SCENE_VIEW_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${sceneId}`);
    if (!raw) {
      return DEFAULT_SCENE_VIEW_PREFERENCES;
    }

    return normalizeScenePreferences(JSON.parse(raw));
  } catch (error) {
    console.error("[vttScenePreferences] failed to load scene preferences", error);
    return DEFAULT_SCENE_VIEW_PREFERENCES;
  }
}

export function saveScenePreferences(sceneId: string | null | undefined, preferences: SceneViewPreferences) {
  if (!sceneId || typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${sceneId}`, JSON.stringify(normalizeScenePreferences(preferences)));
  } catch (error) {
    console.error("[vttScenePreferences] failed to save scene preferences", error);
  }
}
