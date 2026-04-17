"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../src/lib/supabase';
import { Cinzel, Inter } from 'next/font/google';
import { Camera, Plus, ArrowLeft, Trash2, Minus, Shield } from 'lucide-react';
import { PRESETS } from '../../../src/lib/constants';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700', '900'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '600', '700', '900'] });

const PERICIAS_ORDEM = [
  { nome: 'Acrobacia', atr: 'agilidade' }, { nome: 'Adestramento', atr: 'presenca' }, { nome: 'Artes', atr: 'presenca' },
  { nome: 'Atletismo', atr: 'forca' }, { nome: 'Atualidades', atr: 'intelecto' }, { nome: 'Ciências', atr: 'intelecto' },
  { nome: 'Crime', atr: 'agilidade' }, { nome: 'Diplomacia', atr: 'presenca' }, { nome: 'Enganação', atr: 'presenca' },
  { nome: 'Fortitude', atr: 'vigor' }, { nome: 'Furtividade', atr: 'agilidade' }, { nome: 'Iniciativa', atr: 'agilidade' },
  { nome: 'Intimidação', atr: 'presenca' }, { nome: 'Intuição', atr: 'presenca' }, { nome: 'Investigação', atr: 'intelecto' },
  { nome: 'Luta', atr: 'forca' }, { nome: 'Medicina', atr: 'intelecto' }, { nome: 'Ocultismo', atr: 'intelecto' },
  { nome: 'Percepção', atr: 'presenca' }, { nome: 'Pilotagem', atr: 'agilidade' }, { nome: 'Pontaria', atr: 'agilidade' },
  { nome: 'Profissão', atr: 'intelecto' }, { nome: 'Reflexos', atr: 'agilidade' }, { nome: 'Religião', atr: 'presenca' },
  { nome: 'Sobrevivência', atr: 'intelecto' }, { nome: 'Tática', atr: 'intelecto' }, { nome: 'Tecnologia', atr: 'intelecto' },
  { nome: 'Vontade', atr: 'presenca' }
];

