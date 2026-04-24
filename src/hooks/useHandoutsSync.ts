"use client";

import { useEffect, useState } from "react";
import { supabase, withFreshSession } from "@/src/lib/supabase";
import { Handout } from "@/src/lib/types";

export function useHandoutsSync(salaId: string | null | undefined, cenaId: string | null | undefined) {
  const [handouts, setHandouts] = useState<Handout[]>([]);

  useEffect(() => {
    if (!salaId) {
      setHandouts([]);
      return;
    }

    let active = true;

    const loadHandouts = async () => {
      const query = supabase
        .from("handouts")
        .select("*")
        .eq("sala_id", salaId)
        .order("created_at", { ascending: false });

      const scopedQuery = cenaId ? query.or(`cena_id.is.null,cena_id.eq.${cenaId}`) : query;
      const { data, error } = await withFreshSession<Handout[]>(() => scopedQuery);

      if (!active) return;
      if (error) {
        console.error("[useHandoutsSync] erro ao carregar handouts:", error);
        return;
      }

      setHandouts((data ?? []) as Handout[]);
    };

    void loadHandouts();

    const channel = supabase
      .channel(`handouts_${salaId}_${cenaId ?? "all"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "handouts", filter: `sala_id=eq.${salaId}` }, () => void loadHandouts())
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [cenaId, salaId]);

  return handouts;
}
