"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../src/lib/supabase';
import { Cinzel, Inter } from 'next/font/google';
import { Shield, Brain, Zap, User, Camera, Plus, Dices, Swords, Save, ArrowLeft } from 'lucide-react';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700', '900'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '600'] });

export default function FichaPersonagemPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [ficha, setFicha] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estados inline para a UI limpa de novas habilidades
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillDice, setNewSkillDice] = useState("");

  useEffect(() => {
    carregarFicha();
  }, [id]);

  const carregarFicha = async () => {
    const { data, error } = await supabase.from('fichas').select('*').eq('id', id).single();
    if (data) setFicha(data);
    setLoading(false);
  };

  const salvarFicha = async () => {
    setIsSaving(true);
    await supabase.from('fichas').update({
      nome_personagem: ficha.nome_personagem,
      dados: ficha.dados
    }).eq('id', id);
    setIsSaving(false);
  };

  const adicionarHabilidade = () => {
    if (!newSkillName || !newSkillDice) return;
    const novasHabilidades = [...(ficha.dados.habilidades || []), { id: Date.now(), nome: newSkillName, dado: newSkillDice }];
    setFicha({ ...ficha, dados: { ...ficha.dados, habilidades: novasHabilidades } });
    setNewSkillName("");
    setNewSkillDice("");
    setIsAddingSkill(false);
  };

  const atualizarAtributo = (key: string, value: number) => {
    setFicha({
      ...ficha,
      dados: { ...ficha.dados, atributos: { ...ficha.dados.atributos, [key]: value } }
    });
  };

  if (loading) return <div className="h-screen bg-[#090e17] flex items-center justify-center text-[#4ad9d9]">Sincronizando...</div>;
  if (!ficha) return <div className="h-screen bg-[#090e17] flex items-center justify-center text-red-500">Personagem não encontrado.</div>;

  return (
    <main className="min-h-screen bg-[#090e17] text-[#8b9bb4] p-4 md:p-8 relative overflow-y-auto pb-32">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#1a2b4c]/20 to-transparent pointer-events-none z-0"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        <header className="flex justify-between items-end mb-8">
          <div>
            <button onClick={() => router.push('/fichas')} className="flex items-center gap-2 text-[#6b7b94] hover:text-white mb-4 transition-colors text-xs uppercase tracking-widest">
              <ArrowLeft size={14} /> Voltar ao Hub
            </button>
            <div className="flex items-center gap-2 text-[#4ad9d9] mb-1 text-xs uppercase tracking-widest font-semibold">
              <User size={14} /> Preset: {ficha.sistema_preset.replace('_', ' ')}
            </div>
            {/* Input elegante para trocar o nome do personagem */}
            <input 
              type="text" 
              value={ficha.nome_personagem} 
              onChange={(e) => setFicha({...ficha, nome_personagem: e.target.value})}
              className={`${cinzel.className} text-[#f0ebd8] text-4xl md:text-5xl font-black tracking-wider bg-transparent border-b border-transparent hover:border-[#2a3b52] focus:border-[#4ad9d9] focus:outline-none transition-colors w-full`}
            />
          </div>
          <button 
            onClick={salvarFicha}
            disabled={isSaving}
            className="flex items-center gap-2 bg-gradient-to-r from-[#218b8b] to-[#1a6666] text-white px-6 py-2 rounded-full hover:from-[#2aabab] hover:to-[#218b8b] transition-all shadow-[0_0_15px_rgba(33,139,139,0.3)] text-sm font-semibold tracking-widest uppercase"
          >
            <Save size={16} /> {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 space-y-6">
            <div className="bg-[#131b26]/60 backdrop-blur-md border border-[#2a3b52] rounded-2xl p-2 shadow-lg group cursor-pointer hover:border-[#4ad9d9]/50 transition-colors">
              <div className="w-full aspect-[3/4] bg-[#0a0f18] rounded-xl border border-[#1a2b4c] flex flex-col items-center justify-center text-[#2a3b52] group-hover:text-[#4ad9d9] transition-colors relative overflow-hidden">
                <Camera size={48} strokeWidth={1} className="mb-2" />
                <span className={`${inter.className} text-xs uppercase tracking-widest`}>Adicionar Retrato</span>
              </div>
            </div>

            <div className="bg-[#131b26]/60 backdrop-blur-md border border-[#2a3b52] rounded-2xl p-6 shadow-lg space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#4ad9d9] mb-1">Idade / Altura</label>
                <input type="text" value={ficha.dados.idade} onChange={(e) => setFicha({...ficha, dados: {...ficha.dados, idade: e.target.value}})} className="w-full bg-transparent border-b border-[#2a3b52] text-[#f0ebd8] focus:border-[#4ad9d9] focus:outline-none pb-1" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#4ad9d9] mb-1">Raça</label>
                <input type="text" value={ficha.dados.raca} onChange={(e) => setFicha({...ficha, dados: {...ficha.dados, raca: e.target.value}})} className="w-full bg-transparent border-b border-[#2a3b52] text-[#f0ebd8] focus:border-[#4ad9d9] focus:outline-none pb-1" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#4ad9d9] mb-1">Gostos Pessoais</label>
                <textarea value={ficha.dados.gostos} onChange={(e) => setFicha({...ficha, dados: {...ficha.dados, gostos: e.target.value}})} rows={3} className="w-full bg-transparent border-b border-[#2a3b52] text-[#f0ebd8] focus:border-[#4ad9d9] focus:outline-none resize-none pb-1" />
              </div>
            </div>
          </div>

          <div className="md:col-span-8 space-y-6">
            <section className="grid grid-cols-3 gap-4">
               {/* Inputs numéricos para os status principais */}
               {['vida', 'sanidade', 'estamina'].map((stat) => (
                <div key={stat} className="bg-[#131b26]/60 border border-[#2a3b52] rounded-2xl p-4 flex flex-col items-center justify-center relative">
                  <input 
                    type="number" 
                    value={ficha.dados.status[stat]} 
                    onChange={(e) => setFicha({...ficha, dados: {...ficha.dados, status: {...ficha.dados.status, [stat]: parseInt(e.target.value) || 0}}})}
                    className="bg-transparent text-3xl font-black text-[#f0ebd8] w-20 text-center focus:outline-none border-b border-transparent focus:border-[#4ad9d9]"
                  />
                  <span className="text-[10px] uppercase tracking-widest text-[#6b7b94] mt-1">{stat}</span>
                </div>
              ))}
            </section>

            <section className="bg-[#131b26]/60 backdrop-blur-md border border-[#2a3b52] rounded-2xl p-6 shadow-lg">
               <div className="flex items-center gap-3 mb-6 border-b border-[#2a3b52] pb-2">
                 <Swords className="text-[#4ad9d9]" size={20} />
                 <h2 className={`${cinzel.className} text-[#f0ebd8] text-lg font-bold tracking-widest uppercase`}>Atributos Principais</h2>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(ficha.dados.atributos).map(([key, value]: any) => {
                    const mod = Math.floor((value - 10) / 2);
                    return (
                      <div key={key} className="flex items-center gap-4 bg-[#0a0f18]/50 p-2 rounded-xl border border-[#1a2b4c]/50">
                        <input 
                          type="number" 
                          value={value} 
                          onChange={(e) => atualizarAtributo(key, parseInt(e.target.value) || 0)}
                          className="w-12 h-10 bg-[#0d131f] rounded-lg flex items-center justify-center text-center text-[#4ad9d9] font-black text-lg border border-[#2a3b52] focus:outline-none focus:border-[#4ad9d9]"
                        />
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-[#6b7b94]">{key}</div>
                          <div className={`${inter.className} text-[#f0ebd8] font-bold text-sm`}>Mod: <span className={mod >= 0 ? 'text-green-400' : 'text-red-400'}>{mod >= 0 ? `+${mod}` : mod}</span></div>
                        </div>
                      </div>
                    );
                  })}
               </div>
            </section>

            <section className="bg-[#131b26]/60 backdrop-blur-md border border-[#2a3b52] rounded-2xl p-6 shadow-lg">
               <div className="flex justify-between items-center mb-6 border-b border-[#2a3b52] pb-2">
                 <div className="flex items-center gap-3">
                    <Dices className="text-[#4ad9d9]" size={20} />
                    <h2 className={`${cinzel.className} text-[#f0ebd8] text-lg font-bold tracking-widest uppercase`}>Habilidades e Perícias</h2>
                 </div>
                 <button onClick={() => setIsAddingSkill(!isAddingSkill)} className="flex items-center gap-1 text-[#4ad9d9] text-xs uppercase font-semibold hover:text-white bg-[#1a2b4c]/50 px-3 py-1.5 rounded-full border border-[#4ad9d9]/30">
                   <Plus size={14} /> Adicionar
                 </button>
               </div>

               {/* NOVA UI INLINE PARA ADICIONAR HABILIDADE (Sem prompt!) */}
               {isAddingSkill && (
                 <div className="flex gap-2 mb-4 bg-[#0a0f18] p-3 rounded-xl border border-[#4ad9d9]/50 items-center">
                   <input type="text" placeholder="Nome (Ex: Furtividade)" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} className="bg-transparent border-b border-[#2a3b52] text-sm text-[#f0ebd8] px-2 py-1 w-full focus:outline-none focus:border-[#4ad9d9]" />
                   <input type="text" placeholder="Dado (Ex: 1d20+2)" value={newSkillDice} onChange={(e) => setNewSkillDice(e.target.value)} className="bg-transparent border-b border-[#2a3b52] text-sm text-[#f0ebd8] px-2 py-1 w-32 focus:outline-none focus:border-[#4ad9d9]" />
                   <button onClick={adicionarHabilidade} className="bg-[#4ad9d9] text-black px-4 py-1.5 rounded text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors">OK</button>
                 </div>
               )}
               
               <div className="space-y-3">
                 {(!ficha.dados.habilidades || ficha.dados.habilidades.length === 0) && !isAddingSkill && (
                   <p className="text-sm text-[#6b7b94] italic text-center py-4">Nenhuma habilidade cadastrada.</p>
                 )}
                 {ficha.dados.habilidades?.map((hab: any) => (
                   <div key={hab.id} className="flex justify-between items-center bg-[#0a0f18]/50 p-3 rounded-xl border border-[#1a2b4c]">
                     <span className={`${inter.className} text-[#f0ebd8] font-semibold text-sm`}>{hab.nome}</span>
                     <span className="bg-[#1a2b4c] text-[#4ad9d9] px-3 py-1 rounded-md text-xs font-mono border border-[#2a3b52]">{hab.dado}</span>
                   </div>
                 ))}
               </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
