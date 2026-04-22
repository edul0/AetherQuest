"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabase";
import { FichaVTTSnapshot } from "../types";

export function useTokenFichaSync(fichaIds: string[]): Record<string, FichaVTTSnapshot> {
  const [fichasMap, setFichasMap] = useState<Record<string, FichaVTTSnapshot>>({});
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const idsKey = useMemo(() => Array.from(new Set(fichaIds.filter(Boolean))).sort().join(","), [fichaIds]);
  const validIds = useMemo(() => (idsKey ? idsKey.split(",") : []), [idsKey]);

  useEffect(() => {
    if (validIds.length === 0) {
      setFichasMap({});
      return;
    }

    let active = true;

    const fetchFichas = async () => {
      const { data, error } = await supabase
        .from("fichas")
        .select("id, nome_personagem, sistema_preset, avatar_url, dados")
        .in("id", validIds);

      if (!active) return;

      if (error) {
        console.error("[useTokenFichaSync] Fetch error:", error);
        setFichasMap({});
        return;
      }

      const nextMap: Record<string, FichaVTTSnapshot> = {};
      (data ?? []).forEach((ficha) => {
        nextMap[ficha.id] = ficha as FichaVTTSnapshot;
      });
      setFichasMap(nextMap);
    };

    void fetchFichas();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    channelRef.current = supabase
      .channel(`fichas_vtt_sync_${idsKey.slice(0, 60)}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "fichas" },
        (payload) => {
          const updated = payload.new as FichaVTTSnapshot;
          if (!validIds.includes(updated.id)) return;
          setFichasMap((prev) => ({ ...prev, [updated.id]: updated }));
        },
      )
      .subscribe();

    return () => {
      active = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [idsKey, validIds]);

  return fichasMap;
}
