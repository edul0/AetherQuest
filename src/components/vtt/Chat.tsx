"use client";

import { useEffect, useState } from "react";
import { Dice5, MessageSquareText } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function Chat({ salaId }: { salaId: string }) {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const carregarMensagens = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("sala_id", salaId)
        .order("id", { ascending: false })
        .limit(10);
      setMessages(data ?? []);
    };

    carregarMensagens();

    const channel = supabase
      .channel(`chat_rpg_${salaId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `sala_id=eq.${salaId}` },
        (payload) => {
          setMessages((prev) => [payload.new, ...prev].slice(0, 12));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salaId]);

  const rollDice = async (dice: string) => {
    const sides = parseInt(dice.replace("d", ""), 10);
    const result = Math.floor(Math.random() * sides) + 1;
    await supabase.from("messages").insert([{ content: `Rolou ${dice}: ${result}`, sala_id: salaId }]);
  };

  return (
    <div className="fixed bottom-24 left-4 z-50 w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.88)] p-4 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-md">
      <div className="mb-3 flex items-center gap-2 text-[var(--aq-accent)]">
        <MessageSquareText size={16} />
        <span className="aq-kicker">Canal da Mesa</span>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {["d4", "d6", "d8", "d10", "d12", "d20"].map((dice) => (
          <button key={dice} onClick={() => rollDice(dice)} className="aq-button-secondary !px-3 !py-2">
            <Dice5 size={12} />
            {dice}
          </button>
        ))}
      </div>

      <div className="aq-scrollbar max-h-44 space-y-2 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="text-xs uppercase tracking-[0.22em] text-[var(--aq-text-muted)]">
            Sem mensagens ainda.
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={`${message.id ?? "msg"}-${index}`} className="rounded-xl border border-[var(--aq-border)] bg-[rgba(10,15,24,0.88)] px-3 py-2 text-sm text-[var(--aq-title)]">
              {message.content}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
