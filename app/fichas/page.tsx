"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../src/lib/supabase";
import { Cinzel, Inter } from "next/font/google";
import { Plus, Shield, Sparkles, Swords } from "lucide-react";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "600"] });

const SYSTEM_OPTIONS = [
  { id: "ordem_paranormal", label: "Ordem Paranormal", desc: "Vida, PE, sanidade e NEX." },
  { id: "dnd5e", label: "D&D 5e", desc: "Raças, classes e progressao fantasy." }
];

const buildFichaBase = (systemId: string) => ({
  nome_personagem: systemId === "dnd5e" ? "Novo Aventureiro" : "Novo Personagem",
  sistema_preset: systemId,
  dados: {
    nivel: 1,
    nex: 5,
    origem: "",
    classe: "",
    raca: "",
    deslocamento: "9m",
    atributos: { forca: 1, agilidade: 1, vigor: 1, intelecto: 1, presenca: 1 },
    status: {
      vida: { atual: 10, max: 10 },
      sanidade: { atual: 10, max: 10 },
      pe: { atual: 5, max: 5 }
    },
    defesa: { passiva: 10, bloqueio: 0, esquiva: 0, bonus: 0, bloqueio_bonus: 0, esquiva_bonus: 0 },
    habilidades: [],
    armas: [],
    pericias: {}
  }
});

export default function FichasHubPage() {
  const router = useRouter();
  const [fichas, setFichas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState("ordem_paranormal");

  useEffect(() => {
    carregarFichas();
  }, []);

  const carregarFichas = async () => {
    try {
      const { data, error } = await supabase
        .from("fichas")
        .select("id, nome_personagem, sistema_preset, dados");
      if (error) throw error;
      if (data) setFichas(data);
    } catch (err: any) {
      console.error("Erro ao carregar fichas:", err);
    } finally {
      setLoading(false);
    }
  };

  const criarNovaFicha = async () => {
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("fichas")
        .insert([buildFichaBase(selectedSystem)])
        .select()
        .single();

      if (error) throw error;
      if (data) router.push(`/fichas/${data.id}`);
    } catch (err: any) {
      console.error("Erro ao criar ficha:", err);
      alert(`Erro no banco de dados: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050a10] font-mono tracking-widest text-[#4ad9d9] animate-pulse">
        Sincronizando Arquivos...
      </div>
    );
  }

  return (
    <main className={`min-h-screen bg-[#050a10] p-8 text-[#8b9bb4] md:p-16 ${inter.className}`}>
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 border-b border-[#1a2b4c] pb-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className={`${cinzel.className} text-3xl font-black tracking-widest text-[#f0ebd8] md:text-5xl`}>
                SEUS PERSONAGENS
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-[#6b7b94]">
                Escolha o sistema antes de criar a ficha. Depois a ficha completa cuida de classe, origem, raça, atributos e sincronizacao com a mesa.
              </p>
            </div>
            <button
              onClick={criarNovaFicha}
              disabled={creating}
              className="flex items-center gap-2 rounded-full bg-[#1e6b6b] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-[#4ad9d9] hover:text-[#050a10] disabled:opacity-60"
            >
              <Plus size={16} />
              {creating ? "Criando..." : "Criar Novo"}
            </button>
          </div>
        </header>

        <section className="mb-10 grid gap-4 md:grid-cols-2">
          {SYSTEM_OPTIONS.map((system) => (
            <button
              key={system.id}
              onClick={() => setSelectedSystem(system.id)}
              className={`rounded-2xl border p-5 text-left transition-all ${
                selectedSystem === system.id
                  ? "border-[#4ad9d9] bg-[#0d1723] shadow-[0_0_24px_rgba(74,217,217,0.12)]"
                  : "border-[#1a2b4c] bg-[#0a0f18]/70 hover:border-[#35517c]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles size={16} className="text-[#4ad9d9]" />
                <span className="text-xs font-black uppercase tracking-[0.25em] text-[#4ad9d9]">
                  Sistema
                </span>
              </div>
              <h2 className={`${cinzel.className} mt-4 text-2xl font-black text-[#f0ebd8]`}>
                {system.label}
              </h2>
              <p className="mt-2 text-sm text-[#6b7b94]">{system.desc}</p>
            </button>
          ))}
        </section>

        {fichas.length === 0 ? (
          <div className="rounded-2xl border border-[#1a2b4c] bg-[#0a0f18]/50 py-20 text-center">
            <p className="text-sm uppercase tracking-widest text-[#6b7b94]">
              Nenhum personagem encontrado.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {fichas.map((ficha) => (
              <div
                key={ficha.id}
                onClick={() => router.push(`/fichas/${ficha.id}`)}
                className="cursor-pointer rounded-2xl border border-[#1a2b4c] bg-[#0a0f18] p-6 transition-all hover:border-[#4ad9d9] hover:shadow-[0_0_20px_rgba(74,217,217,0.15)]"
              >
                <h2 className={`${cinzel.className} mb-1 truncate text-xl font-bold text-[#f0ebd8]`}>
                  {ficha.nome_personagem || "Sem Nome"}
                </h2>
                <p className="mb-6 text-[10px] uppercase tracking-widest text-[#4ad9d9]">
                  Preset: {String(ficha.sistema_preset || "").replace("_", " ")}
                </p>

                <div className="border-t border-[#1a2b4c] pt-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Shield size={14} className="text-red-500" />
                    <span className="text-xs font-bold text-[#f0ebd8]">
                      {ficha.dados?.status?.vida?.atual || 0}/{ficha.dados?.status?.vida?.max || 0} Vida
                    </span>
                  </div>
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles size={14} className="text-[#4ad9d9]" />
                    <span className="text-xs font-bold text-[#f0ebd8]">
                      {ficha.dados?.status?.pe?.atual || ficha.dados?.status?.estamina?.atual || 0}/
                      {ficha.dados?.status?.pe?.max || ficha.dados?.status?.estamina?.max || 0} Recurso
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Swords size={14} className="text-violet-400" />
                    <span className="text-xs font-bold text-[#f0ebd8]">
                      {ficha.dados?.status?.sanidade?.atual || 0}/{ficha.dados?.status?.sanidade?.max || 0} Sanidade
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
