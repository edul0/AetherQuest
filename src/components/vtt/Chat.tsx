"use client";

import { useEffect, useState } from "react";
import { Dice5, MessageSquareText, Send } from "lucide-react";
import { supabase } from "@/src/lib/supabase";

function formatTimestamp(value?: string) {
  if (!value) {
    return "Agora";
  }

  try {
    return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "Agora";
  }
}

function rollDiceFormula(input: string) {
  const normalized = input.replace(/\s+/g, "").toLowerCase();
  if (!normalized) {
    return null;
  }

  const tokens = normalized.match(/[+-]?[^+-]+/g);
  if (!tokens) {
    return null;
  }

  let total = 0;
  const details: string[] = [];

  for (const token of tokens) {
    const sign = token.startsWith("-") ? -1 : 1;
    const raw = token.replace(/^[+-]/, "");

    if (raw.includes("d")) {
      const [countRaw, sidesRaw] = raw.split("d");
      const count = Number(countRaw || 1);
      const sides = Number(sidesRaw || 0);

      if (!count || !sides) {
        return null;
      }

      const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
      const subtotal = rolls.reduce((sum, value) => sum + value, 0) * sign;
      total += subtotal;
      details.push(`${sign < 0 ? "-" : "+"}${count}d${sides} [${rolls.join(", ")}]`);
      continue;
    }

    const value = Number(raw);
    if (Number.isNaN(value)) {
      return null;
    }

    total += value * sign;
    details.push(`${sign < 0 ? "-" : "+"}${value}`);
  }

  const summary = details.join(" ").replace(/^\+/, "");
  return { total, summary };
}

export default function Chat({ salaId }: { salaId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [manualMessage, setManualMessage] = useState("");
  const [diceFormula, setDiceFormula] = useState("1d20");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const carregarMensagens = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("sala_id", salaId)
        .order("id", { ascending: false })
        .limit(20);
      setMessages(data ?? []);
    };

    carregarMensagens();

    const channel = supabase
      .channel(`chat_rpg_${salaId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `sala_id=eq.${salaId}` },
        (payload) => {
          setMessages((prev) => [payload.new, ...prev].slice(0, 25));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salaId]);

  const publishMessage = async (content: string) => {
    const value = content.trim();
    if (!value) {
      return;
    }

    setSending(true);
    await supabase.from("messages").insert([{ content: value, sala_id: salaId }]);
    setSending(false);
  };

  const rollDice = async (dice: string) => {
    const result = rollDiceFormula(dice);
    if (!result) {
      alert("Formula invalida. Use exemplos como 1d20, 2d6+3 ou 1d8-1.");
      return;
    }

    await publishMessage(`Rolou ${dice}: ${result.total} (${result.summary})`);
  };

  const sendManualMessage = async () => {
    if (!manualMessage.trim()) {
      return;
    }

    await publishMessage(manualMessage);
    setManualMessage("");
  };

  return (
    <div className="fixed bottom-24 left-1/2 z-50 w-[calc(100vw-1rem)] max-w-[360px] -translate-x-1/2 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.9)] p-4 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-md md:bottom-24 md:left-4 md:w-[320px] md:translate-x-0">
      <div className="mb-3 flex items-center gap-2 text-[var(--aq-accent)]">
        <MessageSquareText size={16} />
        <span className="aq-kicker">Canal da Mesa</span>
      </div>

      <div className="mb-3 grid gap-2">
        <div className="flex gap-2">
          <input
            value={diceFormula}
            onChange={(event) => setDiceFormula(event.target.value)}
            placeholder="1d20, 2d6+3..."
            className="aq-input !rounded-xl !px-3 !py-2 text-sm"
          />
          <button onClick={() => rollDice(diceFormula)} className="aq-button-primary !px-3 !py-2" disabled={sending}>
            <Dice5 size={12} />
            Rolar
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {["d4", "d6", "d8", "d10", "d12", "d20"].map((dice) => (
            <button key={dice} onClick={() => rollDice(dice)} className="aq-button-secondary !px-3 !py-2">
              <Dice5 size={12} />
              {dice}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex gap-2">
        <input
          value={manualMessage}
          onChange={(event) => setManualMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              sendManualMessage();
            }
          }}
          placeholder="Anotacao, narracao ou resultado manual"
          className="aq-input !rounded-xl !px-3 !py-2 text-sm"
        />
        <button onClick={sendManualMessage} className="aq-button-primary !px-3 !py-2" disabled={sending}>
          <Send size={12} />
          Enviar
        </button>
      </div>

      <div className="aq-scrollbar max-h-48 space-y-2 overflow-y-auto pr-1 md:max-h-56">
        {messages.length === 0 ? (
          <div className="text-xs uppercase tracking-[0.22em] text-[var(--aq-text-muted)]">
            Sem mensagens ainda.
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={`${message.id ?? "msg"}-${index}`} className="rounded-xl border border-[var(--aq-border)] bg-[rgba(10,15,24,0.88)] px-3 py-2 text-sm text-[var(--aq-title)]">
              <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
              <div className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[var(--aq-text-muted)]">{formatTimestamp(message.created_at)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
