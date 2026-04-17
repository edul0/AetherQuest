"use client";
import { supabase } from '../../lib/supabase';
import { Upload, Dice5, Users, Map as MapIcon, Heart } from 'lucide-react';

export default function VTTControls({ salaId }: { salaId: string }) {
  
  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const path = `mapas/${salaId}-${Date.now()}.png`;
    const { data, error } = await supabase.storage.from('mapas').upload(path, file);

    if (data) {
      const { data: { publicUrl } } = supabase.storage.from('mapas').getPublicUrl(path);
      await supabase.from('salas').update({ mapa_url: publicUrl }).eq('id', salaId);
    }
  };

  const addToken = async () => {
    await supabase.from('tokens').insert([{
      sala_id: salaId,
      nome: 'Monstro',
      x: 0,
      y: 0,
      cor: '#ef4444' // Vermelho Monstro clássico
    }]);
  };

  return (
    <>
      {/* HUD Superior (Estilo Zelda Corações) */}
      <div className="fixed top-4 left-4 z-50 flex gap-1">
         <Heart fill="#ef4444" color="#7f1d1d" size={28} className="drop-shadow-[2px_2px_0_#000]" />
         <Heart fill="#ef4444" color="#7f1d1d" size={28} className="drop-shadow-[2px_2px_0_#000]" />
         <Heart fill="#ef4444" color="#7f1d1d" size={28} className="drop-shadow-[2px_2px_0_#000]" />
      </div>

      {/* Controles Inferiores (Estilo Inventário/Ação Boxy) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-50 bg-[#2a2d30] border-4 border-[#8b7355] p-2 shadow-[6px_6px_0_#000]">
        
        {/* Adicionar Inimigo/Token */}
        <button 
          onClick={addToken} 
          className="bg-[#b91c1c] border-2 border-[#7f1d1d] p-3 text-white hover:bg-[#ef4444] active:scale-95 transition"
          title="Adicionar Inimigo"
        >
          <Users size={28} className="drop-shadow-[2px_2px_0_#000]" />
        </button>

        {/* Upload de Mapa */}
        <label 
          className="bg-[#047857] border-2 border-[#064e3b] p-3 text-white hover:bg-[#10b981] active:scale-95 transition cursor-pointer"
          title="Trocar Mapa"
        >
          <MapIcon size={28} className="drop-shadow-[2px_2px_0_#000]" />
          <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
        </label>

        {/* Rolagem de Dado Clássica */}
        <button 
          onClick={() => alert("D20: " + (Math.floor(Math.random()*20)+1))} 
          className="bg-[#d97706] border-2 border-[#92400e] p-3 text-white hover:bg-[#f59e0b] active:scale-95 transition"
          title="Rolar D20"
        >
          <Dice5 size={28} className="drop-shadow-[2px_2px_0_#000]" />
        </button>
      </div>
    </>
  );
}
