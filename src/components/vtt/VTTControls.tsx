"use client";

import React, { useEffect, useState } from "react";
import { Cinzel, Inter } from "next/font/google";
import { Map, Plus } from "lucide-react";
import { supabase } from "../../lib/supabase";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function SceneNav({ salaId, onSelectCena, cenaAtivaId }: any) {
  const [cenas, setCenas] = useState<any[]>([]);

  useEffect(() => {
    const carregarCenas = async () => {
      const { data } = await supabase.from("cenas").select("*").eq("sala_id", salaId);
      if (data && data.length > 0) {
        setCenas(data);
        if (!cenaAtivaId) {
          onSelectCena(data[0]);
        }
      } else {
        setCenas([]);
      }
    };

    carregarCenas();

    const channel = supabase
      .channel(`cenas_realtime_${salaId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cenas", filter: `sala_id=eq.${salaId}` },
        () => carregarCenas(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cenaAtivaId, onSelectCena, salaId]);

  const criarNovaCena = async () => {
    const nome = `Setor ${cenas.length + 1}`;
    await supabase.from("cenas").insert([{ sala_id: salaId, nome }]);
  };

  return (
    <div className="fixed left-0 top-0 z-50 flex w-full items-center gap-4 overflow-x-auto border-b border-[var(--aq-border-strong)] bg-[rgba(5,10,16,0.88)] px-4 py-3 shadow-lg backdrop-blur-md">
      <div className={`${cinzel.className} mr-2 flex items-center gap-2 text-sm font-bold tracking-[0.22em] text-[var(--aq-accent)]`}>
        <Map size={18} />
        LOCAIS
      </div>

      {cenas.map((cena) => (
        <button
          key={cena.id}
          onClick={() => onSelectCena(cena)}
          className={`${inter.className} whitespace-nowrap rounded-full px-5 py-2 text-xs font-semibold tracking-[0.18em] transition-all ${
            cenaAtivaId === cena.id
              ? "border border-[var(--aq-border-strong)] bg-[rgba(74,217,217,0.12)] text-[var(--aq-accent)] shadow-[0_0_15px_rgba(74,217,217,0.18)]"
              : "border border-transparent bg-transparent text-[var(--aq-text-muted)] hover:bg-[rgba(26,43,76,0.32)] hover:text-[var(--aq-title)]"
          }`}
        >
          {cena.nome}
        </button>
      ))}

      <button
        onClick={criarNovaCena}
        className="ml-auto shrink-0 rounded-full border border-[var(--aq-border-strong)] bg-[rgba(10,15,24,0.82)] p-2 text-[var(--aq-accent)] transition-colors hover:bg-[rgba(74,217,217,0.14)]"
        title="Criar Novo Local"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
