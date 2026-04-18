"use client";

import { Dice5, Map as MapIcon, Users } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function VTTControls({ cenaId }: { cenaId: string }) {
  const handleFileUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file || !cenaId) {
      return;
    }

    const ext = file.name.split(".").pop() || "png";
    const path = `mapas/${cenaId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("mapas").upload(path, file, { upsert: true });
    if (error) {
      alert(`Falha no upload do mapa: ${error.message}`);
      return;
    }

    const { data } = supabase.storage.from("mapas").getPublicUrl(path);
    await supabase.from("cenas").update({ mapa_url: data.publicUrl }).eq("id", cenaId);
  };

  const addToken = async () => {
    if (!cenaId) {
      return;
    }

    await supabase.from("tokens").insert([
      {
        cena_id: cenaId,
        nome: "Entidade",
        x: 0,
        y: 0,
        cor: "#ef4444",
      },
    ]);
  };

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 gap-2 rounded-2xl border border-[var(--aq-border-strong)] bg-[rgba(10,15,24,0.9)] p-2 shadow-[0_0_24px_rgba(0,0,0,0.45)] backdrop-blur-md">
      <button
        onClick={addToken}
        className="rounded-xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] p-3 text-[var(--aq-title)] transition-all hover:border-[var(--aq-border-strong)] hover:bg-[rgba(74,217,217,0.14)] hover:text-[var(--aq-accent)] active:scale-95"
        title="Adicionar token"
      >
        <Users size={24} />
      </button>

      <label
        className="cursor-pointer rounded-xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] p-3 text-[var(--aq-title)] transition-all hover:border-[var(--aq-border-strong)] hover:bg-[rgba(74,217,217,0.14)] hover:text-[var(--aq-accent)] active:scale-95"
        title="Trocar mapa da cena atual"
      >
        <MapIcon size={24} />
        <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
      </label>

      <button
        onClick={() => alert(`D20: ${Math.floor(Math.random() * 20) + 1}`)}
        className="rounded-xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] p-3 text-[var(--aq-title)] transition-all hover:border-[var(--aq-border-strong)] hover:bg-[rgba(74,217,217,0.14)] hover:text-[var(--aq-accent)] active:scale-95"
        title="Rolar D20"
      >
        <Dice5 size={24} />
      </button>
    </div>
  );
}
