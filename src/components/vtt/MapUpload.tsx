"use client";

import type { ChangeEvent } from "react";
import { Image as ImageIcon } from "lucide-react";
import { supabase } from "@/src/lib/supabase";

export default function MapUpload({ salaId }: { salaId: string }) {
  const uploadMap = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const fileExt = file.name.split(".").pop() || "png";
    const fileName = `${salaId}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `cenarios/${fileName}`;

    const { error: uploadError } = await supabase.storage.from("mapas").upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("Erro no upload:", uploadError.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("mapas").getPublicUrl(filePath);

    await supabase.from("salas").update({ mapa_url: publicUrl }).eq("id", salaId);
  };

  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-600 bg-slate-800 p-4 transition-all active:bg-slate-700">
      <ImageIcon className="mb-2 text-slate-400" size={24} />
      <span className="text-xs font-medium text-slate-400">Trocar Mapa</span>
      <input type="file" accept="image/*" onChange={uploadMap} className="hidden" />
    </label>
  );
}
