"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../src/lib/supabase';
import { Cinzel, Inter } from 'next/font/google';
import { Camera, Plus, Swords, Save, ArrowLeft, Trash2, Minus } from 'lucide-react';
// IMPORTANDO O NOSSO DICIONÁRIO DE DADOS
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

  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkill, setNewSkill] = useState({ nome: "", dado: "", cat: "comum" });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => { carregarFicha(); }, [id]);

  const carregarFicha = async () => {
    const { data } = await supabase.from('fichas').select('*').eq('id', id).single();
    if (data) {
      if (!data.dados.habilidades) data.dados.habilidades = [];
      setFicha(data);
      const sys = PRESETS[data.sistema_preset as keyof typeof PRESETS];
      if (sys) setActiveTab(sys.categorias_hab[0].id);
    }
    setLoading(false);
  };

  const recalcularMaximos = (dadosAtuais: any, sistema: string) => {
    const atr = dadosAtuais.atributos;
    const lv = sistema === 'ordem_paranormal' ? Math.max(1, Math.floor(dadosAtuais.nex / 5)) : (dadosAtuais.nivel || 1);
    const modVig = Math.floor((atr.vigor - 10) / 2);
    const modSab = Math.floor((atr.sabedoria - 10) / 2);
    const modInt = Math.floor((atr.intelecto - 10) / 2);

    if (sistema === 'ordem_paranormal') return {
      vida: { ...dadosAtuais.status.vida, max: 16 + modVig + (lv - 1) * (4 + modVig) },
      sanidade: { ...dadosAtuais.status.sanidade, max: 12 + modSab + (lv - 1) * (3 + modSab) },
      estamina: { ...dadosAtuais.status.estamina, max: 10 + modInt + (lv - 1) * (2 + modInt) }
    };
    
    const vBase = sistema === 'dnd5e' ? 10 : 20;
    return {
      vida: { ...dadosAtuais.status.vida, max: vBase + modVig + (lv - 1) * (6 + modVig) },
      sanidade: { ...dadosAtuais.status.sanidade, max: sistema === 'dnd5e' ? 0 : 15 + modSab + (lv - 1) * (4 + modSab) },
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

  const adicionarHabilidade = () => {
    if (!newSkill.nome) return;
    const habs = [...ficha.dados.habilidades, { ...newSkill, id: Date.now(), cat: activeTab }];
    atualizarFicha('habilidades', habs);
    setNewSkill({ nome: "", dado: "", cat: activeTab });
    setIsAddingSkill(false);
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const path = `retratos/${id}-${Date.now()}.png`;
    const { data } = await supabase.storage.from('avatares').upload(path, file);
    if (data) {
      const { data: { publicUrl } } = supabase.storage.from('avatares').getPublicUrl(path);
      atualizarFicha('avatar_url', publicUrl);
    }
    setIsUploading(false);
  };

  const salvarNoBanco = async () => {
    setIsSaving(true);
    await supabase.from('fichas').update({ nome_personagem: ficha.nome_personagem, sistema_preset: ficha.sistema_preset, dados: ficha.dados }).eq('id', id);
    setIsSaving(false);
  };

  const mudarSistema = (s: string) => {
    const novosStatus = recalcularMaximos(ficha.dados, s);
    setFicha({ ...ficha, sistema_preset: s, dados: { ...ficha.dados, status: novosStatus } });
  };

  const atualizarProgressao = (val: number, tipo: 'nex' | 'nivel') => {
    const novosDados = { ...ficha.dados, [tipo]: Math.max(tipo === 'nivel' ? 1 : 0, val) };
    setFicha({ ...ficha, dados: { ...novosDados, status: recalcularMaximos(novosDados, ficha.sistema_preset) } });
  };

  const atualizarAtributo = (key: string, val: number) => {
    const novosDados = { ...ficha.dados, atributos: { ...ficha.dados.atributos, [key]: val } };
    setFicha({ ...ficha, dados: { ...novosDados, status: recalcularMaximos(novosDados, ficha.sistema_preset) } });
  };

  const atualizarStatusAtual = (stat: string, val: string, inc = false) => {
    const v = parseInt(val) || 0;
    const s = ficha.dados.status[stat];
    let novo = inc ? s.atual + v : v;
    novo = Math.max(0, Math.min(s.max, novo));
    setFicha({ ...ficha, dados: { ...ficha.dados, status: { ...ficha.dados.status, [stat]: { ...s, atual: novo } } } });
  };

  if (loading) return <div className="h-screen bg-[#090e17] flex items-center justify-center text-[#4ad9d9] font-mono tracking-tighter animate-pulse">SINCRONIZANDO COM A NÉVOA...</div>;

  const currentSys = PRESETS[ficha.sistema_preset as keyof typeof PRESETS];
  const isOP = ficha.sistema_preset === 'ordem_paranormal';

  return (
    <main className="min-h-screen bg-[#090e17] text-[#8b9bb4] p-4 md:p-8 relative overflow-y-auto pb-32">
      <div className="fixed top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_#1a2b4c33_0%,_transparent_100%)] pointer-events-none" />

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090e17]/90 backdrop-blur-sm px-4">
          <div className="bg-[#131b26] border border-red-900/50 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className={`${cinzel.className} text-red-400 text-2xl mb-4`}>Apagar Registro?</h2>
            <div className="flex gap-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 border border-[#2a3b52] py-3 rounded-lg text-white text-xs uppercase tracking-widest hover:bg-white/5 transition-colors">Cancelar</button>
              <button onClick={async () => { await supabase.from('fichas').delete().eq('id', id); router.push('/fichas'); }} className="flex-1 bg-red-900/50 text-red-300 border border-red-900 py-3 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors">Apagar</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="flex flex-col md:flex-row justify-between gap-6 mb-12 border-b border-[#2a3b52] pb-8">
          <div className="flex-1 space-y-2">
            <button onClick={() => router.push('/fichas')} className="text-[10px] uppercase tracking-[0.3em] text-[#4ad9d9] hover:text-white transition-all flex items-center gap-2 mb-4"><ArrowLeft size={12}/> Voltar ao Hub</button>
            <div className="flex gap-2">
               <select value={ficha.sistema_preset} onChange={(e) => { mudarSistema(e.target.value); }} className="bg-[#131b26] border border-[#2a3b52] text-[10px] text-[#4ad9d9] px-2 py-1 rounded uppercase font-bold outline-none cursor-pointer">
                 <option value="ordem_paranormal">Ordem Paranormal</option>
                 <option value="dnd5e">D&D 5e</option>
                 <option value="memorias_postumas">Memórias Póstumas</option>
               </select>
            </div>
            <input type="text" value={ficha.nome_personagem} onChange={(e) => setFicha({...ficha, nome_personagem: e.target.value})} className={`${cinzel.className} bg-transparent text-white text-4xl md:text-6xl font-black focus:outline-none w-full border-b border-transparent focus:border-[#4ad9d9] transition-all`} />
          </div>
          
          <div className="flex md:flex-col gap-3">
             <button onClick={salvarNoBanco} disabled={isSaving} className="bg-[#4ad9d9] text-[#090e17] px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(74,217,217,0.2)]">{isSaving ? 'Gravando...' : 'Salvar Alterações'}</button>
             <button onClick={() => setIsDeleteModalOpen(true)} className="p-2 border border-red-900/30 text-red-400 rounded-full flex items-center justify-center hover:bg-red-900/20 transition-all"><Trash2 size={16}/></button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div onClick={() => fileInputRef.current?.click()} className="relative aspect-[3/4] bg-[#131b26] border border-[#2a3b52] rounded-3xl overflow-hidden group cursor-pointer shadow-lg">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              {isUploading ? <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 text-[#4ad9d9] animate-pulse font-bold tracking-widest text-xs uppercase">Enviando...</div> : null}
              {ficha.dados.avatar_url ? <img src={ficha.dados.avatar_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /> : <div className="w-full h-full flex flex-col items-center justify-center text-[#2a3b52] group-hover:text-[#4ad9d9] transition-colors"><Camera size={48}/><span className="text-[10px] mt-4 font-bold tracking-widest transition-colors">DEFINIR RETRATO</span></div>}
            </div>

            <div className="bg-[#131b26] border border-[#2a3b52] rounded-3xl p-6 space-y-6 relative overflow-hidden shadow-lg">
               <div className="absolute top-0 right-0 bg-[#4ad9d9] text-[#090e17] px-4 py-2 font-black text-xl rounded-bl-2xl">
                 <input type="number" value={isOP ? ficha.dados.nex : ficha.dados.nivel} onChange={(e) => atualizarProgressao(parseInt(e.target.value) || 0, isOP ? 'nex' : 'nivel')} className="bg-transparent w-10 text-center outline-none" />
                 <span className="text-[8px] block -mt-1">{isOP ? 'NEX' : 'LVL'}</span>
               </div>

               <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] uppercase font-black text-[#4ad9d9] tracking-widest">Origem</label>
                      <select value={ficha.dados.origem} onChange={(e) => atualizarFicha('origem', e.target.value)} className="w-full bg-transparent border-b border-[#2a3b52] text-white py-1 outline-none text-sm cursor-pointer">
                        <option value="">Selecionar...</option>
                        {currentSys?.origens.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-black text-[#4ad9d9] tracking-widest">Classe</label>
                      <select value={ficha.dados.classe} onChange={(e) => atualizarFicha('classe', e.target.value)} className="w-full bg-transparent border-b border-[#2a3b52] text-white py-1 outline-none text-sm cursor-pointer">
                        <option value="">Selecionar...</option>
                        {currentSys?.classes.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div><label className="text-[9px] uppercase font-black text-[#4ad9d9] tracking-widest">Idade</label><input type="text" value={ficha.dados.idade} onChange={(e) => atualizarFicha('idade', e.target.value)} className="w-full bg-transparent border-b border-[#2a3b52] text-white py-1 outline-none text-sm" /></div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['vida', 'sanidade', 'estamina'].map(s => {
                const stat = ficha.dados.status[s];
                if (s === 'sanidade' && ficha.sistema_preset === 'dnd5e') return null;
                const color = s === 'vida' ? '#ef4444' : s === 'sanidade' ? '#a855f7' : '#eab308';
                const label = s === 'estamina' && isOP ? 'PE' : s;
                return (
                  <div key={s} className="bg-[#131b26] border border-[#2a3b52] rounded-3xl p-5 group shadow-lg">
                    <div className="flex justify-between items-end mb-3">
                      <span className="text-[10px] uppercase font-black tracking-widest" style={{ color }}>{label}</span>
                      <div className="flex items-center gap-1">
                        <input type="number" value={stat.atual} onChange={(e) => atualizarStatusAtual(s, e.target.value)} className="bg-transparent text-right font-black text-xl text-white w-12 outline-none border-b border-transparent focus:border-[#4ad9d9] transition-colors" />
                        <span className="text-[#2a3b52] font-black">/</span>
                        <span className="text-xs font-bold text-[#6b7b94]">{stat.max}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-[#0a0f18] rounded-full overflow-hidden border border-[#2a3b52]">
                      <div className="h-full transition-all duration-500 shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ width: `${(stat.atual/stat.max)*100}%`, backgroundColor: color }} />
                    </div>
                    <div className="flex justify-between mt-4">
                      <button onClick={() => atualizarStatusAtual(s, '-1', true)} className="p-2 border border-[#2a3b52] text-[#6b7b94] hover:text-white hover:bg-white/5 rounded-lg transition-colors"><Minus size={14}/></button>
                      <button onClick={() => atualizarStatusAtual(s, '1', true)} className="p-2 border border-[#2a3b52] text-[#6b7b94] hover:text-white hover:bg-white/5 rounded-lg transition-colors"><Plus size={14}/></button>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="bg-[#131b26] border border-[#2a3b52] rounded-3xl p-8 shadow-lg">
               <h3 className={`${cinzel.className} text-white text-xs tracking-[0.4em] mb-8 opacity-50`}>MATRIZ DE ATRIBUTOS</h3>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                 {Object.entries(ficha.dados.atributos).map(([k, v]: any) => (
                   <div key={k} className="flex flex-col items-center gap-2 group">
                     <div className="relative w-full aspect-square flex items-center justify-center bg-[#0a0f18] border border-[#2a3b52] rounded-2xl group-hover:border-[#4ad9d9] transition-all">
                        <input type="number" value={v} onChange={(e) => atualizarAtributo(k, parseInt(e.target.value) || 0)} className="bg-transparent text-center font-black text-2xl text-white w-full outline-none" />
                        <div className="absolute -bottom-2 bg-[#131b26] border border-[#2a3b52] px-2 rounded text-[10px] font-bold text-[#4ad9d9]">
                          {Math.floor((v-10)/2) >= 0 ? `+${Math.floor((v-10)/2)}` : Math.floor((v-10)/2)}
                        </div>
                     </div>
                     <span className="text-[9px] uppercase font-black tracking-tighter mt-2">{k}</span>
                   </div>
                 ))}
               </div>
            </section>

            <section className="bg-[#131b26] border border-[#2a3b52] rounded-3xl overflow-hidden shadow-lg">
               <div className="flex border-b border-[#2a3b52] overflow-x-auto scrollbar-hide">
                 {currentSys?.categorias_hab.map(cat => {
                   const Icon = cat.icon;
                   return (
                     <button 
                       key={cat.id} 
                       onClick={() => setActiveTab(cat.id)}
                       className={`flex-1 py-4 px-6 text-[10px] uppercase font-black tracking-widest flex items-center justify-center gap-2 transition-all min-w-[150px] ${activeTab === cat.id ? 'bg-[#1a2b4c] text-[#4ad9d9]' : 'text-[#6b7b94] hover:bg-white/5'}`}
                     >
                       <Icon size={14}/> {cat.nome}
                     </button>
                   );
                 })}
               </div>

               <div className="p-8">
                 <div className="flex justify-between items-center mb-6">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-[#4ad9d9]">Lista de Ativos</h4>
                   <button onClick={() => setIsAddingSkill(!isAddingSkill)} className="p-2 border border-[#4ad9d9]/30 text-[#4ad9d9] rounded-full hover:bg-[#4ad9d9] hover:text-[#090e17] transition-all"><Plus size={16}/></button>
                 </div>

                 {isAddingSkill && (
                   <div className="flex flex-col md:flex-row gap-3 mb-8 p-4 bg-[#0a0f18] border border-[#4ad9d9]/30 rounded-2xl shadow-inner">
                     <input type="text" placeholder="Nome do Poder/Magia" value={newSkill.nome} onChange={(e) => setNewSkill({...newSkill, nome: e.target.value})} className="bg-transparent border-b border-[#2a3b52] text-sm text-white px-2 py-2 w-full outline-none focus:border-[#4ad9d9] transition-colors" />
                     <input type="text" placeholder="Dado/Custo" value={newSkill.dado} onChange={(e) => setNewSkill({...newSkill, dado: e.target.value})} className="bg-transparent border-b border-[#2a3b52] text-sm text-white px-2 py-2 w-full md:w-32 outline-none focus:border-[#4ad9d9] transition-colors" />
                     <button onClick={adicionarHabilidade} className="bg-[#4ad9d9] text-[#090e17] px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-colors">Adicionar</button>
                   </div>
                 )}

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {ficha.dados.habilidades.filter((h: any) => h.cat === activeTab).length === 0 && (
                     <p className="col-span-2 text-center py-12 text-[#2a3b52] text-xs italic">Nenhum registro nesta categoria.</p>
                   )}
                   {ficha.dados.habilidades.filter((h: any) => h.cat === activeTab).map((h: any) => (
                     <div key={h.id} className="group flex justify-between items-center bg-[#0a0f18] border border-[#1a2b4c] p-4 rounded-2xl hover:border-[#4ad9d9]/50 transition-all shadow-md">
                       <span className="text-white font-bold text-sm tracking-tight">{h.nome}</span>
                       <div className="flex items-center gap-3">
                         <span className="bg-[#1a2b4c] text-[#4ad9d9] px-3 py-1 rounded-lg font-mono text-[10px] border border-[#2a3b52]">{h.dado}</span>
                         <button onClick={() => atualizarFicha('habilidades', ficha.dados.habilidades.filter((x:any) => x.id !== h.id))} className="text-red-900 opacity-0 group-hover:opacity-100 transition-all hover:text-red-500"><Trash2 size={16}/></button>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
