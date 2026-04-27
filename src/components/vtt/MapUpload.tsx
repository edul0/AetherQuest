"use client";

import type { ChangeEvent } from "react";
import { Image as ImageIcon } from "lucide-react";
import { supabase } from "@/src/lib/supabase";

export default function MapUpload({ salaId }: { salaId: string }) {
  const uploadMap = async (event: ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      // 1. Checa a sessÃ£o antes de encostar no Storage (Trava Anti-Anon)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        alert("SessÃ£o invÃ¡lida. FaÃ§a login novamente para alterar o mapa.");
        return;
      }

      // Opcional: Se a sua policy do Supabase Storage exigir que a pasta tenha o ID do usuÃ¡rio,
      // vocÃª deve trocar a const filePath para: `${session.user.id}/${fileName}`
      const fileExt = file.name.split(".").pop() || "png";
      const fileName = `${salaId}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `cenarios/${fileName}`;

      // 2. Dispara o Upload
      const { error: uploadError } = await supabase.storage
        .from("mapas")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Storage Error:", uploadError);
        alert(`Falha no upload do mapa: ${uploadError.message}`);
        return;
      }

      // 3. Captura a URL PÃºblica
      const {
        data: { publicUrl },
      } = supabase.storage.from("mapas").getPublicUrl(filePath);

      // 4. Atualiza o banco de dados da sala
      const { error: updateError } = await supabase
        .from("salas")
        .update({ mapa_url: publicUrl })
        .eq("id", salaId);

      if (updateError) {
        alert(`O upload funcionou, mas falhou ao vincular na mesa: ${updateError.message}`);
      }

    } catch (error: any) {
      alert(`Erro inesperado no sistema: ${error.message}`);
    }
  };

  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-600 bg-slate-800 p-4 transition-all active:bg-slate-700">
      <ImageIcon className="mb-2 text-slate-400" size={24} />
      <span className="text-xs font-medium text-slate-400">Trocar Mapa</span>
      <input type="file" accept="image/*" onChange={uploadMap} className="hidden" />
    </label>
  );
}
