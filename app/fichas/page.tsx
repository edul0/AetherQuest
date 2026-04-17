"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../src/lib/supabase';
import { Cinzel, Inter } from 'next/font/google';
import { Plus, User, Shield, Swords } from 'lucide-react';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700', '900'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '600'] });

export default function FichasHub() {
  const [fichas, setFichas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

    const { data, error } = await supabase
      .from('fichas')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (data) setFichas(data);
    setLoading(false);
  };

  const criarNovaFicha = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const nome = prompt("Nome do novo personagem:");
    if (!nome) return;

    // Cria um esqueleto básico no banco de dados
    const novaFicha = {
      user_id: session.user.id,
      sala_id: 'lobby', // Por enquanto não está em nenhuma campanha
      nome_personagem: nome,
      sistema_preset: 'memorias_postumas',
      dados: {
        idade: "", raca: "", gostos: "",
        status: { vida: 10, sanidade: 10, estamina: 10 },
        atributos: { forca: 10, destreza: 10, sabedoria: 10, intelecto: 10, carisma: 10, vigor: 10 },
        habilidades: []
      }
    };

    const { data, error } = await supabase.from('fichas').insert([novaFicha]).select().single();
    
    if (data) {
      // Redireciona para a tela de edição única dessa ficha (que vamos criar no próximo passo)
      router.push(`/fichas/${data.id}`);
    } else if (error) {
      alert("Erro ao criar ficha: " + error.message);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#090e17] flex items-center justify-center text-[#4ad9d9]">Carregando seu grimório...</div>;
  }

  return (
    <main className="min-h-screen bg-[#090e17] text-[#8b9bb4] p-6 md:p-12 relative overflow-y-auto">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#1a2b4c]/30 to-transparent pointer-events-none z-0"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <header className="flex justify-between items-end mb-12 border-b border-[#2a3b52] pb-6">
          <div>
            <h1 className={`${cinzel.className} text-[#f0ebd8] text-4xl md:text-5xl font-black tracking-wider`}>
              SEUS PERSONAGENS
            </h1>
            <p className={`${inter.className} text-[#6b7b94] mt-2`}>
              Gerencie seus avatares antes de entrar em uma campanha.
            </p>
          </div>
          <button 
            onClick={criarNovaFicha}
            className="flex items-center gap-2 bg-gradient-to-r from-[#218b8b] to-[#1a6666] text-white px-6 py-3 rounded-full hover:from-[#2aabab] hover:to-[#218b8b] transition-all shadow-[0_0_15px_rgba(33,139,139,0.3)] font-semibold tracking-widest uppercase text-sm"
          >
            <Plus size={18} /> Novo Personagem
          </button>
        </header>

        {fichas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-[#2a3b52] rounded-2xl bg-[#131b26]/30">
            <User size={48} className="text-[#2a3b52] mb-4" />
            <h3 className={`${cinzel.className} text-xl text-[#f0ebd8] mb-2`}>O Vazio Aguarda</h3>
            <p className={`${inter.className} text-sm text-[#6b7b94]`}>Você ainda não possui nenhum personagem. Crie o primeiro para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fichas.map((ficha) => (
              <div 
                key={ficha.id} 
                onClick={() => router.push(`/fichas/${ficha.id}`)}
                className="bg-[#131b26]/80 backdrop-blur-md border border-[#2a3b52] hover:border-[#4ad9d9]/60 rounded-2xl p-6 cursor-pointer group transition-all duration-300 hover:shadow-[0_0_20px_rgba(74,217,217,0.1)] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#4ad9d9]/5 rounded-full blur-[40px] group-hover:bg-[#4ad9d9]/10 transition-colors"></div>
                
                <h2 className={`${cinzel.className} text-[#f0ebd8] text-2xl font-bold mb-1 truncate`}>
                  {ficha.nome_personagem}
                </h2>
                <div className="text-[10px] uppercase tracking-widest text-[#4ad9d9] mb-4">
                  Sistema: {ficha.sistema_preset.replace('_', ' ')}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-[#1a2b4c]">
                  <div className="flex items-center gap-2 text-[#f0ebd8] text-sm">
                    <Shield size={16} className="text-red-400" /> 
                    {ficha.dados?.status?.vida || '?'} Vida
                  </div>
                  <div className="flex items-center gap-2 text-[#f0ebd8] text-sm">
                    <Swords size={16} className="text-[#4ad9d9]" /> 
                    Nível 1
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
