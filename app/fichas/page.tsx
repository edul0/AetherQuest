"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../src/lib/supabase';
import { Cinzel, Inter } from 'next/font/google';
import { Camera, Plus, ArrowLeft, Trash2, Minus, Shield, Zap } from 'lucide-react';
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

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-purple-500 font-mono tracking-widest animate-pulse">Sincronizando Realidade...</div>;

  const isOP = ficha.sistema_preset === 'ordem_paranormal';
  const noArrows = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  // Classes de input reutilizáveis no tom roxo neon
  const inputClass = "bg-transparent text-white text-sm outline-none border-b border-gray-800 focus:border-purple-500 hover:border-gray-600 transition-colors p-1 placeholder:text-gray-700";

  return (
    // FUNDO PRETO PURO CONFORME A IMAGEM
    <main className={`min-h-screen w-full bg-black text-gray-300 relative pb-32 ${inter.className} selection:bg-purple-900 selection:text-white`}>
      
      {/* HEADER NO ESTILO "FLUTUANTE" COM BLUR E BORDA ROXA SUBTIL */}
      <header className="bg-black/90 backdrop-blur-sm border-b border-purple-900/50 p-4 px-8 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button onClick={() => router.push('/fichas')} className="text-xs uppercase tracking-widest text-gray-500 hover:text-white flex items-center gap-2 transition-colors"><ArrowLeft size={14}/> Voltar</button>
          <select value={ficha.sistema_preset} onChange={(e) => {
             const novosStatus = recalcularMaximos(ficha.dados, e.target.value);
             setFicha({ ...ficha, sistema_preset: e.target.value, dados: { ...ficha.dados, status: novosStatus } });
          }} className="bg-gray-950 text-purple-400 text-[10px] uppercase tracking-widest font-bold outline-none cursor-pointer border border-purple-900/50 rounded px-2 py-1 hover:border-purple-500 transition-colors">
            <option value="ordem_paranormal" className="bg-black">Ordem Paranormal</option>
            <option value="dnd5e" className="bg-black">D&D 5e</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsDeleteModalOpen(true)} className="p-2 border border-red-900/50 text-red-500 rounded hover:bg-red-950 transition-all"><Trash2 size={16}/></button>
          <button onClick={salvarNoBanco} disabled={isSaving} className="bg-purple-600 text-white px-6 py-2 rounded text-xs uppercase tracking-widest font-bold hover:bg-purple-500 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            {isSaving ? 'Salvando...' : 'Salvar Ficha'}
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-6 mt-4">
        
        {isOP ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* COLUNA ESQUERDA (Identidade e Pentagrama) */}
            <div className="xl:col-span-4 flex flex-col items-center space-y-8">
              
              {/* Header de Identidade estilo CRIS */}
              <div className="w-full flex gap-4 bg-gray-950/60 p-4 rounded-xl border border-gray-800">
                <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 bg-black border border-gray-700 rounded overflow-hidden cursor-pointer flex-shrink-0 flex items-center justify-center hover:border-purple-500 transition-colors shadow-inner relative group">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                  {isUploading ? <span className="text-xs text-purple-500 animate-pulse">...</span> : ficha.dados.avatar_url ? <img src={ficha.dados.avatar_url} className="w-full h-full object-cover" /> : <Camera size={24} className="text-gray-600 group-hover:text-purple-400" />}
                </div>
                <div className="flex-1 space-y-3 pt-1">
                   {[
                     { label: 'Personagem', caminho: 'nome_personagem', val: ficha.nome_personagem },
                     { label: 'Origem', caminho: 'dados.origem', val: ficha.dados.origem },
                     { label: 'Classe', caminho: 'dados.classe', val: ficha.dados.classe }
                   ].map(field => (
                     <div key={field.label} className="border-b border-gray-800 pb-1 flex items-end">
                       <span className="text-[9px] uppercase tracking-widest text-gray-500 w-24 flex-shrink-0 font-bold">{field.label}</span>
                       <input type="text" value={field.val} onChange={(e) => field.caminho === 'nome_personagem' ? setFicha({...ficha, nome_personagem: e.target.value}) : atualizarFicha(field.caminho, e.target.value)} className="bg-transparent text-white font-bold outline-none w-full text-sm placeholder:text-gray-800" placeholder="Vazio" />
                     </div>
                   ))}
                </div>
              </div>

              {/* O PENTAGRAMA (Matemática Visual) com ROXO NEON */}
              <div className="relative w-[320px] h-[320px] my-6 flex items-center justify-center">
                
                {/* As Linhas Conectoras do Pentagrama (CSS Art) */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[50px] left-[160px] w-0.5 h-[220px] bg-purple-900/30 -translate-x-1/2" />
                    <div className="absolute top-[160px] left-[50px] w-[220px] h-0.5 bg-purple-900/30 -translate-y-1/2" />
                    <div className="absolute top-[160px] left-[50px] w-[220px] h-0.5 bg-purple-900/30 -translate-y-1/2 rotate-45" />
                    <div className="absolute top-[160px] left-[50px] w-[220px] h-0.5 bg-purple-900/30 -translate-y-1/2 -rotate-45" />
                </div>

                {/* Círculo Central Sombrio */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110px] h-[110px] rounded-full border border-gray-800 flex items-center justify-center bg-black z-10 shadow-[0_0_30px_rgba(0,0,0,1)]">
                  <span className={`${cinzel.className} font-black text-gray-600 tracking-widest text-[11px]`}>ATRIBUTOS</span>
                </div>
                
                {/* As 5 Pontas Flutuantes */}
                {[
                  { id: 'agilidade', label: 'AGI', nome: 'AGILIDADE', top: '0%', left: '50%', tx: '-50%', ty: '0%' },
                  { id: 'intelecto', label: 'INT', nome: 'INTELECTO', top: '35%', left: '100%', tx: '-100%', ty: '-50%' },
                  { id: 'vigor', label: 'VIG', nome: 'VIGOR', top: '100%', left: '80%', tx: '-100%', ty: '-100%' },
                  { id: 'presenca', label: 'PRE', nome: 'PRESENÇA', top: '100%', left: '20%', tx: '0%', ty: '-100%' },
                  { id: 'forca', label: 'FOR', nome: 'FORÇA', top: '35%', left: '0%', tx: '0%', ty: '-50%' },
                ].map((atr) => (
                  <div key={atr.id} className="absolute flex flex-col items-center justify-center w-[85px] h-[85px] rounded-full border border-purple-800/80 bg-gray-950 z-20 hover:border-purple-500 transition-all hover:scale-105 shadow-[0_0_20px_rgba(168,85,247,0.4)]" style={{ top: atr.top, left: atr.left, transform: `translate(${atr.tx}, ${atr.ty})` }}>
                    <input type="number" value={ficha.dados.atributos[atr.id]} onChange={(e) => atualizarFicha(`atributos.${atr.id}`, parseInt(e.target.value) || 0)} className={`bg-transparent text-center font-bold text-3xl text-white w-14 outline-none ${noArrows}`} />
                    <span className="text-[8px] font-black text-gray-400 leading-tight uppercase tracking-widest text-center">{atr.nome}<br/><span className="text-purple-400 font-black">{atr.label}</span></span>
                  </div>
                ))}
              </div>

              {/* NEX, Deslocamento (Layout Limpo) */}
              <div className="flex gap-4 w-full justify-center bg-gray-950/60 p-4 rounded-xl border border-gray-800">
                 <div className="flex flex-col items-center">
                   <div className="flex items-center border border-gray-700 bg-gray-900 rounded-lg overflow-hidden h-9">
                     <span className="text-[10px] font-black px-3 text-gray-500 uppercase tracking-widest">NEX</span>
                     <input type="number" value={ficha.dados.nex} onChange={(e) => {
                       const val = Math.max(0, parseInt(e.target.value) || 0);
                       const novosDados = { ...ficha.dados, nex: val };
                       setFicha({ ...ficha, dados: { ...novosDados, status: recalcularMaximos(novosDados, ficha.sistema_preset) } });
                     }} className={`w-14 bg-black text-purple-400 text-center py-1 font-black text-lg outline-none border-l border-gray-700 h-full ${noArrows}`} />
                     <span className="text-sm font-bold pr-3 bg-black text-purple-600">%</span>
                   </div>
                 </div>
                 <div className="flex flex-col items-center justify-center">
                   <div className="border border-gray-700 bg-black rounded-lg h-9 px-4 min-w-[110px] flex items-center justify-center font-bold text-white text-sm">
                      9m / 6q
                   </div>
                   <span className="text-[8px] uppercase text-gray-600 mt-1 font-bold tracking-widest">DESLOCAMENTO</span>
                 </div>
              </div>

            </div>

            {/* COLUNA DIREITA (Status, Defesas e Abas) */}
            <div className="xl:col-span-8 space-y-8">
              
              {/* STATUS BARS ESTILO CRIS NO TOM ROXO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-950/60 p-6 rounded-2xl border border-gray-800">
                
                {/* Esquerda: Vida, Sanidade, PE */}
                <div className="space-y-5">
                  {[
                    { key: 'vida', label: 'VIDA', color: 'bg-red-600' },
                    { key: 'sanidade', label: 'SANIDADE', color: 'bg-purple-600' },
                    { key: 'estamina', label: 'ESFORÇO', color: 'bg-orange-600' }
                  ].map(s => {
                    const stat = ficha.dados.status[s.key];
                    const label = s.label;
                    const pct = Math.max(0, Math.min(100, (stat.atual / stat.max) * 100));
                    
                    return (
                      <div key={s.key} className="flex items-center gap-4 group">
                         <div className="w-24 text-right flex-shrink-0">
                           <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-300 transition-colors">{label}</span>
                         </div>
                         <div className="flex-1 flex border border-gray-800 rounded bg-gray-950 overflow-hidden items-stretch h-11 relative shadow-inner">
                           {/* Botão Menos */}
                           <button onClick={() => { const v = Math.max(0, stat.atual - 1); atualizarFicha(`status.${s.key}.atual`, v); }} className={`px-4 text-white font-bold transition-colors ${s.color} hover:brightness-110 z-20`}>-</button>
                           
                           {/* A Barra Dinâmica */}
                           <div className={`flex-1 flex items-center justify-center relative ${s.color}`}>
                              {/* Background da barra (o que falta preencher) */}
                              <div className="absolute top-0 right-0 h-full bg-gray-900 transition-all duration-300" style={{ width: `${100 - pct}%` }}></div>
                              
                              {/* O Número Flutuante */}
                              <div className="relative z-10 flex items-center font-black text-white text-xl drop-shadow-lg">
                                <input type="number" value={stat.atual} onChange={(e) => atualizarFicha(`status.${s.key}.atual`, Math.max(0, Math.min(stat.max, parseInt(e.target.value)||0)))} className={`bg-transparent text-right w-11 outline-none ${noArrows}`} />
                                <span className="opacity-80">/{stat.max}</span>
                              </div>
                           </div>
                           
                           {/* Botão Mais */}
                           <button onClick={() => { const v = Math.min(stat.max, stat.atual + 1); atualizarFicha(`status.${s.key}.atual`, v); }} className="px-4 bg-gray-900 hover:bg-gray-800 text-gray-600 hover:text-white transition-colors z-20 font-bold">+</button>
                         </div>
                      </div>
                    );
                  })}
                </div>

                {/* Direita: Defesa e Resistências */}
                <div className="space-y-6">
                  <div className="flex items-end gap-6 justify-center md:justify-start pt-1">
                    <div className="flex items-center gap-3 bg-gray-900 p-2 pr-4 rounded-xl border border-gray-800 shadow-inner">
                      <div className="relative flex items-center justify-center w-14 h-16 bg-black border border-purple-900/50 rounded-lg shadow-inner">
                        <Shield className="absolute text-purple-950 w-full h-full opacity-30 p-2" strokeWidth={1}/>
                        <input type="number" value={ficha.dados.defesa.passiva} onChange={(e) => atualizarFicha('defesa.passiva', parseInt(e.target.value)||0)} className={`bg-transparent text-purple-400 font-black text-2xl text-center w-full z-10 outline-none relative -top-0.5 ${noArrows}`} />
                      </div>
                      <div className="flex flex-col">
                        <span className={`${cinzel.className} text-[14px] font-black text-white tracking-widest leading-none`}>DEFESA</span>
                        <span className="text-[9px] text-gray-600 font-mono mt-0.5">= 10 + AGI + Equip</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-gray-500 tracking-widest mb-1.5 uppercase">BLOQUEIO</span>
                      <input type="number" value={ficha.dados.defesa.bloqueio} onChange={(e) => atualizarFicha('defesa.bloqueio', parseInt(e.target.value)||0)} className={`w-16 bg-gray-950 border border-gray-800 text-center text-gray-300 py-1.5 rounded-lg font-bold outline-none focus:border-purple-500 focus:text-white ${noArrows}`} />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-gray-500 tracking-widest mb-1.5 uppercase">ESQUIVA</span>
                      <input type="number" value={ficha.dados.defesa.esquiva} onChange={(e) => atualizarFicha('defesa.esquiva', parseInt(e.target.value)||0)} className={`w-16 bg-gray-950 border border-gray-800 text-center text-gray-300 py-1.5 rounded-lg font-bold outline-none focus:border-purple-500 focus:text-white ${noArrows}`} />
                    </div>
                  </div>

                  <div className="space-y-3 bg-black/40 p-3 rounded-lg border border-gray-800 shadow-inner">
                    {[ { label: 'PROTEÇÃO', chemin: '' }, { label: 'RESISTÊNCIAS', chemin: '' } ].map(r => (
                      <div key={r.label} className="flex items-end gap-3">
                        <span className="text-[10px] font-black text-gray-500 tracking-widest w-24 text-right mb-1">{r.label}</span>
                        <input type="text" className="flex-1 bg-transparent border-b border-gray-800 text-gray-300 text-xs outline-none focus:border-purple-500 focus:text-white p-1" placeholder="Nenhuma" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* TABS CONFORME O TOM ROXO NEON (GLASSMORPHISM) */}
              <div className="border border-purple-900/50 flex overflow-x-auto scrollbar-hide pt-1 bg-gray-950/80 rounded-xl backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                {[
                  { id: 'pericias', nome: 'PERÍCIAS' }, { id: 'combate', nome: 'COMBATE' },
                  { id: 'comum', nome: 'HABILIDADES' }, { id: 'rituais', nome: 'RITUAIS' }, { id: 'inventario', nome: 'INVENTÁRIO' }
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-7 py-3 text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-900/10' : 'text-gray-600 hover:text-gray-300'}`}>
                    {tab.nome}
                  </button>
                ))}
              </div>

              {/* CONTEÚDO DAS ABAS NO TOM ROXO (PAINEL TRANSLÚCIDO) */}
              <div className="py-2">
                
                {/* ABA DE PERÍCIAS */}
                {activeTab === 'pericias' && (
                  <div className="bg-gray-950/60 backdrop-blur-md border border-gray-800 rounded-2xl p-6 shadow-xl">
                    <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-5 px-3">
                      <span className="text-[11px] font-black text-gray-500 w-1/3 uppercase tracking-widest">PERÍCIA</span>
                      <div className="flex w-2/3 justify-between text-center items-center">
                        <span className="text-[10px] font-black text-gray-500 w-20 uppercase tracking-widest">ATR</span>
                        <span className="text-[10px] font-black text-purple-600 w-20 uppercase tracking-widest">TOTAL</span>
                        <span className="text-[10px] font-black text-gray-500 w-20 uppercase tracking-widest">TREINO</span>
                        <span className="text-[10px] font-black text-gray-500 w-20 uppercase tracking-widest">OUTROS</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2 scrollbar-op">
                      {PERICIAS_ORDEM.map(p => {
                        const treinado = ficha.dados.pericias[p.nome]?.treino || 0;
                        const outros = ficha.dados.pericias[p.nome]?.outros || 0;
                        const atrVal = ficha.dados.atributos[p.atr] || 0;
                        const total = treinado + outros;
                        const isTrained = treinado > 0;

                        return (
                          <div key={p.nome} className={`flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/5 transition-colors ${isTrained ? 'text-purple-300' : 'text-gray-500'}`}>
                            <div className="w-1/3 flex items-center gap-2">
                              {/* Ícone de rolagem sutil */}
                              <Zap size={14} className="text-gray-700 hover:text-purple-400 cursor-pointer"/>
                              <span className={`text-sm ${isTrained ? 'font-bold text-white' : 'font-medium'}`}>{p.nome}</span>
                            </div>
                            <div className="flex w-2/3 justify-between text-center items-center font-mono text-xs">
                              <span className="w-20 text-gray-600">{atrVal} {p.atr.substring(0,3).toUpperCase()}</span>
                              <span className="w-20 font-black text-purple-400 text-sm drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">+{total}</span>
                              <input type="number" value={treinado} onChange={(e) => atualizarFicha(`pericias.${p.nome}.treino`, parseInt(e.target.value)||0)} className={`w-20 bg-gray-900 border border-gray-800 rounded-md text-center py-1 outline-none focus:border-purple-500 focus:text-white ${isTrained ? 'text-purple-300' : 'text-gray-500'} ${noArrows}`} />
                              <input type="number" value={outros} onChange={(e) => atualizarFicha(`pericias.${p.nome}.outros`, parseInt(e.target.value)||0)} className={`w-20 bg-gray-900 border border-gray-800 rounded-md text-center py-1 outline-none focus:border-purple-500 focus:text-white ${isTrained ? 'text-purple-300' : 'text-gray-500'} ${noArrows}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ABA DE HABILIDADES / RITUAIS - MESMO TOM ROXO */}
                {(activeTab === 'comum' || activeTab === 'rituais') && (
                  <div className="space-y-5">
                     <div className="flex justify-between items-center bg-gray-950 p-3 rounded-lg border border-gray-800">
                       <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-widest">{activeTab === 'rituais' ? 'Compêndio de Rituais' : 'Habilidades e Poderes'}</h4>
                       <button onClick={() => setIsAddingSkill(!isAddingSkill)} className="bg-purple-600 text-white px-5 py-2 rounded-lg text-[10px] font-bold uppercase hover:bg-purple-500 transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)]">Adicionar</button>
                     </div>

                     {isAddingSkill && (
                       <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 p-5 rounded-xl space-y-4 shadow-inner">
                         <input type="text" placeholder="Nome (Ex: Decadência)" value={newSkill.nome} onChange={(e) => setNewSkill({...newSkill, nome: e.target.value})} className={inputClass} />
                         <input type="text" placeholder="Custo / Dado (Ex: 1 PE)" value={newSkill.dado} onChange={(e) => setNewSkill({...newSkill, dado: e.target.value})} className={inputClass} />
                         <textarea placeholder="Descrição completa e efeitos..." value={newSkill.desc} onChange={(e) => setNewSkill({...newSkill, desc: e.target.value})} className={`${inputClass} resize-none`} rows={3}/>
                         <div className="flex justify-end gap-2">
                           <button onClick={() => setIsAddingSkill(false)} className="text-gray-600 text-[10px] font-bold uppercase px-4 py-2 hover:text-white">Cancelar</button>
                           <button onClick={adicionarHabilidade} className="bg-purple-600 text-white py-2 rounded-lg text-[10px] font-bold uppercase px-6 hover:bg-purple-500 transition-all">Salvar</button>
                         </div>
                       </div>
                     )}

                     <div className="space-y-4">
                       {ficha.dados.habilidades?.filter((h:any) => h.cat === activeTab).map((h:any) => (
                         <div key={h.id} className="bg-gray-950/60 backdrop-blur-sm border border-gray-800 rounded-xl p-5 group relative hover:border-purple-900/50 transition-colors shadow-md">
                           <button onClick={() => atualizarFicha('habilidades', ficha.dados.habilidades.filter((x:any) => x.id !== h.id))} className="absolute top-4 right-4 text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                           <div className="flex gap-4 items-end mb-3 border-b border-gray-800 pb-2">
                             <h5 className={`${cinzel.className} font-black text-white text-xl tracking-tight`}>{h.nome}</h5>
                             {h.dado && <span className="bg-gray-900 border border-gray-700 text-purple-400 px-3 py-1 rounded-full text-[10px] font-mono border-purple-900/50 shadow-inner">{h.dado}</span>}
                           </div>
                           <p className="text-sm text-gray-400 whitespace-pre-wrap leading-relaxed pr-8 font-medium">{h.desc}</p>
                         </div>
                       ))}
                       {ficha.dados.habilidades?.filter((h:any) => h.cat === activeTab).length === 0 && (
                         <div className="text-center py-16 text-gray-700 border border-gray-800 rounded-xl bg-gray-950/30">Nenhum registro encontrado nesta categoria.</div>
                       )}
                     </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-gray-950 rounded-2xl border border-gray-800">
             <span className="text-purple-500 font-black text-xl mb-3">Layout D&D 5e Ativo</span>
             <span className="text-gray-600 italic text-sm max-w-md">O sistema de D&D usa o layout padrão em blocos (omitido visualmente neste teste de estilo). Troque para Ordem Paranormal no menu superior para ver o tom roxo neon.</span>
          </div>
        )}
      </div>

      {/* CSS customizado para a scrollbar opaca no tom roxo */}
      <style jsx global>{`
        .scrollbar-op::-webkit-scrollbar { width: 5px; }
        .scrollbar-op::-webkit-scrollbar-track { bg: #111; border-radius: 10px; }
        .scrollbar-op::-webkit-scrollbar-thumb { bg: #333; border-radius: 10px; }
        .scrollbar-op::-webkit-scrollbar-thumb:hover { bg: #A855F7; }
        
        /* Esconder spinner do input number */
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; margin: 0; 
        }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </main>
  );
}
