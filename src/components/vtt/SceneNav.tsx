"use client";

import React, { useEffect, useState } from "react";
import { Inter } from "next/font/google";
import { Map, Plus } from "lucide-react";
import { supabase } from "@/src/lib/supabase";

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
    <div className="fixed left-3 top-[72px] z-40 flex max-w-[calc(100vw-136px)] items-center gap-2 overflow-x-auto rounded-full border border-[var(--aq-border)] bg-[rgba(5,10,16,0.82)] px-2 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur-xl md:left-4 md:top-4 md:max-w-[calc(100vw-220px)] md:px-3">
      <div className="flex shrink-0 items-center gap-2 rounded-full border border-[rgba(74,217,217,0.14)] bg-[rgba(74,217,217,0.06)] px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--aq-accent)] md:text-[11px]">
        <Map size={14} />
        <span className="hidden sm:inline">Locais</span>
      </div>

      <div className={`aq-scrollbar flex items-center gap-1 overflow-x-auto ${inter.className}`}>
        {cenas.map((cena) => (
          <button
            key={cena.id}
            onClick={() => onSelectCena(cena)}
            className={`whitespace-nowrap rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition-all md:px-4 md:text-[11px] ${
              cenaAtivaId === cena.id
                ? "border border-[var(--aq-border-strong)] bg-[rgba(74,217,217,0.1)] text-[var(--aq-accent)] shadow-[0_0_15px_rgba(74,217,217,0.14)]"
                : "border border-transparent bg-transparent text-[var(--aq-text-muted)] hover:border-[rgba(74,217,217,0.1)] hover:bg-[rgba(26,43,76,0.22)] hover:text-[var(--aq-title)]"
            }`}
          >
            {cena.nome}
          </button>
        ))}
      </div>

      <button
        onClick={criarNovaCena}
        className="ml-1 shrink-0 rounded-full border border-[var(--aq-border)] bg-[rgba(10,15,24,0.78)] p-2 text-[var(--aq-accent)] transition-colors hover:border-[var(--aq-border-strong)] hover:bg-[rgba(74,217,217,0.12)]"
        title="Criar Novo Local"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
