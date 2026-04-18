"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabase";
import { FichaVTTSnapshot } from "../types";

/**
 * useTokenFichaSync
 *
 * Gerencia a assinatura Realtime das fichas vinculadas a tokens no mapa.
 *
 * RESPONSABILIDADE ÚNICA: escutar a tabela `fichas` e manter um Map
 * { ficha_id → FichaVTTSnapshot } atualizado em tempo real.
 *
 * Quando o jogador curar/tomar dano na aba da ficha, o UPDATE do Supabase
 * propaga aqui e o VTTCanvas recebe o novo HP sem nenhuma interação manual.
 *
 * @param fichaIds - Array de UUIDs das fichas vinculadas aos tokens da cena.
 * @returns Record<string, FichaVTTSnapshot> mapeando ficha_id → snapshot.
 */
export function useTokenFichaSync(
  fichaIds: string[]
): Record<string, FichaVTTSnapshot> {
  const [fichasMap, setFichasMap] = useState<Record<string, FichaVTTSnapshot>>(
    {}
  );
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  // Stable key para evitar re-subscribe desnecessário
  const idsKey = [...fichaIds].sort().join(",");

  useEffect(() => {
    const validIds = fichaIds.filter(Boolean);

    if (validIds.length === 0) {
      setFichasMap({});
      return;
    }

    // ---- 1. Fetch inicial ----
    const fetchFichas = async () => {
      const { data, error } = await supabase
        .from("fichas")
        .select("id, nome_personagem, sistema_preset, avatar_url, dados")
        .in("id", validIds);

      if (error) {
        console.error("[useTokenFichaSync] Fetch error:", error.message);
        return;
      }

      if (data) {
        const map: Record<string, FichaVTTSnapshot> = {};
        data.forEach((f) => {
          map[f.id] = f as FichaVTTSnapshot;
        });
        setFichasMap(map);
      }
    };

    fetchFichas();

    // ---- 2. Limpar canal antigo antes de criar novo ----
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // ---- 3. Assinar UPDATE na tabela fichas ----
    // Nota: O filtro de `in` não é suportado diretamente no Realtime —
    // filtramos client-side após receber o evento.
    channelRef.current = supabase
      .channel(`fichas_vtt_sync_${idsKey.slice(0, 60)}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "fichas" },
        (payload) => {
          const updated = payload.new as FichaVTTSnapshot;
          // Filtro client-side: só interessa se pertence a esta cena
          if (validIds.includes(updated.id)) {
            setFichasMap((prev) => ({
              ...prev,
              [updated.id]: updated,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return fichasMap;
}