export default function FichaPersonagemPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ficha, setFicha] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pericias');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkill, setNewSkill] = useState({ nome: "", dado: "", desc: "" });

  useEffect(() => { carregarFicha(); }, [id]);

  const carregarFicha = async () => {
    const { data } = await supabase.from('fichas').select('*').eq('id', id).single();
    if (data) {
      if (!data.dados.habilidades) data.dados.habilidades = [];
      if (!data.dados.armas) data.dados.armas = [];
      if (!data.dados.pericias) data.dados.pericias = {};
      if (!data.dados.defesa) data.dados.defesa = { passiva: 10, bloqueio: 0, esquiva: 0 };
      if (!data.dados.atributos) data.dados.atributos = { forca: 1, agilidade: 1, vigor: 1, intelecto: 1, presenca: 1 };
      
      setFicha(data);
    }
    setLoading(false);
  };

  const recalcularMaximos = (dadosAtuais: any, sistema: string) => {
    const atr = dadosAtuais.atributos || { forca:1, agilidade:1, vigor:1, intelecto:1, presenca:1 };
    const nex = dadosAtuais.nex || 5;
    const lv = Math.max(1, Math.floor(nex / 5));

    if (sistema === 'ordem_paranormal') return {
      vida: { ...dadosAtuais.status?.vida, max: Math.max(1, 16 + atr.vigor + (lv - 1) * (4 + atr.vigor)) },
      sanidade: { ...dadosAtuais.status?.sanidade, max: Math.max(0, 12 + atr.presenca + (lv - 1) * (3 + atr.presenca)) },
      estamina: { ...dadosAtuais.status?.estamina, max: Math.max(0, 10 + atr.intelecto + (lv - 1) * (2 + atr.intelecto)) }
    };
    
    return {
      vida: { ...dadosAtuais.status?.vida, max: Math.max(1, 20 + atr.vigor + (lv - 1) * (6 + atr.vigor)) },
      sanidade: { ...dadosAtuais.status?.sanidade, max: 0 },
      estamina: { ...dadosAtuais.status?.estamina, max: Math.max(0, 12 + atr.intelecto + (lv - 1) * (3 + atr.intelecto)) }
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

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-purple-500 font-mono tracking-widest animate-pulse">Sincronizando Realidade...</div>;

  const isOP = ficha.sistema_preset === 'ordem_paranormal';
  const noArrows = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <main className="min-h-screen w-full bg-[#111111] text-gray-300 relative pb-32 font-sans selection:bg-purple-900 selection:text-white">
      
      {/* HEADER GLOBAL */}
      <header className="bg-[#0a0a0a] border-b border-gray-800 p-4 px-8 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button onClick={() => router.push('/fichas')} className="text-xs uppercase tracking-widest text-gray-500 hover:text-white flex items-center gap-2 transition-colors"><ArrowLeft size={14}/> Voltar</button>
          <select value={ficha.sistema_preset} onChange={(e) => {
             const novosStatus = recalcularMaximos(ficha.dados, e.target.value);
             setFicha({ ...ficha, sistema_preset: e.target.value, dados: { ...ficha.dados, status: novosStatus } });
          }} className="bg-transparent text-purple-400 text-[10px] uppercase tracking-widest font-bold outline-none cursor-pointer border border-gray-800 rounded px-2 py-1">
            <option value="ordem_paranormal" className="bg-[#111]">Ordem Paranormal</option>
            <option value="dnd5e" className="bg-[#111]">D&D 5e</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsDeleteModalOpen(true)} className="p-2 border border-red-900/50 text-red-500 rounded hover:bg-red-900/20 transition-all"><Trash2 size={16}/></button>
          <button onClick={salvarNoBanco} disabled={isSaving} className="bg-purple-600 text-white px-6 py-2 rounded text-xs uppercase tracking-widest font-bold hover:bg-purple-500 transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)]">
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-6 mt-4">
        
        {/* LAYOUT ORDEM PARANORMAL (CLONE C.R.I.S) */}
        {isOP ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* COLUNA ESQUERDA: Avatar, Pentagrama, Status Secundários */}
            <div className="xl:col-span-4 flex flex-col items-center space-y-8">
              
              {/* Avatar C.R.I.S Style */}
              <div className="w-full flex gap-4">
                <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 bg-gray-900 border border-gray-700 rounded overflow-hidden cursor-pointer flex-shrink-0 flex items-center justify-center hover:border-purple-500 transition-colors">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                  {isUploading ? <span className="text-xs text-purple-500 animate-pulse">...</span> : ficha.dados.avatar_url ? <img src={ficha.dados.avatar_url} className="w-full h-full object-cover" /> : <Camera size={24} className="text-gray-600" />}
                </div>
                <div className="flex-1 space-y-3">
                   <div className="border-b border-gray-700 pb-1 flex items-end">
                     <span className="text-[9px] uppercase tracking-widest text-gray-500 w-24">Personagem</span>
                     <input type="text" value={ficha.nome_personagem} onChange={(e) => setFicha({...ficha, nome_personagem: e.target.value})} className="bg-transparent text-white font-bold outline-none w-full" />
                   </div>
                   <div className="border-b border-gray-700 pb-1 flex items-end">
                     <span className="text-[9px] uppercase tracking-widest text-gray-500 w-24">Origem</span>
                     <input type="text" value={ficha.dados.origem} onChange={(e) => atualizarFicha('origem', e.target.value)} className="bg-transparent text-white text-sm outline-none w-full" />
                   </div>
                   <div className="border-b border-gray-700 pb-1 flex items-end">
                     <span className="text-[9px] uppercase tracking-widest text-gray-500 w-24">Classe</span>
                     <input type="text" value={ficha.dados.classe} onChange={(e) => atualizarFicha('classe', e.target.value)} className="bg-transparent text-white text-sm outline-none w-full" />
                   </div>
                </div>
              </div>

              {/* O PENTAGRAMA DE ATRIBUTOS */}
              <div className="relative w-[300px] h-[300px] my-4">
                {/* Círculo Central */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110px] h-[110px] rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center bg-black/50 backdrop-blur-sm z-0">
                  <span className={`${cinzel.className} font-black text-gray-400 tracking-widest text-xs`}>ATRIBUTOS</span>
                </div>
                
                {/* As 5 Pontas (Agilidade, Intelecto, Vigor, Presença, Força) */}
                {[
                  { id: 'agilidade', label: 'AGI', nome: 'AGILIDADE', top: '0%', left: '50%', tx: '-50%', ty: '0%' },
                  { id: 'intelecto', label: 'INT', nome: 'INTELECTO', top: '35%', left: '100%', tx: '-100%', ty: '-50%' },
                  { id: 'vigor', label: 'VIG', nome: 'VIGOR', top: '100%', left: '80%', tx: '-100%', ty: '-100%' },
                  { id: 'presenca', label: 'PRE', nome: 'PRESENÇA', top: '100%', left: '20%', tx: '0%', ty: '-100%' },
                  { id: 'forca', label: 'FOR', nome: 'FORÇA', top: '35%', left: '0%', tx: '0%', ty: '-50%' },
                ].map((atr) => (
                  <div key={atr.id} className="absolute flex flex-col items-center justify-center w-[80px] h-[80px] rounded-full border-2 border-gray-600 bg-[#0a0a0a] z-10 hover:border-purple-500 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.8)]" style={{ top: atr.top, left: atr.left, transform: `translate(${atr.tx}, ${atr.ty})` }}>
                    <input type="number" value={ficha.dados.atributos[atr.id]} onChange={(e) => atualizarFicha(`atributos.${atr.id}`, parseInt(e.target.value) || 0)} className={`bg-transparent text-center font-bold text-2xl text-white w-12 outline-none ${noArrows}`} />
                    <span className="text-[8px] font-bold text-gray-400 leading-tight uppercase tracking-tighter text-center">{atr.nome}<br/><span className="text-white">{atr.label}</span></span>
                  </div>
                ))}
              </div>

              {/* NEX, PE/Turno, Deslocamento */}
              <div className="flex gap-4 w-full justify-center">
                 <div className="flex flex-col items-center">
                   <div className="flex items-center border border-gray-700 bg-gray-900 rounded overflow-hidden">
                     <span className="text-[10px] font-bold px-2 text-gray-400">NEX</span>
                     <input type="number" value={ficha.dados.nex} onChange={(e) => {
                       const val = Math.max(0, parseInt(e.target.value) || 0);
                       const novosDados = { ...ficha.dados, nex: val };
                       setFicha({ ...ficha, dados: { ...novosDados, status: recalcularMaximos(novosDados, ficha.sistema_preset) } });
                     }} className={`w-12 bg-black text-white text-center py-1 font-bold outline-none border-l border-gray-700 ${noArrows}`} />
                     <span className="text-[10px] font-bold pr-2 bg-black text-gray-500">%</span>
                   </div>
                 </div>
                 <div className="flex flex-col items-center">
                   <div className="border border-gray-700 bg-black rounded p-1 px-4 min-w-[80px] text-center font-bold text-white text-sm">
                      {Math.max(1, Math.floor((ficha.dados.nex || 5) / 5))}
                   </div>
                   <span className="text-[8px] uppercase text-gray-500 mt-1 font-bold">PE / TURNO</span>
                 </div>
                 <div className="flex flex-col items-center">
                   <div className="border border-gray-700 bg-black rounded p-1 px-4 min-w-[100px] text-center font-bold text-white text-sm">
                      9m / 6q
                   </div>
                   <span className="text-[8px] uppercase text-gray-500 mt-1 font-bold">DESLOCAMENTO</span>
                 </div>
              </div>

            </div>

            {/* COLUNA DIREITA: Status, Defesas, Abas */}
            <div className="xl:col-span-8 space-y-6">
              
              {/* BARRAS DE STATUS ESTILO CRIS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Lado A: Barras Principais */}
                <div className="space-y-4">
                  {['vida', 'sanidade', 'estamina'].map(s => {
                    const stat = ficha.dados.status[s];
                    const isPE = s === 'estamina';
                    const colorHex = s === 'vida' ? '#dc2626' : s === 'sanidade' ? '#9333ea' : '#f97316';
                    const colorBg = s === 'vida' ? 'bg-red-600' : s === 'sanidade' ? 'bg-purple-600' : 'bg-orange-500';
                    const label = isPE ? 'ESFORÇO' : s;
                    
                    return (
                      <div key={s} className="flex items-center gap-4">
                         <div className="w-24 text-right">
                           <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
                         </div>
                         <div className="flex-1 flex border border-gray-800 rounded bg-[#111] overflow-hidden items-stretch h-10">
                           <button onClick={() => { const v = Math.max(0, stat.atual - 1); atualizarFicha(`status.${s}.atual`, v); }} className={`px-3 hover:bg-white/10 text-white font-bold transition-colors ${colorBg}`}>&lt;</button>
                           <div className={`flex-1 flex items-center justify-center relative ${colorBg}`}>
                              <div className="absolute top-0 right-0 h-full bg-[#1a1a1a] transition-all" style={{ width: `${100 - (stat.atual/stat.max)*100}%` }}></div>
                              <div className="relative z-10 flex items-center font-black text-white text-lg drop-shadow-md">
                                <input type="number" value={stat.atual} onChange={(e) => atualizarFicha(`status.${s}.atual`, Math.max(0, Math.min(stat.max, parseInt(e.target.value)||0)))} className={`bg-transparent text-right w-10 outline-none ${noArrows}`} />
                                <span>/{stat.max}</span>
                              </div>
                           </div>
                           <button onClick={() => { const v = Math.min(stat.max, stat.atual + 1); atualizarFicha(`status.${s}.atual`, v); }} className={`px-3 bg-[#1a1a1a] hover:bg-white/10 text-gray-500 transition-colors`}>&gt;</button>
                         </div>
                      </div>
                    );
                  })}
                </div>

                {/* Lado B: Defesas e Resistências */}
                <div className="space-y-6">
                  <div className="flex items-end gap-6">
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center w-14 h-16 bg-gray-900 border border-gray-600 rounded-t-full rounded-b-xl">
                        <Shield className="absolute text-gray-800 w-full h-full opacity-20" />
                        <input type="number" value={ficha.dados.defesa.passiva} onChange={(e) => atualizarFicha('defesa.passiva', parseInt(e.target.value)||0)} className={`bg-transparent text-white font-black text-xl text-center w-full z-10 outline-none ${noArrows}`} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12px] font-black text-gray-300 tracking-widest">DEFESA</span>
                        <span className="text-[9px] text-gray-600 font-mono">= 10 + AGI + Equip</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-gray-400 tracking-widest mb-1">BLOQUEIO</span>
                      <input type="number" value={ficha.dados.defesa.bloqueio} onChange={(e) => atualizarFicha('defesa.bloqueio', parseInt(e.target.value)||0)} className={`w-14 bg-transparent border-b-2 border-gray-700 text-center text-white font-bold outline-none focus:border-purple-500 ${noArrows}`} />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-gray-400 tracking-widest mb-1">ESQUIVA</span>
                      <input type="number" value={ficha.dados.defesa.esquiva} onChange={(e) => atualizarFicha('defesa.esquiva', parseInt(e.target.value)||0)} className={`w-14 bg-transparent border-b-2 border-gray-700 text-center text-white font-bold outline-none focus:border-purple-500 ${noArrows}`} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-end gap-2">
                      <span className="text-[10px] font-black text-gray-400 tracking-widest w-24">PROTEÇÃO</span>
                      <input type="text" className="flex-1 bg-transparent border-b border-gray-700 text-white text-sm outline-none focus:border-purple-500" />
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-[10px] font-black text-gray-400 tracking-widest w-24">RESISTÊNCIAS</span>
                      <input type="text" className="flex-1 bg-transparent border-b border-gray-700 text-white text-sm outline-none focus:border-purple-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* TABS DE NAVEGAÇÃO C.R.I.S */}
              <div className="border-b border-gray-800 flex overflow-x-auto scrollbar-hide pt-4">
                {[
                  { id: 'pericias', nome: 'PERÍCIAS' }, { id: 'combate', nome: 'COMBATE' },
                  { id: 'comum', nome: 'HABILIDADES' }, { id: 'rituais', nome: 'RITUAIS' }, { id: 'inventario', nome: 'INVENTÁRIO' }
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'text-purple-400 border-b-2 border-purple-500' : 'text-gray-600 hover:text-gray-300'}`}>
                    {tab.nome}
                  </button>
                ))}
              </div>

              {/* CONTEÚDO DAS ABAS */}
              <div className="py-4">
                
                {/* ABA DE PERÍCIAS (EXCLUSIVA OP) */}
                {activeTab === 'pericias' && (
                  <div className="bg-[#0f0f0f] border border-gray-800 rounded-lg p-4">
                    <div className="flex justify-between items-center border-b border-gray-800 pb-2 mb-4 px-2">
                      <span className="text-[10px] font-black text-gray-500 w-1/3">PERÍCIA</span>
                      <div className="flex w-2/3 justify-between text-center">
                        <span className="text-[9px] font-black text-gray-500 w-16">DADOS</span>
                        <span className="text-[9px] font-black text-gray-500 w-16">BÔNUS</span>
                        <span className="text-[9px] font-black text-gray-500 w-16">TREINO</span>
                        <span className="text-[9px] font-black text-gray-500 w-16">OUTROS</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {PERICIAS_ORDEM.map(p => {
                        const treinado = ficha.dados.pericias[p.nome]?.treino || 0;
                        const outros = ficha.dados.pericias[p.nome]?.outros || 0;
                        const atrVal = ficha.dados.atributos[p.atr] || 0;
                        const total = treinado + outros;
                        const isTrained = treinado > 0;

                        return (
                          <div key={p.nome} className={`flex justify-between items-center py-1 px-2 rounded hover:bg-white/5 ${isTrained ? 'text-green-500' : 'text-gray-400'}`}>
                            <div className="w-1/3 flex items-center gap-2">
                              <span className="cursor-pointer text-gray-600 hover:text-purple-400" title={`Rolar ${p.nome}`}>⬡</span>
                              <span className="text-sm font-bold">{p.nome}</span>
                            </div>
                            <div className="flex w-2/3 justify-between text-center items-center font-mono text-xs">
                              <span className="w-16 text-gray-500">( {atrVal} {p.atr.substring(0,3).toUpperCase()} )</span>
                              <span className="w-16 font-bold">( {total} )</span>
                              <input type="number" value={treinado} onChange={(e) => atualizarFicha(`pericias.${p.nome}.treino`, parseInt(e.target.value)||0)} className={`w-16 bg-transparent text-center border-b border-gray-700 outline-none focus:border-purple-500 ${isTrained ? 'text-green-500' : 'text-gray-400'} ${noArrows}`} />
                              <input type="number" value={outros} onChange={(e) => atualizarFicha(`pericias.${p.nome}.outros`, parseInt(e.target.value)||0)} className={`w-16 bg-transparent text-center border-b border-gray-700 outline-none focus:border-purple-500 ${isTrained ? 'text-green-500' : 'text-gray-400'} ${noArrows}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ABA DE HABILIDADES / RITUAIS */}
                {(activeTab === 'comum' || activeTab === 'rituais') && (
                  <div className="space-y-4">
                     <div className="flex justify-between">
                       <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{activeTab === 'rituais' ? 'Meus Rituais' : 'Minhas Habilidades'}</h4>
                       <button onClick={() => setIsAddingSkill(!isAddingSkill)} className="bg-purple-600/20 text-purple-400 border border-purple-600/50 px-4 py-1 rounded text-[10px] font-bold uppercase hover:bg-purple-600 hover:text-white transition-all">Adicionar</button>
                     </div>

                     {isAddingSkill && (
                       <div className="bg-[#111] border border-gray-800 p-4 rounded flex flex-col gap-3">
                         <input type="text" placeholder="Nome (Ex: Decadência)" value={newSkill.nome} onChange={(e) => setNewSkill({...newSkill, nome: e.target.value})} className="bg-transparent border-b border-gray-700 text-sm outline-none focus:border-purple-500 p-1" />
                         <input type="text" placeholder="Custo (Ex: 1 PE)" value={newSkill.dado} onChange={(e) => setNewSkill({...newSkill, dado: e.target.value})} className="bg-transparent border-b border-gray-700 text-sm outline-none focus:border-purple-500 p-1" />
                         <textarea placeholder="Descrição completa..." value={newSkill.desc} onChange={(e) => setNewSkill({...newSkill, desc: e.target.value})} className="bg-transparent border-b border-gray-700 text-sm outline-none focus:border-purple-500 p-1 resize-none" rows={2}/>
                         <button onClick={adicionarHabilidade} className="bg-purple-600 text-white py-2 rounded text-[10px] font-bold uppercase self-end px-6">Salvar</button>
                       </div>
                     )}

                     {ficha.dados.habilidades?.filter((h:any) => h.cat === activeTab).map((h:any) => (
                       <div key={h.id} className="bg-[#111] border border-gray-800 rounded p-4 group relative">
                         <button onClick={() => atualizarFicha('habilidades', ficha.dados.habilidades.filter((x:any) => x.id !== h.id))} className="absolute top-4 right-4 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                         <div className="flex gap-4 items-center mb-2">
                           <h5 className="font-bold text-white text-lg">{h.nome}</h5>
                           {h.dado && <span className="bg-gray-900 border border-gray-700 text-purple-400 px-2 py-0.5 rounded text-[10px] font-mono">{h.dado}</span>}
                         </div>
                         <p className="text-xs text-gray-400 whitespace-pre-wrap leading-relaxed pr-8">{h.desc}</p>
                       </div>
                     ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* SE FOR D&D, RENDERIZA O LAYOUT DE BLOCOS BÁSICO (Omitido visualmente, simplificado para não quebrar limite) */
          <div className="flex flex-col items-center justify-center py-20">
             <span className="text-gray-500 italic">Layout D&D Ativo. (Troque para Ordem Paranormal no menu superior para ver o modo C.R.I.S)</span>
          </div>
        )}
      </div>
    </main>
  );
}
