"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../src/lib/supabase';
import { Cinzel, Inter } from 'next/font/google';
import { Camera, Plus, Save, ArrowLeft, Trash2, Minus, ChevronDown } from 'lucide-react';
import { PRESETS } from '../../../src/lib/constants';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700', '900'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '600'] });

export default function FichaPersonagemPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ficha, setFicha] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('comum');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Estados dos Formulários
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkill, setNewSkill] = useState({ nome: "", dado: "", desc: "" });
  const [isAddingWeapon, setIsAddingWeapon] = useState(false);
  const [newWeapon, setNewWeapon] = useState({ nome: "", dano: "", critico: "", alcance: "", habilidade: "", desc: "" });

  useEffect(() => { carregarFicha(); }, [id]);

  const carregarFicha = async () => {
    const { data } = await supabase.from('fichas').select('*').eq('id', id).single();
    if (data) {
      if (!data.dados.habilidades) data.dados.habilidades = [];
      if (!data.dados.armas) data.dados.armas = [];
      setFicha(data);
      const sys = PRESETS[data.sistema_preset as keyof typeof PRESETS];
      if (sys) setActiveTab(sys.categorias_hab[0].id);
    }
    setLoading(false);
  };

  const recalcularMaximos = (dadosAtuais: any, sistema: string) => {
    const atr = dadosAtuais.atributos;
    const lv = sistema === 'ordem_paranormal' ? Math.max(1, Math.floor((dadosAtuais.nex || 5) / 5)) : (dadosAtuais.nivel || 1);
    const modVig = Math.floor((atr.vigor - 10) / 2);
    const modSab = Math.floor((atr.sabedoria - 10) / 2);
    const modInt = Math.floor((atr.intelecto - 10) / 2);

    if (sistema === 'ordem_paranormal') return {
      vida: { ...dadosAtuais.status.vida, max: 16 + modVig + (lv - 1) * (4 + modVig) },
      sanidade: { ...dadosAtuais.status.sanidade, max: 12 + modSab + (lv - 1) * (3 + modSab) },
      estamina: { ...dadosAtuais.status.estamina, max: 10 + modInt + (lv - 1) * (2 + modInt) }
    };
    
    return {
      vida: { ...dadosAtuais.status.vida, max: 20 + modVig + (lv - 1) * (6 + modVig) },
      sanidade: { ...dadosAtuais.status.sanidade, max: 0 },
      estamina: { ...dadosAtuais.status.estamina, max: 12 + modInt + (lv - 1) * (3 + modInt) }
    };
  };

  const atualizarFicha = (caminho: string, valor: any) => {
    const novosDados = { ...ficha.dados };
    const keys = caminho.split('.');
    let temp = novosDados;
    for (let i = 0; i < keys.length - 1; i++) temp = temp[keys[i]];
    temp[keys[keys.length - 1]] = valor;

    const dadosComStatus = { ...novosDados, status: recalcularMaximos(novosDados, ficha.sistema_preset) };
    setFicha({ ...ficha, dados: dadosComStatus });
  };

  // --- INTELIGÊNCIA: AUTO-PREENCHER ORIGEM ---
  const handleSelecionarOrigem = (nomeOrigem: string) => {
    const sys = PRESETS[ficha.sistema_preset as keyof typeof PRESETS];
    const origemData = sys?.origens?.find((o: any) => o.nome === nomeOrigem);
    
    atualizarFicha('origem', nomeOrigem);
    
    // Se a origem tiver um poder associado, adiciona automaticamente nas habilidades
    if (origemData && origemData.poder) {
      const nomePoder = `[Origem] ${nomeOrigem}`;
      const jaTem = ficha.dados.habilidades.find((h:any) => h.nome === nomePoder);
      if (!jaTem) {
         const habs = [...ficha.dados.habilidades, { id: Date.now(), nome: nomePoder, desc: origemData.poder, cat: 'comum' }];
         setFicha(prev => ({ ...prev, dados: { ...prev.dados, habilidades: habs } }));
      }
    }
  };

  // --- INTELIGÊNCIA: AUTO-PREENCHER ARMA ---
  const handleSelecionarArmaPreset = (nomeArma: string) => {
    const sys = PRESETS[ficha.sistema_preset as keyof typeof PRESETS];
    const armaData = sys?.armas?.find((a: any) => a.nome === nomeArma);
    if (armaData) {
      setNewWeapon({ 
        nome: armaData.nome, dano: armaData.dano, critico: armaData.critico, 
        alcance: armaData.alcance, habilidade: armaData.habilidade, desc: armaData.desc 
      });
    } else {
      setNewWeapon({ ...newWeapon, nome: nomeArma });
    }
  };

  const adicionarHabilidade = () => {
    if (!newSkill.nome) return;
    const habs = [...ficha.dados.habilidades, { ...newSkill, id: Date.now(), cat: activeTab }];
    atualizarFicha('habilidades', habs);
    setNewSkill({ nome: "", dado: "", desc: "" });
    setIsAddingSkill(false);
  };

  const adicionarArma = () => {
    if (!newWeapon.nome) return;
    const armasList = [...(ficha.dados.armas || []), { ...newWeapon, id: Date.now() }];
    atualizarFicha('armas', armasList);
    setNewWeapon({ nome: "", dano: "", critico: "", alcance: "", habilidade: "", desc: "" });
    setIsAddingWeapon(false);
  };

  const salvarNoBanco = async () => {
    setIsSaving(true);
    await supabase.from('fichas').update({ nome_personagem: ficha.nome_personagem, sistema_preset: ficha.sistema_preset, dados: ficha.dados }).eq('id', id);
    setIsSaving(false);
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const path = `retratos/${id}-${Date.now()}.png`;
    const { data } = await supabase.storage.from('avatares').upload(path, file);
    if (data) atualizarFicha('avatar_url', supabase.storage.from('avatares').getPublicUrl(path).data.publicUrl);
    setIsUploading(false);
  };

  if (loading) return <div className="min-h-screen bg-[#090e17] flex items-center justify-center text-[#4ad9d9] font-mono tracking-widest animate-pulse">Sincronizando...</div>;

  const currentSys = PRESETS[ficha.sistema_preset as keyof typeof PRESETS];
  const isOP = ficha.sistema_preset === 'ordem_paranormal';
  const noArrows = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    // CORREÇÃO DO SCROLL: min-h-screen permite que a página cresça e o scroll do navegador funcione nativamente
    <main className="min-h-screen w-full bg-[#090e17] text-[#8b9bb4] p-4 md:p-8 relative pb-32">
      <div className="fixed top-0 left-0 w-full h-[100vh] bg-[radial-gradient(circle_at_50%_0%,_#1a2b4c22_0%,_transparent_70%)] pointer-events-none z-0" />

      {/* Modal Apagar */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090e17]/90 backdrop-blur-sm px-4">
          <div className="bg-[#131b26] border border-red-900/50 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <h2 className={`${cinzel.className} text-red-400 text-2xl mb-4 font-bold`}>Apagar Personagem?</h2>
            <div className="flex gap-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 border border-[#2a3b52] py-2 rounded-lg text-white">Cancelar</button>
              <button onClick={async () => { await supabase.from('fichas').delete().eq('id', id); router.push('/fichas'); }} className="flex-1 bg-red-900 text-white py-2 rounded-lg font-bold">Apagar</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto relative z-10">
        
        <header className="flex flex-col gap-6 mb-12 border-b border-[#2a3b52] pb-6">
          <div className="flex justify-between items-center">
            <button onClick={() => router.push('/fichas')} className="text-xs uppercase tracking-[0.2em] text-[#6b7b94] hover:text-[#4ad9d9] transition-colors flex items-center gap-2">
              <ArrowLeft size={14}/> Voltar ao Hub
            </button>
            <div className="flex gap-3">
              <button onClick={() => setIsDeleteModalOpen(true)} className="p-2 border border-red-900/30 text-red-400 rounded-lg"><Trash2 size={16}/></button>
              <button onClick={salvarNoBanco} disabled={isSaving} className="bg-[#4ad9d9] text-[#090e17] px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-white transition-all">
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <select 
              value={ficha.sistema_preset} 
              onChange={(e) => {
                 const novosStatus = recalcularMaximos(ficha.dados, e.target.value);
                 setFicha({ ...ficha, sistema_preset: e.target.value, dados: { ...ficha.dados, status: novosStatus } });
              }} 
              className="w-fit bg-transparent text-[#4ad9d9] text-[10px] uppercase tracking-widest font-bold outline-none cursor-pointer border-b border-[#2a3b52] pb-1"
            >
              <option value="ordem_paranormal">Sistema: Ordem Paranormal</option>
              <option value="dnd5e">Sistema: D&D 5e</option>
              <option value="memorias_postumas">Sistema: Memórias Póstumas</option>
            </select>
            <input type="text" value={ficha.nome_personagem} onChange={(e) => setFicha({...ficha, nome_personagem: e.target.value})} className={`${cinzel.className} bg-transparent text-[#f0ebd8] text-5xl font-black focus:outline-none w-full`} placeholder="Nome do Herói" />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 space-y-6">
            <div onClick={() => fileInputRef.current?.click()} className="relative aspect-[3/4] w-full max-w-sm mx-auto bg-[#131b26]/80 border border-[#2a3b52] rounded-3xl overflow-hidden cursor-pointer shadow-lg">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              {isUploading && <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 text-[#4ad9d9] font-bold text-xs">Enviando...</div>}
              {ficha.dados.avatar_url ? <img src={ficha.dados.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center text-[#2a3b52]"><Camera size={48} /><span className="text-[10px] mt-4 font-bold">RETRATO</span></div>}
            </div>

            <div className="bg-[#131b26]/60 border border-[#2a3b52] rounded-3xl p-6 relative">
               <div className="absolute top-0 right-0 bg-[#1a2b4c] border-b border-l border-[#2a3b52] rounded-bl-2xl p-3 flex flex-col items-center">
                 <label className="text-[9px] uppercase font-black text-[#4ad9d9] mb-1">{isOP ? 'NEX' : 'LEVEL'}</label>
                 <input type="number" value={isOP ? ficha.dados.nex : ficha.dados.nivel} onChange={(e) => {
                    const val = Math.max(isOP ? 0 : 1, parseInt(e.target.value) || 0);
                    const novosDados = { ...ficha.dados, [isOP ? 'nex' : 'nivel']: val };
                    setFicha({ ...ficha, dados: { ...novosDados, status: recalcularMaximos(novosDados, ficha.sistema_preset) } });
                 }} className={`w-12 bg-transparent text-[#f0ebd8] font-black text-xl text-center outline-none ${noArrows}`} />
               </div>

               <div className="space-y-5 pt-2">
                  <div>
                    <label className="block text-[9px] uppercase font-black text-[#6b7b94] mb-1">Origem (Autopreencher)</label>
                    <select value={ficha.dados.origem} onChange={(e) => handleSelecionarOrigem(e.target.value)} className="w-full bg-transparent border-b border-[#2a3b52] text-[#f0ebd8] py-1 outline-none text-sm cursor-pointer">
                      <option value="" className="bg-[#0a0f18]">Selecionar...</option>
                      {currentSys?.origens.map((o:any) => <option key={o.nome} value={o.nome} className="bg-[#0a0f18]">{o.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-black text-[#6b7b94] mb-1">Classe</label>
                    <select value={ficha.dados.classe} onChange={(e) => atualizarFicha('classe', e.target.value)} className="w-full bg-transparent border-b border-[#2a3b52] text-[#f0ebd8] py-1 outline-none text-sm cursor-pointer">
                      <option value="" className="bg-[#0a0f18]">Selecionar...</option>
                      {currentSys?.classes.map((c:any) => <option key={c} value={c} className="bg-[#0a0f18]">{c}</option>)}
                    </select>
                  </div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
            
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['vida', 'sanidade', 'estamina'].map(s => {
                const stat = ficha.dados.status[s];
                if (s === 'sanidade' && !isOP) return null;
                const color = s === 'vida' ? '#ef4444' : s === 'sanidade' ? '#a855f7' : '#eab308';
                const label = s === 'estamina' && isOP ? 'PE' : s;
                return (
                  <div key={s} className="bg-[#131b26]/80 border border-[#2a3b52] rounded-2xl p-5 shadow-lg">
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-[10px] uppercase font-black tracking-widest" style={{ color }}>{label}</span>
                      <div className="flex items-center gap-1 text-xl">
                        <input type="number" value={stat.atual} onChange={(e) => {
                          const v = Math.max(0, Math.min(stat.max, parseInt(e.target.value) || 0));
                          setFicha({ ...ficha, dados: { ...ficha.dados, status: { ...ficha.dados.status, [s]: { ...stat, atual: v } } } });
                        }} className={`bg-transparent text-right font-black text-white w-14 outline-none ${noArrows}`} />
                        <span className="text-[#2a3b52] font-black">/</span>
                        <span className="text-sm font-bold text-[#6b7b94] w-8">{stat.max}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-[#0a0f18] rounded-full overflow-hidden border border-[#1a2b4c]">
                      <div className="h-full transition-all duration-500" style={{ width: `${(stat.atual/stat.max)*100}%`, backgroundColor: color }} />
                    </div>
                    <div className="flex justify-between mt-4">
                      <button onClick={() => { const v = Math.max(0, stat.atual - 1); setFicha({ ...ficha, dados: { ...ficha.dados, status: { ...ficha.dados.status, [s]: { ...stat, atual: v } } } }); }} className="p-2 text-[#6b7b94] bg-[#0a0f18] rounded-lg hover:text-white"><Minus size={14}/></button>
                      <button onClick={() => { const v = Math.min(stat.max, stat.atual + 1); setFicha({ ...ficha, dados: { ...ficha.dados, status: { ...ficha.dados.status, [s]: { ...stat, atual: v } } } }); }} className="p-2 text-[#6b7b94] bg-[#0a0f18] rounded-lg hover:text-white"><Plus size={14}/></button>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="bg-[#131b26]/60 border border-[#2a3b52] rounded-3xl p-6 shadow-lg">
               <h3 className={`${cinzel.className} text-white text-xs tracking-[0.4em] mb-6 opacity-50`}>ATRIBUTOS</h3>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                 {Object.entries(ficha.dados.atributos).map(([k, v]: any) => {
                   const mod = Math.floor((v - 10) / 2);
                   return (
                     <div key={k} className="flex flex-col items-center gap-2">
                       <div className="relative w-full aspect-square flex items-center justify-center bg-[#0a0f18] border border-[#2a3b52] rounded-2xl">
                          <input type="number" value={v} onChange={(e) => atualizarFicha(`atributos.${k}`, parseInt(e.target.value) || 0)} className={`bg-transparent text-center font-black text-2xl text-white w-full outline-none ${noArrows}`} />
                          <div className="absolute -bottom-2 bg-[#131b26] border border-[#2a3b52] px-2 rounded text-[10px] font-bold text-[#4ad9d9]">
                            {mod >= 0 ? `+${mod}` : mod}
                          </div>
                       </div>
                       <span className="text-[9px] uppercase font-black tracking-tighter mt-2 text-[#6b7b94]">{k}</span>
                     </div>
                   );
                 })}
               </div>
            </section>

            {/* ABAS INTELIGENTES (Inclui Arsenal) */}
            <section className="bg-[#131b26]/60 border border-[#2a3b52] rounded-3xl overflow-hidden shadow-lg">
               <div className="flex border-b border-[#2a3b52] overflow-x-auto">
                 {currentSys?.categorias_hab?.map((cat:any) => (
                   <button 
                     key={cat.id} 
                     onClick={() => setActiveTab(cat.id)}
                     className={`py-4 px-6 text-[10px] uppercase font-black tracking-widest whitespace-nowrap transition-all ${activeTab === cat.id ? 'bg-[#1a2b4c] text-[#4ad9d9] border-b-2 border-[#4ad9d9]' : 'text-[#6b7b94] hover:bg-white/5'}`}
                   >
                     {cat.nome}
                   </button>
                 ))}
               </div>

               <div className="p-6">
                 
                 {/* LÓGICA DE ABA DE ARSENAL (ARMAS) */}
                 {activeTab === 'armas' ? (
                   <>
                     <div className="flex justify-between items-center mb-6">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-[#6b7b94]">Armas Equipadas</h4>
                       <button onClick={() => setIsAddingWeapon(!isAddingWeapon)} className="flex items-center gap-2 px-3 py-1.5 border border-[#4ad9d9]/30 text-[#4ad9d9] text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-[#4ad9d9] hover:text-[#090e17] transition-all"><Plus size={14}/> Nova Arma</button>
                     </div>

                     {isAddingWeapon && (
                       <div className="mb-6 p-4 bg-[#0a0f18] border border-[#4ad9d9]/30 rounded-xl space-y-4">
                         <div className="flex items-center gap-2 mb-2">
                           <span className="text-xs text-[#4ad9d9] font-bold uppercase">Preset:</span>
                           <select onChange={(e) => handleSelecionarArmaPreset(e.target.value)} className="bg-[#131b26] border border-[#2a3b52] text-white text-xs px-2 py-1 outline-none">
                             <option value="">Manual...</option>
                             {currentSys?.armas?.map((a:any) => <option key={a.nome} value={a.nome}>{a.nome}</option>)}
                           </select>
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                           <input type="text" placeholder="Nome Arma" value={newWeapon.nome} onChange={(e) => setNewWeapon({...newWeapon, nome: e.target.value})} className="bg-transparent border-b border-[#2a3b52] text-sm text-white px-2 py-1 outline-none focus:border-[#4ad9d9]" />
                           <input type="text" placeholder="Dano (Ex: 1d10)" value={newWeapon.dano} onChange={(e) => setNewWeapon({...newWeapon, dano: e.target.value})} className="bg-transparent border-b border-[#2a3b52] text-sm text-white px-2 py-1 outline-none focus:border-[#4ad9d9]" />
                           <input type="text" placeholder="Habilidade (Ex: Luta)" value={newWeapon.habilidade} onChange={(e) => setNewWeapon({...newWeapon, habilidade: e.target.value})} className="bg-transparent border-b border-[#2a3b52] text-sm text-white px-2 py-1 outline-none focus:border-[#4ad9d9]" />
                           <input type="text" placeholder="Crítico (Ex: 19/x2)" value={newWeapon.critico} onChange={(e) => setNewWeapon({...newWeapon, critico: e.target.value})} className="bg-transparent border-b border-[#2a3b52] text-sm text-white px-2 py-1 outline-none focus:border-[#4ad9d9]" />
                         </div>
                         <input type="text" placeholder="Descrição rápida..." value={newWeapon.desc} onChange={(e) => setNewWeapon({...newWeapon, desc: e.target.value})} className="w-full bg-transparent border-b border-[#2a3b52] text-sm text-[#6b7b94] px-2 py-1 outline-none focus:border-[#4ad9d9]" />
                         <button onClick={adicionarArma} className="bg-[#4ad9d9] text-[#090e17] px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest mt-2">Adicionar</button>
                       </div>
                     )}

                     <div className="space-y-4">
                       {ficha.dados.armas?.length === 0 && <p className="text-center py-10 text-[#2a3b52] text-xs font-bold uppercase">Arsenal vazio.</p>}
                       {ficha.dados.armas?.map((a: any) => (
                         <div key={a.id} className="bg-[#0a0f18] border border-[#1a2b4c] p-4 rounded-xl relative group">
                           <button onClick={() => atualizarFicha('armas', ficha.dados.armas.filter((x:any) => x.id !== a.id))} className="absolute top-4 right-4 text-[#2a3b52] hover:text-red-500"><Trash2 size={16}/></button>
                           <div className="flex items-end gap-4 mb-2">
                             <h5 className="text-[#f0ebd8] font-black text-lg">{a.nome}</h5>
                             <span className="text-[10px] text-[#4ad9d9] font-bold uppercase mb-1">{a.habilidade}</span>
                           </div>
                           <div className="flex gap-4 text-xs font-mono text-[#6b7b94] mb-2">
                             <span className="bg-[#131b26] px-2 py-1 rounded text-[#ef4444] border border-red-900/30">Dano: {a.dano}</span>
                             <span className="bg-[#131b26] px-2 py-1 rounded">Crit: {a.critico}</span>
                           </div>
                           {a.desc && <p className="text-[10px] text-[#6b7b94]">{a.desc}</p>}
                         </div>
                       ))}
                     </div>
                   </>
                 ) : (
                   /* LÓGICA DE ABAS DE HABILIDADES/PODERES */
                   <>
                     <div className="flex justify-between items-center mb-6">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-[#6b7b94]">Lista de {currentSys?.categorias_hab.find((c:any) => c.id === activeTab)?.nome}</h4>
                       <button onClick={() => setIsAddingSkill(!isAddingSkill)} className="flex items-center gap-2 px-3 py-1.5 border border-[#4ad9d9]/30 text-[#4ad9d9] text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-[#4ad9d9] hover:text-[#090e17] transition-all"><Plus size={14}/> Novo</button>
                     </div>

                     {isAddingSkill && (
                       <div className="mb-6 p-4 bg-[#0a0f18] border border-[#4ad9d9]/30 rounded-xl space-y-3">
                         <input type="text" placeholder="Nome (Ex: Furtividade)" value={newSkill.nome} onChange={(e) => setNewSkill({...newSkill, nome: e.target.value})} className="w-full bg-transparent border-b border-[#2a3b52] text-sm text-white px-2 py-1 outline-none focus:border-[#4ad9d9]" />
                         <input type="text" placeholder="Dado/Custo Opcional (Ex: 1d20+2 ou 2 PE)" value={newSkill.dado} onChange={(e) => setNewSkill({...newSkill, dado: e.target.value})} className="w-full bg-transparent border-b border-[#2a3b52] text-sm text-white px-2 py-1 outline-none focus:border-[#4ad9d9]" />
                         <textarea placeholder="Descrição (O que faz?)" value={newSkill.desc} onChange={(e) => setNewSkill({...newSkill, desc: e.target.value})} className="w-full bg-transparent border-b border-[#2a3b52] text-sm text-[#6b7b94] px-2 py-1 outline-none focus:border-[#4ad9d9] resize-none" rows={2}/>
                         <button onClick={adicionarHabilidade} className="bg-[#4ad9d9] text-[#090e17] px-6 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest">Incluir</button>
                       </div>
                     )}

                     <div className="space-y-3">
                       {ficha.dados.habilidades.filter((h: any) => h.cat === activeTab).length === 0 && <p className="text-center py-10 text-[#2a3b52] text-xs font-bold uppercase">Nenhum registro.</p>}
                       {ficha.dados.habilidades.filter((h: any) => h.cat === activeTab).map((h: any) => (
                         <div key={h.id} className="group bg-[#0a0f18] border border-[#1a2b4c] p-4 rounded-xl hover:border-[#4ad9d9]/40 transition-all relative">
                           <button onClick={() => atualizarFicha('habilidades', ficha.dados.habilidades.filter((x:any) => x.id !== h.id))} className="absolute top-4 right-4 text-[#2a3b52] hover:text-red-500"><Trash2 size={16}/></button>
                           <div className="flex items-center gap-3 mb-1">
                             <span className="text-[#f0ebd8] font-bold text-sm">{h.nome}</span>
                             {h.dado && <span className="bg-[#131b26] text-[#4ad9d9] px-2 py-0.5 rounded font-mono text-[10px] border border-[#2a3b52]">{h.dado}</span>}
                           </div>
                           {h.desc && <p className="text-[#6b7b94] text-[10px] mt-2 pr-6 leading-relaxed">{h.desc}</p>}
                         </div>
                       ))}
                     </div>
                   </>
                 )}

               </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
