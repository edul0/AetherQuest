"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../src/lib/supabase';
import { Cinzel, Inter } from 'next/font/google';
import { Shield, Brain, Zap, User, Camera, Plus, Dices, Swords, Save, ArrowLeft, Trash2, X, Minus } from 'lucide-react';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700', '900'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '600'] });

export default function FichaPersonagemPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [ficha, setFicha] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillDice, setNewSkillDice] = useState("");

  useEffect(() => {
    carregarFicha();
  }, [id]);

  const carregarFicha = async () => {
    const { data, error } = await supabase.from('fichas').select('*').eq('id', id).single();
    if (data) {
      const d = data.dados;
      // Garante que o NEX exista na ficha (Retrocompatibilidade)
      if (d.nex === undefined) d.nex = 5;
      
      const st = d.status;
      ['vida', 'sanidade', 'estamina'].forEach(attr => {
        if (typeof st[attr] === 'number') {
          st[attr] = { atual: st[attr], max: st[attr] };
        }
      });
      setFicha(data);
    }
    setLoading(false);
  };

  // --- MOTOR DE CÁLCULO DE STATUS (Baseado em NEX) ---
  // Esta função recalcula os máximos sempre que o NEX ou os atributos mudam.
  // Formula Base aproximada: Base + Modificador + (Nível - 1) * (BaseNivel + Modificador)
  const recalcularMaximos = (dadosAtuais: any) => {
    const nex = dadosAtuais.nex || 5;
    const nivel = Math.max(1, Math.floor(nex / 5)); // 5% = Nível 1
    const atr = dadosAtuais.atributos;

    const modVigor = Math.floor((atr.vigor - 10) / 2);
    const modSabedoria = Math.floor((atr.sabedoria - 10) / 2);
    const modForca = Math.floor((atr.forca - 10) / 2);

    // Valores bases genéricos de sobrevivência
    const novaVidaMax = 16 + modVigor + ((nivel - 1) * (4 + modVigor));
    const novaSanidadeMax = 12 + modSabedoria + ((nivel - 1) * (3 + modSabedoria));
    const novaEstaminaMax = 12 + modForca + ((nivel - 1) * (3 + modForca));

    return {
      vida: { ...dadosAtuais.status.vida, max: novaVidaMax },
      sanidade: { ...dadosAtuais.status.sanidade, max: novaSanidadeMax },
      estamina: { ...dadosAtuais.status.estamina, max: novaEstaminaMax }
    };
  };

  const atualizarNex = (novoNex: number) => {
    const nexTratado = Math.max(0, Math.min(99, novoNex));
    const dadosAtualizados = { ...ficha.dados, nex: nexTratado };
    const novosStatus = recalcularMaximos(dadosAtualizados);
    
    setFicha({ ...ficha, dados: { ...dadosAtualizados, status: novosStatus } });
  };

  const atualizarAtributo = (key: string, valor: number) => {
    const dadosAtualizados = { 
      ...ficha.dados, 
      atributos: { ...ficha.dados.atributos, [key]: valor } 
    };
    const novosStatus = recalcularMaximos(dadosAtualizados);

    setFicha({ ...ficha, dados: { ...dadosAtualizados, status: novosStatus } });
  };

  const atualizarStatusAtual = (statNome: string, valorStr: string, incremental: boolean = false) => {
    let valor = parseInt(valorStr) || 0;
    const max = ficha.dados.status[statNome].max;
    const atual = ficha.dados.status[statNome].atual;
    
    let novoAtual = incremental ? atual + valor : valor;
    
    // Trava para não passar do máximo e não cair abaixo de 0
    novoAtual = Math.max(0, Math.min(max, novoAtual));

    setFicha({
      ...ficha,
      dados: {
        ...ficha.dados,
        status: {
          ...ficha.dados.status,
          [statNome]: { atual: novoAtual, max }
        }
      }
    });
  };

  const salvarFicha = async () => {
    setIsSaving(true);
    await supabase.from('fichas').update({ nome_personagem: ficha.nome_personagem, dados: ficha.dados }).eq('id', id);
    setIsSaving(false);
  };

  const deletarFicha = async () => {
    await supabase.from('fichas').delete().eq('id', id);
    router.push('/fichas');
  };

  const adicionarHabilidade = () => {
    if (!newSkillName || !newSkillDice) return;
    const novasHabilidades = [...(ficha.dados.habilidades || []), { id: Date.now(), nome: newSkillName, dado: newSkillDice }];
    setFicha({ ...ficha, dados: { ...ficha.dados, habilidades: novasHabilidades } });
    setNewSkillName(""); setNewSkillDice(""); setIsAddingSkill(false);
  };

  const deletarHabilidade = (habId: number) => {
    const filtradas = ficha.dados.habilidades.filter((h: any) => h.id !== habId);
    setFicha({ ...ficha, dados: { ...ficha.dados, habilidades: filtradas } });
  };

  if (loading) return <div className="h-screen bg-[#090e17] flex items-center justify-center text-[#4ad9d9]">Sincronizando...</div>;
  if (!ficha) return <div className="h-screen bg-[#090e17] flex items-center justify-center text-red-500">Personagem não encontrado.</div>;

  return (
    <main className="min-h-screen bg-[#090e17] text-[#8b9bb4] p-4 md:p-8 relative overflow-y-auto pb-32 overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#1a2b4c]/20 to-transparent pointer-events-none z-0"></div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090e17]/90 backdrop-blur-sm px-4">
          <div className="bg-[#131b26] border border-red-900/50 rounded-2xl p-8 max-w-md w-full shadow-[0_0_40px_rgba(239,68,68,0.15)] relative">
            <h2 className={`${cinzel.className} text-red-400 text-2xl font-bold mb-2`}>Apagar Personagem?</h2>
            <p className={`${inter.className} text-sm text-[#8b9bb4] mb-6`}>A existência de <strong className="text-white">{ficha.nome_personagem}</strong> será apagada dos registros.</p>
            <div className="flex gap-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 bg-transparent border border-[#2a3b52] text-white py-3 rounded-lg hover:bg-[#1a2b4c]/50 transition-all font-semibold tracking-widest uppercase text-xs">Cancelar</button>
              <button onClick={deletarFicha} className="flex-1 bg-red-900/40 border border-red-900 text-red-400 py-3 rounded-lg hover:bg-red-500 hover:text-white transition-all font-bold tracking-widest uppercase text-xs">Sim, Apagar</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto relative z-10">
        <header className="flex justify-between items-start mb-8">
          <div className="w-full md:w-auto">
            <button onClick={() => router.push('/fichas')} className="flex items-center gap-2 text-[#6b7b94] hover:text-[#4ad9d9] mb-4 transition-colors text-xs uppercase tracking-widest">
              <ArrowLeft size={14} /> Voltar ao Hub
            </button>
            <div className="flex items-center gap-2 text-[#4ad9d9] mb-1 text-xs uppercase tracking-widest font-semibold">
              <User size={14} /> Preset: {ficha.sistema_preset.replace('_', ' ')}
            </div>
            <input type="text" value={ficha.nome_personagem} onChange={(e) => setFicha({...ficha, nome_personagem: e.target.value})} className={`${cinzel.className} text-[#f0ebd8] text-4xl md:text-5xl font-black tracking-wider bg-transparent border-b border-transparent hover:border-[#2a3b52] focus:border-[#4ad9d9] focus:outline-none transition-colors w-full md:w-auto`}/>
          </div>
          
          <div className="flex flex-col gap-3 mt-4 md:mt-0">
            <button onClick={salvarFicha} disabled={isSaving} className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#218b8b] to-[#1a6666] text-white px-6 py-2 rounded-full hover:from-[#2aabab] hover:to-[#218b8b] transition-all shadow-[0_0_15px_rgba(33,139,139,0.3)] text-xs font-semibold tracking-widest uppercase w-full md:w-auto">
              <Save size={14} /> {isSaving ? 'Salvando...' : 'Salvar Personagem'}
            </button>
            <button onClick={() => setIsDeleteModalOpen(true)} className="flex items-center justify-center gap-2 bg-red-900/20 text-red-400 border border-red-900/30 px-6 py-2 rounded-full hover:bg-red-900/50 hover:text-red-300 transition-all text-xs font-semibold tracking-widest uppercase w-full md:w-auto">
              <Trash2 size={14} /> Apagar
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 space-y-6">
            <div className="bg-[#131b26]/60 backdrop-blur-md border border-[#2a3b52] rounded-2xl p-2 shadow-lg group cursor-pointer hover:border-[#4ad9d9]/50 transition-colors">
              <div className="w-full aspect-[3/4] bg-[#0a0f18] rounded-xl border border-[#1a2b4c] flex flex-col items-center justify-center text-[#2a3b52] group-hover:text-[#4ad9d9] transition-colors relative overflow-hidden">
                <Camera size={48} strokeWidth={1} className="mb-2" />
                <span className={`${inter.className} text-xs uppercase tracking-widest`}>Adicionar Retrato</span>
              </div>
            </div>

            <div className="bg-[#131b26]/60 backdrop-blur-md border border-[#2a3b52] rounded-2xl p-6 shadow-lg space-y-4 relative overflow-hidden">
              {/* O INPUT DE NEX É O CORAÇÃO DO CÁLCULO AGORA */}
              <div className="absolute top-0 right-0 bg-[#1a2b4c] border-b border-l border-[#2a3b52] rounded-bl-2xl p-3 text-center">
                 <label className="block text-[10px] uppercase tracking-widest text-[#4ad9d9] mb-1">NEX (%)</label>
                 <input type="number" value={ficha.dados.nex || 5} onChange={(e) => atualizarNex(parseInt(e.target.value) || 0)} className="w-12 bg-transparent text-[#f0ebd8] font-bold text-lg text-center focus:outline-none" />
              </div>

              <div className="pt-2"><label className="block text-[10px] uppercase tracking-widest text-[#4ad9d9] mb-1">Idade / Altura</label><input type="text" value={ficha.dados.idade} onChange={(e) => setFicha({...ficha, dados: {...ficha.dados, idade: e.target.value}})} className="w-2/3 bg-transparent border-b border-[#2a3b52] text-[#f0ebd8] focus:border-[#4ad9d9] focus:outline-none pb-1" /></div>
              <div><label className="block text-[10px] uppercase tracking-widest text-[#4ad9d9] mb-1">Raça</label><input type="text" value={ficha.dados.raca} onChange={(e) => setFicha({...ficha, dados: {...ficha.dados, raca: e.target.value}})} className="w-full bg-transparent border-b border-[#2a3b52] text-[#f0ebd8] focus:border-[#4ad9d9] focus:outline-none pb-1" /></div>
              <div><label className="block text-[10px] uppercase tracking-widest text-[#4ad9d9] mb-1">Gostos Pessoais</label><textarea value={ficha.dados.gostos} onChange={(e) => setFicha({...ficha, dados: {...ficha.dados, gostos: e.target.value}})} rows={3} className="w-full bg-transparent border-b border-[#2a3b52] text-[#f0ebd8] focus:border-[#4ad9d9] focus:outline-none resize-none pb-1" /></div>
            </div>
          </div>

          <div className="md:col-span-8 space-y-6">
            
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'vida', nome: 'Vida', icon: Shield, cor: 'red' },
                { id: 'sanidade', nome: 'Sanidade', icon: Brain, cor: 'purple' },
                { id: 'estamina', nome: 'Estamina', icon: Zap, cor: 'green' }
              ].map((stat) => {
                const s = ficha.dados.status[stat.id];
                const pct = Math.max(0, Math.min(100, (s.atual / s.max) * 100)) || 0;
                
                return (
                  <div key={stat.id} className={`bg-[#131b26]/60 border border-${stat.cor}-900/30 rounded-2xl p-4 relative overflow-hidden`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-xs uppercase text-${stat.cor}-400 font-bold tracking-widest`}><stat.icon size={14} className="inline mr-1 -mt-0.5"/> {stat.nome}</span>
                      <span className="text-xs text-[#6b7b94] font-mono">{s.atual} / {s.max}</span>
                    </div>
                    
                    <div className="w-full bg-[#0a0f18] h-1.5 rounded-full mb-4 overflow-hidden border border-[#1a2b4c]">
                       <div className={`bg-${stat.cor}-500 h-full transition-all duration-300 ease-out`} style={{ width: `${pct}%` }}></div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2">
                      <button onClick={() => atualizarStatusAtual(stat.id, '-1', true)} className={`bg-[#0a0f18] border border-${stat.cor}-900/50 text-${stat.cor}-400 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-${stat.cor}-900/40 transition-colors`}><Minus size={14}/></button>
                      
                      <div className="flex items-center gap-1">
                        <input type="number" value={s.atual} onChange={(e) => atualizarStatusAtual(stat.id, e.target.value)} className={`w-12 bg-transparent text-center text-xl font-black text-[#f0ebd8] focus:outline-none focus:text-${stat.cor}-400 transition-colors`} />
                        <span className="text-[#2a3b52]">/</span>
                        {/* O INPUT DO MÁXIMO ESTÁ TRAVADO E OPACA. O SISTEMA DECIDE. */}
                        <span className="w-8 text-center text-sm font-bold text-[#6b7b94]/50 cursor-not-allowed" title="Definido pelo NEX e Atributos">{s.max}</span>
                      </div>

                      <button onClick={() => atualizarStatusAtual(stat.id, '1', true)} className={`bg-[#0a0f18] border border-${stat.cor}-900/50 text-${stat.cor}-400 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-${stat.cor}-900/40 transition-colors`}><Plus size={14}/></button>
                    </div>
                  </div>
                );
              })}
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
                        <input type="number" value={value} onChange={(e) => atualizarAtributo(key, parseInt(e.target.value) || 0)} className="w-12 h-10 bg-[#0d131f] rounded-lg flex items-center justify-center text-center text-[#4ad9d9] font-black text-lg border border-[#2a3b52] focus:outline-none focus:border-[#4ad9d9]" />
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-[#6b7b94]">{key}</div>
                          <div className={`${inter.className} text-[#f0ebd8] font-bold text-sm`}>Mod: <span className={mod >= 0 ? 'text-green-400' : 'text-red-400'}>{mod >= 0 ? `+${mod}` : mod}</span></div>
                        </div>
                      </div>
                    );
                  })}
               </div>
               <p className="mt-4 text-xs text-[#6b7b94] text-center italic">* Mudar atributos de Vigor, Sabedoria ou Força afeta automaticamente os limites máximos de Status.</p>
            </section>

            <section className="bg-[#131b26]/60 backdrop-blur-md border border-[#2a3b52] rounded-2xl p-6 shadow-lg">
               <div className="flex justify-between items-center mb-6 border-b border-[#2a3b52] pb-2">
                 <div className="flex items-center gap-3">
                    <Dices className="text-[#4ad9d9]" size={20} />
                    <h2 className={`${cinzel.className} text-[#f0ebd8] text-lg font-bold tracking-widest uppercase`}>Habilidades e Perícias</h2>
                 </div>
                 <button onClick={() => setIsAddingSkill(!isAddingSkill)} className="flex items-center gap-1 text-[#4ad9d9] text-xs uppercase font-semibold hover:text-white bg-[#1a2b4c]/50 px-3 py-1.5 rounded-full border border-[#4ad9d9]/30"><Plus size={14} /> Adicionar</button>
               </div>

               {isAddingSkill && (
                 <div className="flex flex-col md:flex-row gap-2 mb-4 bg-[#0a0f18] p-3 rounded-xl border border-[#4ad9d9]/50 items-center">
                   <input type="text" placeholder="Nome (Ex: Furtividade)" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} className="bg-transparent border-b border-[#2a3b52] text-sm text-[#f0ebd8] px-2 py-2 w-full focus:outline-none focus:border-[#4ad9d9]" />
                   <input type="text" placeholder="Dado (Ex: 1d20+2)" value={newSkillDice} onChange={(e) => setNewSkillDice(e.target.value)} className="bg-transparent border-b border-[#2a3b52] text-sm text-[#f0ebd8] px-2 py-2 w-full md:w-32 focus:outline-none focus:border-[#4ad9d9]" />
                   <button onClick={adicionarHabilidade} className="w-full md:w-auto bg-[#4ad9d9] text-black px-6 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors mt-2 md:mt-0">OK</button>
                 </div>
               )}
               
               <div className="space-y-3">
                 {(!ficha.dados.habilidades || ficha.dados.habilidades.length === 0) && !isAddingSkill && <p className="text-sm text-[#6b7b94] italic text-center py-4">Nenhuma habilidade cadastrada.</p>}
                 {ficha.dados.habilidades?.map((hab: any) => (
                   <div key={hab.id} className="flex justify-between items-center bg-[#0a0f18]/50 p-3 rounded-xl border border-[#1a2b4c] group">
                     <span className={`${inter.className} text-[#f0ebd8] font-semibold text-sm`}>{hab.nome}</span>
                     <div className="flex items-center gap-3">
                       <span className="bg-[#1a2b4c] text-[#4ad9d9] px-3 py-1 rounded-md text-xs font-mono border border-[#2a3b52] cursor-pointer hover:bg-[#4ad9d9] hover:text-black transition-colors" title="Rolar Dado">{hab.dado}</span>
                       <button onClick={() => deletarHabilidade(hab.id)} className="text-[#6b7b94] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" title="Remover Habilidade"><Trash2 size={16} /></button>
                     </div>
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
