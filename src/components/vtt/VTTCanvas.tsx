"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import { FichaVTTSnapshot, SceneViewPreferences, Token } from "@/src/lib/types";
import PhaserVTTCanvas from "./PhaserVTTCanvas";

interface VTTCanvasProps {
  cenaId: string;
  mapaUrl?: string;
  selectedTokenId: string | null;
  onSelectToken: (token: Token | null) => void;
  onFichasMapChange?: (map: Record<string, FichaVTTSnapshot>) => void;
  onTokensChange?: (tokens: Token[]) => void;
  scenePreferences: SceneViewPreferences;
}

export default function VTTCanvas(props: VTTCanvasProps) {
  const [liveMapUrl, setLiveMapUrl] = useState<string | undefined>(props.mapaUrl);

  useEffect(() => {
    setLiveMapUrl(props.mapaUrl);
  }, [props.mapaUrl]);

  useEffect(() => {
    let active = true;

    const loadSceneMap = async () => {
      const { data, error } = await supabase.from("cenas").select("mapa_url").eq("id", props.cenaId).maybeSingle();
      if (!active) return;
      if (error) {
        console.error("[VTTCanvas] erro ao sincronizar mapa da cena:", error.message);
        return;
      }
      setLiveMapUrl(data?.mapa_url ?? undefined);
    };

    void loadSceneMap();

    const channel = supabase
      .channel(`vtt_scene_map_${props.cenaId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cenas",
          filter: `id=eq.${props.cenaId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setLiveMapUrl(undefined);
            return;
          }
          const nextUrl = typeof payload.new?.mapa_url === "string" ? payload.new.mapa_url : undefined;
          setLiveMapUrl(nextUrl);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [props.cenaId]);

  return <PhaserVTTCanvas {...props} mapaUrl={liveMapUrl} />;
}
