"use client";

import React, { useEffect, useState } from "react";
import { Inter } from "next/font/google";
import { Map, Plus } from "lucide-react";
import { supabase } from "@/src/lib/supabase";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "800"] });

// 1. O Fim do "any": Tipagem estrita da Cena
export interface Cena {
  id: string;
  sala_id: string;
  nome: string;
  mapa_url?: string;
}

interface SceneNavProps {
  salaId: string;
  onSelectCena: (cena: Cena) => void;
  cenaAtivaId: string | null;
}

export default function SceneNav({ salaId, onSelectCena, cenaAtivaId }: SceneNavProps) {
  const [cenas, setCenas] = useState<Cena[]>([]);

  useEffect(() => {
    const carregarCenas = async () => {
      const { data, error } = await supabase.from("cenas").select("*").eq("sala_id", salaId).order('created_at', { ascending: true });
      
      if (error) {
        console.error("[SceneNav] Erro ao carregar cenas:", error);
        return;
      }

      if (data && data.length > 0) {
        setCenas(data as Cena[]);
        // Auto-seleciona a primeira cena se nenhuma estiver ativa
        if (!cenaAtivaId) {
          onSelectCena(data[0] as Cena);
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
    <div className={`fixed left-3 top-[142px] z-40 flex max-w-[calc(100vw-1.5rem)] items-center gap-2 overflow-x-auto aq-vtt-strip px-3 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)] md:left-4 md:top-4 md:max-w-[calc(100vw-720px)] md:px-4 ${inter.className}`}>
      
      {/* Label "Locais" - Estilo entalhe Sheikah */}
      <div className="flex shrink-0 items-center gap-2 border-r border-[var(--aq-border)] pr-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--aq-accent)] md:text-[11px]">
        <Map size={16} strokeWidth={1.5} />
        <span className="hidden sm:inline">Locais</span>
      </div>

      {/* Lista de Cenas - Usando aq-vtt-chip do globals.css */}
      <div className="aq-scrollbar flex items-center gap-1.5 overflow-x-auto px-1">
        {cenas.map((cena) => (
          <button
            key={cena.id}
            onClick={() => onSelectCena(cena)}
            data-active={cenaAtivaId === cena.id}
            className="aq-vtt-chip whitespace-nowrap"
          >
            {cena.nome}
          </button>
        ))}
      </div>

      {/* Botão de Nova Cena - Acento ancestral */}
      <button
        onClick={criarNovaCena}
        className="ml-1 shrink-0 rounded-[0.35rem] border border-[var(--aq-border)] bg-[rgba(3,8,14,0.6)] p-2 text-[var(--aq-text)] transition-all hover:border-[var(--aq-accent)] hover:bg-[var(--aq-accent-soft)] hover:text-[var(--aq-accent)] hover:shadow-[0_0_12px_var(--aq-accent-soft)]"
        title="Criar Novo Local"
      >
        <Plus size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
