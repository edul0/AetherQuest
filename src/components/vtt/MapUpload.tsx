"use client";
import { supabase } from '@/lib/supabase';
import { Image as ImageIcon } from 'lucide-react';

export default function MapUpload({ salaId }: { salaId: string }) {
  const uploadMap = async (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${salaId}-${Math.random()}.${fileExt}`;
    const filePath = `cenarios/${fileName}`;

    // 1. Upload para o Storage
    const { error: uploadError } = await supabase.storage
      .from('mapas')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Erro no upload:', uploadError.message);
      return;
    }

    // 2. Pegar a URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('mapas')
      .getPublicUrl(filePath);

    // 3. Atualizar a sala com o novo mapa
    await supabase
      .from('salas')
      .update({ mapa_url: publicUrl })
      .eq('id', salaId);
  };

  return (
    <label className="flex flex-col items-center justify-center p-4 bg-slate-800 rounded-xl border-2 border-dashed border-slate-600 cursor-pointer active:bg-slate-700 transition-all">
      <ImageIcon className="text-slate-400 mb-2" size={24} />
      <span className="text-xs text-slate-400 font-medium">Trocar Mapa</span>
      <input type="file" accept="image/*" onChange={uploadMap} className="hidden" />
    </label>
  );
}
