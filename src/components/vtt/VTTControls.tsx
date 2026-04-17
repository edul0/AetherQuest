"use client";
import { supabase } from '../../lib/supabase';
import { Upload, Dice5, Users } from 'lucide-react';

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
      nome: 'Novo Monstro',
      x: 0,
      y: 0,
      cor: '#ef4444'
    }]);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-50">
      {/* Botão de Adicionar Token */}
      <button onClick={addToken} className="bg-blue-600 p-4 rounded-full text-white shadow-xl active:scale-90 transition">
        <Users size={24} />
      </button>

      {/* Botão de Upload de Mapa */}
      <label className="bg-emerald-600 p-4 rounded-full text-white shadow-xl active:scale-90 transition cursor-pointer">
        <Upload size={24} />
        <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
      </label>

      {/* Botão de Rolagem Rápida */}
      <button onClick={() => alert("D20: " + (Math.floor(Math.random()*20)+1))} className="bg-red-600 p-4 rounded-full text-white shadow-xl active:scale-90 transition">
        <Dice5 size={24} />
      </button>
    </div>
  );
}
