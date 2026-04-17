"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../src/lib/supabase';
import { Cinzel, Inter } from 'next/font/google';
import { Plus, User, Shield, Swords, X } from 'lucide-react';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700', '900'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '600'] });

export default function FichasHub() {
  const [fichas, setFichas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCharName, setNewCharName] = useState("");
  const router = useRouter();

  useEffect(() => {
    carregarFichas();
  }, []);

  const carregarFichas = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    const { data } = await supabase
      .from('fichas')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (data) setFichas(data);
    setLoading(false);
  };

  const criarNovaFicha = async () => {
    if (!newCharName.trim()) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // ARQUITETURA ATUALIZADA: Status agora possuem 'atual' e 'max'
    const novaFicha = {
      user_id: session.user.id,
      sala_id: 'lobby',
      nome_personagem: newCharName,
      sistema_preset: 'ordem_paranormal',
      dados: {
        idade: "Desconhecida", raca: "Desconhecida", gostos: "Nenhum registro.",
        nex: 5,
        status: { 
          vida: { atual: 20, max: 20 }, 
          sanidade: { atual: 15, max: 15 }, 
          estamina: { atual: 2, max: 2 } 
        },
        atributos: { forca: 1, destreza: 1, sabedoria: 1, intelecto: 1, carisma: 1, vigor: 1 },
        habilidades: [],
        armas: []
      }
    };

    const { data, error } = await supabase.from('fichas').insert([novaFicha]).select().single();
    if (data) router.push(`/fichas/${data.id}`);
  };

  // Função para ler a vida (retrocompatível com fichas velhas)
  const getVida = (status: any) => {
    if (!status?.vida) return '?';
    return typeof status.vida === 'object' ? `${status.vida.atual}/${status.vida.max}` : status.vida;
  };
  
  const getSanidade = (status: any) => {
    if (!status?.sanidade) return '?';
    return typeof status.sanidade === 'object' ? `${status.sanidade.atual}/${status.sanidade.max}` : status.sanidade;
  };

  if (loading) return <div className="min-h-screen bg-[#090e17] flex items-center justify-center text-[#4ad9d9]">Carregando seu grimório...</div>;

  return (
    <main className="min-h-screen bg-[#090e17] text-[#8b9bb4] p-6 md:p-12 relative overflow-y-auto">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#1a2b4c]/30 to-transparent pointer-events-none z-0"></div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090e17]/80 backdrop-blur-sm px-4">
          <div className="bg-[#131b26] border border-[#4ad9d9]/50 rounded-2xl p-8 max-w-md w-full shadow-[0_0_30px_rgba(74,217,217,0.15)] relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-[#6b7b94] hover:text-white transition-colors"><X size={20} /></button>
            <h2 className={`${cinzel.className} text-[#f0ebd8] text-2xl font-bold mb-2`}>Novo Avatar</h2>
            <p className={`${inter.className} text-xs text-[#6b7b94] mb-6 uppercase tracking-widest`}>Insira o nome do personagem</p>
            <input type="text" autoFocus placeholder="Ex: Arthur Pendelton" value={newCharName} onChange={(e) => setNewCharName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && criarNovaFicha()} className="w-full bg-[#0a0f18] border border-[#2a3b52] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#4ad9d9] transition-colors mb-6"/>
            <button onClick={criarNovaFicha} className="w-full bg-gradient-to-r from-[#218b8b] to-[#1a6666] text-white py-3 rounded-lg hover:from-[#2aabab] hover:to-[#218b8b] transition-all font-semibold tracking-widest uppercase text-sm">Forjar Personagem</button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto relative z-10">
        <header className="flex justify-between items-end mb-12 border-b border-[#2a3b52] pb-6">
          <div><h1 className={`${cinzel.className} text-[#f0ebd8] text-4xl md:text-5xl font-black tracking-wider`}>SEUS PERSONAGENS</h1></div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-[#218b8b] to-[#1a6666] text-white px-6 py-3 rounded-full hover:from-[#2aabab] hover:to-[#218b8b] transition-all shadow-[0_0_15px_rgba(33,139,139,0.3)] font-semibold tracking-widest uppercase text-sm"><Plus size={18} /> Criar Novo</button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fichas.map((ficha) => (
            <div key={ficha.id} onClick={() => router.push(`/fichas/${ficha.id}`)} className="bg-[#131b26]/80 backdrop-blur-md border border-[#2a3b52] hover:border-[#4ad9d9]/60 rounded-2xl p-6 cursor-pointer group transition-all duration-300 hover:shadow-[0_0_20px_rgba(74,217,217,0.1)] relative overflow-hidden">
              <h2 className={`${cinzel.className} text-[#f0ebd8] text-2xl font-bold mb-1 truncate`}>{ficha.nome_personagem}</h2>
              <div className="text-[10px] uppercase tracking-widest text-[#4ad9d9] mb-4">Preset: {ficha.sistema_preset.replace('_', ' ')}</div>
              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-[#1a2b4c]">
                <div className="flex items-center gap-2 text-[#f0ebd8] text-sm"><Shield size={16} className="text-red-400" /> {getVida(ficha.dados?.status)} Vida</div>
                <div className="flex items-center gap-2 text-[#f0ebd8] text-sm"><Swords size={16} className="text-[#4ad9d9]" /> {getSanidade(ficha.dados?.status)} San.</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
