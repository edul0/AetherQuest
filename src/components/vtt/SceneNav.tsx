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
    <div className="aq-vtt-strip fixed left-3 right-3 top-[60px] z-40 flex items-center gap-1 overflow-x-auto px-1.5 py-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.32)] lg:left-4 lg:right-auto lg:top-3 lg:max-w-[calc(100vw-760px)]">
      <div className="flex h-9 shrink-0 items-center gap-2 border-r border-white/10 px-2 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--aq-accent)]">
        <Map size={14} />
        <span className="hidden sm:inline">Locais</span>
      </div>

      <div className={`aq-scrollbar flex items-center gap-1 overflow-x-auto px-1 ${inter.className}`}>
        {cenas.map((cena) => (
          <button
            key={cena.id}
            onClick={() => onSelectCena(cena)}
            className={`aq-vtt-chip h-9 whitespace-nowrap px-3 py-0 ${
              cenaAtivaId === cena.id
                ? "border-[var(--aq-border-strong)] bg-[rgba(74,217,217,0.12)] text-[var(--aq-accent)] shadow-[0_0_15px_rgba(74,217,217,0.12)]"
                : ""
            }`}
          >
            {cena.nome}
          </button>
        ))}
      </div>

      <button
        onClick={criarNovaCena}
        className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.7rem] border border-[var(--aq-border)] bg-[rgba(10,15,24,0.78)] text-[var(--aq-accent)] transition-colors hover:border-[var(--aq-border-strong)] hover:bg-[rgba(74,217,217,0.12)]"
        title="Criar Novo Local"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
