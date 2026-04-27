"use client";

import { useCallback, useEffect, useRef } from "react";
import { supabase, withFreshSession } from "@/src/lib/supabase";
import { MapItem } from "@/src/lib/types";

type Point = { x: number; y: number };

type ItemMoveBroadcast = {
  id: string;
  x: number;
  y: number;
  cenaId: string;
  clientId: string;
};

const BROADCAST_FRAME_MS = 33;

function createClientId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `aq-map-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export function useMapItemsSync(cenaId: string, handlers: {
  onLoad: (items: MapItem[]) => void;
  onInsert: (item: MapItem) => void;
  onUpdate: (item: MapItem) => void;
  onDelete: (id: string) => void;
  onMoveBroadcast: (payload: ItemMoveBroadcast) => void;
}) {
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const clientIdRef = useRef(createClientId());
  const throttleRef = useRef<{
    lastSentAt: number;
    pending: ItemMoveBroadcast | null;
    timer: ReturnType<typeof setTimeout> | null;
  }>({
    lastSentAt: 0,
    pending: null,
    timer: null,
  });

  const flushPendingMove = useCallback(() => {
    const channel = channelRef.current;
    const pending = throttleRef.current.pending;
    if (!channel || !pending) return;

    throttleRef.current.pending = null;
    throttleRef.current.lastSentAt = Date.now();
    void channel.send({
      type: "broadcast",
      event: "map_item_move",
      payload: pending,
    });
  }, []);

  const broadcastMove = useCallback(
    (itemId: string, point: Point) => {
      const channel = channelRef.current;
      if (!channel) return;

      const payload: ItemMoveBroadcast = {
        id: itemId,
        x: point.x,
        y: point.y,
        cenaId,
        clientId: clientIdRef.current,
      };

      const elapsed = Date.now() - throttleRef.current.lastSentAt;
      if (elapsed >= BROADCAST_FRAME_MS) {
        throttleRef.current.pending = null;
        throttleRef.current.lastSentAt = Date.now();
        void channel.send({
          type: "broadcast",
          event: "map_item_move",
          payload,
        });
        return;
      }

      throttleRef.current.pending = payload;
      if (throttleRef.current.timer) return;

      throttleRef.current.timer = setTimeout(() => {
        throttleRef.current.timer = null;
        flushPendingMove();
      }, Math.max(0, BROADCAST_FRAME_MS - elapsed));
    },
    [cenaId, flushPendingMove],
  );

  const persistMove = useCallback(
    async (itemId: string, point: Point) => {
      flushPendingMove();
      const { error } = await withFreshSession(() => supabase.from("map_items").update({ x: point.x, y: point.y }).eq("id", itemId));
      if (error) console.error("[useMapItemsSync] erro ao persistir item:", error);
    },
    [flushPendingMove],
  );

  useEffect(() => {
    let active = true;

    const loadItems = async () => {
      const { data, error } = await withFreshSession<MapItem[]>(() => supabase.from("map_items").select("*").eq("cena_id", cenaId).order("z_index"));
      if (!active) return;
      if (error) {
        console.error("[useMapItemsSync] erro ao carregar itens:", error);
        return;
      }
      handlers.onLoad((data ?? []) as MapItem[]);
    };

    void loadItems();

    const channel = supabase
      .channel(`map_items_sync_${cenaId}`, {
        config: {
          broadcast: { self: false },
        },
      })
      .on("broadcast", { event: "map_item_move" }, ({ payload }) => {
        const next = payload as ItemMoveBroadcast | null;
        if (!next || next.cenaId !== cenaId || next.clientId === clientIdRef.current) return;
        handlers.onMoveBroadcast(next);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "map_items", filter: `cena_id=eq.${cenaId}` }, (payload) => {
        handlers.onInsert(payload.new as MapItem);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "map_items", filter: `cena_id=eq.${cenaId}` }, (payload) => {
        handlers.onUpdate(payload.new as MapItem);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "map_items", filter: `cena_id=eq.${cenaId}` }, (payload) => {
        handlers.onDelete(payload.old.id);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      active = false;
      channelRef.current = null;
      if (throttleRef.current.timer) {
        clearTimeout(throttleRef.current.timer);
        throttleRef.current.timer = null;
      }
      throttleRef.current.pending = null;
      supabase.removeChannel(channel);
    };
  }, [cenaId, handlers]);

  return {
    broadcastMove,
    persistMove,
  };
}
