"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../src/lib/supabase';
import { Cinzel, Inter } from 'next/font/google';
import { Plus, Shield, Swords } from 'lucide-react';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700', '900'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '600'] });

export default function FichasHubPage() {
  const router = useRouter();
  const [fichas, setFichas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarFichas();
  }, []);

  const carregarFichas = async () => {
    const { data } = await supabase.from('fichas').select('id, nome_personagem, sistema_preset, dados');
    if (data) setFichas(data);
    setLoading(false);
  };

  const criarNovaFicha = async () => {
    const novaFicha = {
      nome_personagem: "Novo Personagem",
      sistema_preset: "ordem_paranormal",
      dados: {
        nex: 5,
        atributos: { forca: 1, agilidade: 1, vigor: 1, intelecto: 1, presenca: 1 },
        status: {
          vida: { atual: 10, max: 10 },
          sanidade: { atual: 10, max: 10 },
          estamina: { atual: 10, max: 10 }
        }
      }
    };

    const { data } = await supabase.from('fichas').insert([novaFicha]).select().single();
    if (data) router.push(`/fichas/${data.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050a10] flex items-center justify-center text-[#4ad9d9] font-mono tracking-widest animate-pulse">
        Sincronizando Arquivos...
      </div>
    );
  }

  return (
    <main className={`min-h-screen bg-[#050a10] text-[#8b9bb4] p-8 md:p-16 ${inter.className}`}>
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12 border-b border-[#1a2b4c] pb-6">
          <h1 className={`${cinzel.className} text-3xl md:text-5xl text-[#f0ebd8] font-black tracking-widest`}>
            SEUS PERSONAGENS
          </h1>
          <button 
            onClick={criarNovaFicha}
            className="flex items-center gap-2 bg-[#1e6b6b] hover:bg-[#4ad9d9] text-white hover:text-[#050a10] px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(30,107,107,0.4)]"
          >
            <Plus size={16} />
            Criar Novo
          </button>
        </header>

        {fichas.length === 0 ? (
          <div className="text-center py-20 border border-[#1a2b4c] rounded-2xl bg-[#0a0f18]/50">
            <p className="text-[#6b7b94] tracking-widest uppercase text-sm">Nenhum personagem encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fichas.map(ficha => (
              <div 
                key={ficha.id} 
                onClick={() => router.push(`/fichas/${ficha.id}`)}
                className="bg-[#0a0f18] border border-[#1a2b4c] rounded-2xl p-6 cursor-pointer hover:border-[#4ad9d9] hover:shadow-[0_0_20px_rgba(74,217,217,0.15)] transition-all group"
              >
                <h2 className={`${cinzel.className} text-xl text-[#f0ebd8] font-bold mb-1 truncate group-hover:text-[#4ad9d9] transition-colors`}>
                  {ficha.nome_personagem || "Sem Nome"}
                </h2>
                <p className="text-[10px] text-[#4ad9d9] uppercase tracking-widest mb-6">
                  Preset: {ficha.sistema_preset?.replace('_', ' ')}
                </p>
                
                <div className="flex items-center gap-6 pt-4 border-t border-[#1a2b4c]">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-red-500" />
                    <span className="text-xs font-bold text-[#f0ebd8]">{ficha.dados?.status?.vida?.atual || 0}/{ficha.dados?.status?.vida?.max || 0} Vida</span>
                  </div>
                  {ficha.sistema_preset === 'ordem_paranormal' && (
                    <div className="flex items-center gap-2">
                      <Swords size={14} className="text-[#4ad9d9]" />
                      <span className="text-xs font-bold text-[#f0ebd8]">{ficha.dados?.status?.sanidade?.atual || 0}/{ficha.dados?.status?.sanidade?.max || 0} San.</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
