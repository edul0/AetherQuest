"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Cinzel, Inter } from 'next/font/google';
import { Map, Plus } from 'lucide-react';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '600'] });

export default function SceneNav({ salaId, onSelectCena, cenaAtivaId }: any) {
  const [cenas, setCenas] = useState<any[]>([]);

  useEffect(() => {
    carregarCenas();
    
    const channel = supabase
      .channel('cenas_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'cenas', filter: `sala_id=eq.${salaId}` }, payload => {
        setCenas(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [salaId]);

  const carregarCenas = async () => {
    const { data } = await supabase.from('cenas').select('*').eq('sala_id', salaId);
    if (data && data.length > 0) {
      setCenas(data);
      if (!cenaAtivaId) onSelectCena(data[0]); 
    }
  };

  const criarNovaCena = async () => {
    const nome = prompt("Nome do novo local (ex: Quarto do Rei):");
    if (!nome) return;
    await supabase.from('cenas').insert([{ sala_id: salaId, nome: nome }]);
  };

  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-[#090e17]/90 backdrop-blur-md border-b border-[#1a2b4c]/60 flex items-center px-4 py-3 gap-4 overflow-x-auto shadow-lg">
      <div className={`${cinzel.className} text-[#4ad9d9] font-bold tracking-widest text-sm flex items-center gap-2 mr-4`}>
        <Map size={18} />
        LOCAIS
      </div>

      {cenas.map((cena) => (
        <button
          key={cena.id}
          onClick={() => onSelectCena(cena)}
          className={`${inter.className} whitespace-nowrap px-6 py-2 rounded-full text-xs font-semibold tracking-wider transition-all duration-300 ${
            cenaAtivaId === cena.id
              ? 'bg-[#4ad9d9]/20 text-[#4ad9d9] border border-[#4ad9d9]/50 shadow-[0_0_15px_rgba(74,217,217,0.2)]'
              : 'bg-transparent text-[#6b7b94] border border-transparent hover:text-[#f0ebd8] hover:bg-[#1a2b4c]/40'
          }`}
        >
          {cena.nome}
        </button>
      ))}

      <button 
        onClick={criarNovaCena}
        className="ml-auto bg-[#1a2b4c]/50 text-[#4ad9d9] p-2 rounded-full hover:bg-[#4ad9d9]/20 transition-colors border border-[#4ad9d9]/30 flex-shrink-0"
        title="Criar Novo Local"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
