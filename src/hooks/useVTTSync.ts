"use client";

import { useCallback, useEffect, useRef } from "react";
import { supabase, withFreshSession } from "@/src/lib/supabase";
import { Token } from "@/src/lib/types";
import { useVTTStore } from "@/src/store/useVTTStore";

type Point = { x: number; y: number };

type TokenMoveBroadcast = {
  id: string;
  x: number;
  y: number;
  cenaId: string;
  clientId: string;
  timestamp: number;
};

const BROADCAST_FRAME_MS = 33;

function createClientId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `aq-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export function useVTTSync(cenaId: string) {
  const setTokens = useVTTStore((state) => state.setTokens);
  const addToken = useVTTStore((state) => state.addToken);
  const patchToken = useVTTStore((state) => state.patchToken);
  const moveToken = useVTTStore((state) => state.moveToken);
  const removeToken = useVTTStore((state) => state.removeToken);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const clientIdRef = useRef(createClientId());
  const throttleRef = useRef<{
    lastSentAt: number;
    pending: TokenMoveBroadcast | null;
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
      event: "token_move",
      payload: pending,
    });
  }, []);

  const broadcastTokenMove = useCallback(
    (tokenId: string, point: Point) => {
      const channel = channelRef.current;
      if (!channel) return;

      const payload: TokenMoveBroadcast = {
        id: tokenId,
        x: point.x,
        y: point.y,
        cenaId,
        clientId: clientIdRef.current,
        timestamp: Date.now(),
      };

      const elapsed = Date.now() - throttleRef.current.lastSentAt;
      if (elapsed >= BROADCAST_FRAME_MS) {
        throttleRef.current.pending = null;
        throttleRef.current.lastSentAt = Date.now();
        void channel.send({
          type: "broadcast",
          event: "token_move",
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

  const persistTokenMove = useCallback(
    async (tokenId: string, point: Point) => {
      flushPendingMove();
      const { error } = await withFreshSession(() => supabase.from("tokens").update({ x: point.x, y: point.y }).eq("id", tokenId));
      if (error) console.error("[useVTTSync] erro ao persistir token:", error);
    },
    [flushPendingMove],
  );

  useEffect(() => {
    let active = true;

    const loadTokens = async () => {
      const { data, error } = await withFreshSession<Token[]>(() => supabase.from("tokens").select("*").eq("cena_id", cenaId));
      if (!active) return;
      if (error) {
        console.error("[useVTTSync] erro ao carregar tokens:", error);
        return;
      }
      setTokens((data ?? []) as Token[]);
    };

    void loadTokens();

    const channel = supabase
      .channel(`vtt_scene_sync_${cenaId}`, {
        config: {
          broadcast: { self: false },
        },
      })
      .on("broadcast", { event: "token_move" }, ({ payload }) => {
        const next = payload as TokenMoveBroadcast | null;
        if (!next || next.cenaId !== cenaId || next.clientId === clientIdRef.current) return;
        moveToken(next.id, next.x, next.y);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tokens", filter: `cena_id=eq.${cenaId}` }, (payload) => {
        addToken(payload.new as Token);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tokens", filter: `cena_id=eq.${cenaId}` }, (payload) => {
        patchToken(payload.new.id, payload.new as Token);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "tokens", filter: `cena_id=eq.${cenaId}` }, (payload) => {
        removeToken(payload.old.id);
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
  }, [addToken, cenaId, moveToken, patchToken, removeToken, setTokens]);

  return {
    broadcastTokenMove,
    persistTokenMove,
  };
}
