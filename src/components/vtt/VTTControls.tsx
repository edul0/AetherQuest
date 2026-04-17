"use client";
import { supabase } from '../../lib/supabase';
import { Upload, Dice5, Users, Map as MapIcon, Heart } from 'lucide-react';

// Tipagem atualizada para receber cenaId
export default function VTTControls({ cenaId }: { cenaId: string }) {
  
  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file || !cenaId) return;

    const path = `mapas/${cenaId}-${Date.now()}.png`;
    const { data, error } = await supabase.storage.from('mapas').upload(path, file);

    if (data) {
      const { data: { publicUrl } } = supabase.storage.from('mapas').getPublicUrl(path);
      // Atualiza a tabela CENAS e não salas
      await supabase.from('cenas').update({ mapa_url: publicUrl }).eq('id', cenaId);
    }
  };

  const addToken = async () => {
    if (!cenaId) return;
    
    // Insere o token atrelado à CENA
    await supabase.from('tokens').insert([{
      cena_id: cenaId,
      nome: 'Monstro',
      x: 0,
      y: 0,
      cor: '#ef4444' 
    }]);
  };

  return (
    <>
      {/* Controles Inferiores */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-50 bg-[#131b26]/90 backdrop-blur-md border border-[#2a3b52] p-2 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        
        {/* Adicionar Inimigo/Token */}
        <button 
          onClick={addToken} 
          className="bg-[#1a2b4c]/50 border border-[#2a3b52] p-3 rounded-xl text-[#f0ebd8] hover:bg-[#4ad9d9]/20 hover:text-[#4ad9d9] hover:border-[#4ad9d9]/50 active:scale-95 transition-all"
          title="Adicionar Inimigo"
        >
          <Users size={24} />
        </button>

        {/* Upload de Mapa */}
        <label 
          className="bg-[#1a2b4c]/50 border border-[#2a3b52] p-3 rounded-xl text-[#f0ebd8] hover:bg-[#4ad9d9]/20 hover:text-[#4ad9d9] hover:border-[#4ad9d9]/50 active:scale-95 transition-all cursor-pointer"
          title="Trocar Mapa da Cena Atual"
        >
          <MapIcon size={24} />
          <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
        </label>

        {/* Rolagem de Dado Clássica */}
        <button 
          onClick={() => alert("D20: " + (Math.floor(Math.random()*20)+1))} 
          className="bg-[#1a2b4c]/50 border border-[#2a3b52] p-3 rounded-xl text-[#f0ebd8] hover:bg-[#4ad9d9]/20 hover:text-[#4ad9d9] hover:border-[#4ad9d9]/50 active:scale-95 transition-all"
          title="Rolar D20"
        >
          <Dice5 size={24} />
        </button>
      </div>
    </>
  );
}
