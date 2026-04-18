"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
// Caminho correto para a Ficha (volta 3 casas)
import { supabase } from '../../../src/lib/supabase'; 
import { Cinzel, Inter } from 'next/font/google';
import { Camera, ArrowLeft, Trash2, Search, ChevronDown, Plus, X, Dices, Shield, Swords, Zap, Edit2, Check } from 'lucide-react';
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
  const id = params?.id as string | undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ficha, setFicha] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pericias');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [modalOpen, setModalOpen] = useState<'habilidades' | 'armas' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingWeaponId, setEditingWeaponId] = useState<number | null>(null);

  useEffect(() => { 
    if (id && id !== 'undefined') carregarFicha(); 
    else setLoading(false);
  }, [id]);

  const carregarFicha = async () => {
    try {
      const { data, error } = await supabase.from('fichas').select('*').eq('id', id).single();
      if (error) throw error;
      if (data) {
        if (!data.dados.habilidades) data.dados.habilidades = [];
        if (!data.dados.armas) data.dados.armas = [];
        if (!data.dados.pericias) data.dados.pericias = {};
        if (!data.dados.defesa) data.dados.defesa = { passiva: 10, bloqueio: 0, esquiva: 0 };
        if (!data.dados.atributos) data.dados.atributos = { forca: 1, agilidade: 1, vigor: 1, intelecto: 1, presenca: 1 };
        if (!data.dados.status) data.dados.status = { vida: { atual: 10, max: 10 }, sanidade: { atual: 10, max: 10 }, pe: { atual: 10, max: 10 } };
        setFicha(data);
      }
    } catch (error) { console.error("Erro fatal:", error); } finally { setLoading(false); }
  };

  const atualizarFicha = (caminho: string, valor: any) => {
    const novosDados = { ...ficha.dados };
    const keys = caminho.split('.');
    let temp = novosDados;
    for (let i = 0; i < keys.length - 1; i++) {
        if (temp[keys[i]] === undefined) temp[keys[i]] = {};
        temp = temp[keys[i]];
    }
    temp[keys[keys.length - 1]] = valor;
    setFicha({ ...ficha, dados: novosDados });
  };

  const salvarNoBanco = async () => {
    setIsSaving(true);
    try {
        const { error } = await supabase.from('fichas').update({ nome_personagem: ficha.nome_personagem, dados: ficha.dados }).eq('id', id);
        if (error) throw error;
        alert("✔️ Sincronizado com o Omnis");
    } catch (err: any) { alert(`❌ Falha na Sincronização: ${err.message}`); }
    finally { setIsSaving(false); }
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
        const path = `retratos/${id}-${Date.now()}.png`;
        const { data, error } = await supabase.storage.from('avatares').upload(path, file);
        if (error) throw error;
        if (data) {
            const url = supabase.storage.from('avatares').getPublicUrl(path).data.publicUrl;
            atualizarFicha('avatar_url', url);
        }
    } catch (err: any) { alert(`❌ Erro no Upload: ${err.message}`); }
    finally { setIsUploading(false); }
  };

  if (!id || id === 'undefined') return <div className="min-h-screen bg-[#050a10] flex items-center justify-center text-red-400 font-bold">ID inválido na URL.</div>;
  if (loading) return <div className="min-h-screen bg-[#050a10] flex flex-col items-center justify-center text-[#4ad9d9] font-mono tracking-widest animate-pulse"><Zap className="mb-4" /> Estabelecendo Conexão...</div>;
  if (!ficha) return <div className="min-h-screen bg-[#050a10] flex items-center justify-center text-red-500 font-bold">Registro de Ficha não localizado no Omnis.</div>;

  const atr = ficha.dados.atributos || { forca: 1, agilidade: 1, vigor: 1, intelecto: 1, presenca: 1 };
  const sys = PRESETS[ficha.sistema_preset as keyof typeof PRESETS] as any;
  const noArrows = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  // Estilos Comuns da Nova Identidade (Azul/Cyan)
  const neonBlue = "#4ad9d9";
  const darkBlue = "#1a2b4c";
  const bgCatan = "bg-[#050a10]";
  const bgCard = "bg-[#0a0f18]";
  const borderNeon = `border border-[${neonBlue}]`;
  const textBody = "text-[#8b9bb4]";
  const textTitle = "text-[#f0ebd8]";

  return (
    <main className={`min-h-screen w-full ${bgCatan} ${textBody} pb-32 ${inter.className} selection:bg-[${neonBlue}]/30 selection:text-white`}>
      
      {/* ── HEADER NEON ── */}
      <header className={`bg-[#050a10]/90 backdrop-blur-sm border-b ${borderNeon} p-4 px-8 flex justify-between items-center sticky top-0 z-40 shadow-[0_0_20px_rgba(74,217,217,0.2)]`}>
        <button onClick={() => router.push('/fichas')} className="text-xs uppercase tracking-widest text-[#4ad9d9] hover:text-white flex items-center gap-2 transition-colors"><ArrowLeft size={14}/> Voltar ao Omnis</button>
        <button onClick={salvarNoBanco} disabled={isSaving} className={`bg-[#1e6b6b] ${borderNeon} ${textTitle} px-6 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-[${neonBlue}] hover:text-black transition-all shadow-[0_0_15px_rgba(74,217,217,0.3)]`}>{isSaving ? '...' : 'Sincronizar'}</button>
      </header>

      <div className="max-w-[1300px] mx-auto p-6 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ── COLUNA ESQUERDA ── */}
        <div className="lg:col-span-5 flex flex-col items-center space-y-8">
          
          {/* Identidade */}
          <div className={`w-full flex gap-5 ${bgCard} p-5 rounded-xl border border-gray-800 shadow-inner`}>
            <div onClick={() => fileInputRef.current?.click()} className={`w-28 h-28 ${bgCatan} border-2 border-dashed border-gray-700 rounded overflow-hidden cursor-pointer flex-shrink-0 flex items-center justify-center hover:border-[${neonBlue}] transition-colors`}>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              {isUploading ? <span className={`text-xs text-[${neonBlue}] animate-pulse`}>...</span> : ficha.dados.avatar_url ? <img src={ficha.dados.avatar_url} className="w-full h-full object-cover" alt="Retrato"/> : <Camera size={28} className="text-gray-700" />}
            </div>
            <div className="flex-1 space-y-3 pt-1">
               <div className="border-b border-gray-800 pb-1 flex flex-col">
                 <span className={`text-[9px] uppercase tracking-widest text-[${neonBlue}] font-bold`}>Personagem</span>
                 <input type="text" value={ficha.nome_personagem || ''} onChange={(e) => setFicha({...ficha, nome_personagem: e.target.value})} className={`bg-transparent ${textTitle} font-bold outline-none w-full text-lg placeholder:text-gray-700`} placeholder="S/N" />
               </div>
               <div className="flex gap-4">
                 <div className="border-b border-gray-800 pb-1 flex flex-col w-full">
                   <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Origem</span>
                   <input type="text" value={ficha.dados.origem || ''} onChange={(e) => atualizarFicha('origem', e.target.value)} className="bg-transparent text-gray-200 font-medium outline-none w-full text-xs placeholder:text-gray-700" placeholder="..." />
                 </div>
                 <div className="border-b border-gray-800 pb-1 flex flex-col w-full">
                   <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Classe</span>
                   <input type="text" value={ficha.dados.classe || ''} onChange={(e) => atualizarFicha('classe', e.target.value)} className="bg-transparent text-gray-200 font-medium outline-none w-full text-xs placeholder:text-gray-700" placeholder="..." />
                 </div>
               </div>
            </div>
          </div>

          {/* PENTAGRAMA NEON AZUL */}
          <div className="relative w-[320px] h-[320px] my-6">
            <div className="absolute inset-0 rounded-full border-2 border-gray-800 opacity-20"></div>
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-black ${textTitle} tracking-widest opacity-60`}>ATRIBUTOS</div>
            
            {[
              { id: 'agilidade', label: 'AGI', nome: 'AGILIDADE', pos: 'top-0 left-1/2 -translate-x-1/2' },
              { id: 'intelecto', label: 'INT', nome: 'INTELECTO', pos: 'top-[30%] right-0 translate-x-3' },
              { id: 'vigor', label: 'VIG', nome: 'VIGOR', pos: 'bottom-3 right-3' },
              { id: 'presenca', label: 'PRE', nome: 'PRESENÇA', pos: 'bottom-3 left-3' },
              { id: 'forca', label: 'FOR', nome: 'FORÇA', pos: 'top-[30%] left-0 -translate-x-3' },
            ].map((a) => (
              <div key={a.id} className={`absolute ${a.pos} flex flex-col items-center justify-center w-[90px] h-[90px] rounded-full border-2 border-[${neonBlue}] ${bgCatan} z-10 hover:shadow-[0_0_15px_${neonBlue}] transition-all`}>
                <input type="number" value={atr[a.id]} onChange={(e) => atualizarFicha(`atributos.${a.id}`, parseInt(e.target.value) || 0)} className={`bg-transparent text-center text-4xl font-black ${textTitle} w-14 outline-none ${noArrows}`} />
                <span className="text-[7px] uppercase tracking-widest mt-0.5 text-gray-400 font-bold">{a.nome}</span>
                <span className={`text-sm font-black text-[${neonBlue}] leading-none`}>{a.label}</span>
              </div>
            ))}
          </div>

          {/* Status (NEX, Deslocamento e Barras) */}
          <div className="w-full space-y-4">
            <div className={`flex gap-4 ${bgCard} p-4 rounded-xl border border-gray-800 shadow-inner`}>
               <div className="flex flex-col flex-1 border-b border-gray-800 pb-1">
                 <span className={`text-[9px] uppercase tracking-widest text-[${neonBlue}] font-black`}>NEX</span>
                 <div className="flex items-center">
                    <input type="number" value={ficha.dados.nex || 5} onChange={(e) => atualizarFicha('nex', parseInt(e.target.value)||0)} className={`bg-transparent text-white font-bold outline-none w-10 text-xl ${noArrows}`} />
                    <span className="text-gray-500 text-sm font-black">%</span>
                 </div>
               </div>
               <div className="flex flex-col flex-1 border-b border-gray-800 pb-1">
                 <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Deslocamento</span>
                 <input type="text" value={ficha.dados.deslocamento || '9m'} onChange={(e) => atualizarFicha('deslocamento', e.target.value)} className="bg-transparent text-gray-200 font-medium outline-none w-full text-base" />
               </div>
            </div>

            {[ 
                { key: 'vida', label: 'VIDA', color: 'bg-red-600', fill: '#dc2626' }, 
                { key: 'sanidade', label: 'SANIDADE', color: 'bg-purple-600', fill: '#9333ea' }, 
                { key: 'pe', label: 'PONTOS DE ESFORÇO', color: 'bg-[#4ad9d9]', fill: '#4ad9d9' } 
            ].map(s => {
              const stat = ficha.dados.status?.[s.key] || { atual: 10, max: 10 };
              const pct = Math.max(0, Math.min(100, (stat.atual / stat.max) * 100));
              const isPe = s.key === 'pe';
              return (
                <div key={s.key} className="space-y-1">
                   <div className={`flex justify-between items-end text-[10px] font-black uppercase tracking-widest ${isPe ? 'text-black bg-[#4ad9d9] px-2 py-0.5' : textBody} rounded`}>
                     {s.label}
                     <div className={`flex items-baseline gap-1 ${textTitle}`}>
                        <input type="number" value={stat.atual} onChange={(e) => atualizarFicha(`status.${s.key}.atual`, parseInt(e.target.value)||0)} className={`w-10 bg-transparent text-right outline-none text-base ${noArrows} font-bold`} />
                        <span className="text-gray-500 text-xs">/</span>
                        <input type="number" value={stat.max} onChange={(e) => atualizarFicha(`status.${s.key}.max`, parseInt(e.target.value)||0)} className={`w-10 bg-transparent text-right outline-none text-sm ${noArrows} font-medium text-gray-400`} />
                     </div>
                   </div>
                   <div className={`flex items-center gap-3 ${bgCard} p-1 rounded-full border border-gray-800`}>
                     <button onClick={() => atualizarFicha(`status.${s.key}.atual`, Math.max(0, stat.atual - 1))} className={`text-gray-600 hover:text-[${neonBlue}] font-black text-xl px-3 transition-colors`}>-</button>
                     <div className={`flex-1 h-5 ${bgCatan} border border-gray-800 rounded-full overflow-hidden relative`}>
                       <div className={`h-full transition-all duration-300 ${isPe ? 'shadow-[0_0_10px_#4ad9d9]' : ''}`} style={{ width: `${pct}%`, backgroundColor: s.fill, opacity: isPe ? 0.9 : 1 }}></div>
                     </div>
                     <button onClick={() => atualizarFicha(`status.${s.key}.atual`, Math.min(stat.max, stat.atual + 1))} className={`text-gray-600 hover:text-[${neonBlue}] font-black text-xl px-3 transition-colors`}>+</button>
                   </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── COLUNA DIREITA ── */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Defesas Rápido */}
          <div className={`flex gap-4 p-5 ${bgCard} rounded-xl border border-gray-800 shadow-inner`}>
             <div className="flex items-center gap-4 pr-5 border-r border-gray-800">
                <Shield className={`text-[${neonBlue}]`} size={28} />
                <div className="flex flex-col">
                  <span className={`text-[9px] uppercase tracking-widest text-[${neonBlue}] font-black`}>Defesa</span>
                  <input type="number" value={ficha.dados.defesa?.passiva || 10} onChange={(e) => atualizarFicha('defesa.passiva', parseInt(e.target.value)||0)} className={`bg-transparent ${textTitle} font-black text-2xl outline-none w-14 ${noArrows}`} />
                </div>
             </div>
             {[ { label: 'Bloqueio', caminho: 'defesa.bloqueio' }, { label: 'Esquiva', caminho: 'defesa.esquiva' } ].map(d => (
                <div key={d.label} className="flex flex-col justify-center">
                    <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">{d.label}</span>
                    <input type="number" value={ficha.dados.defesa?.[d.label.toLowerCase()] || 0} onChange={(e) => atualizarFicha(d.caminho, parseInt(e.target.value)||0)} className={`bg-transparent text-white font-medium outline-none w-14 border-b border-gray-800 ${noArrows} text-sm`} />
                </div>
             ))}
          </div>

          <div className={`flex gap-6 border-b border-gray-800 ${bgCard} p-1 px-4 rounded-t-xl border border-b-0 border-gray-800`}>
             {['pericias', 'habilidades', 'armas'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-2.5 pt-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? `text-[${neonBlue}] border-b-2 border-[${neonBlue}] drop-shadow-[0_0_5px_${neonBlue}]` : 'text-gray-500 hover:text-gray-300'}`}>
                  {tab === 'armas' ? 'Inventário' : tab}
                </button>
             ))}
          </div>

          {/* CONTEÚDO DAS ABAS */}
          <div className={`${bgCard} p-6 rounded-b-xl border border-gray-800 min-h-[500px] shadow-inner`}>
            
            {activeTab === 'pericias' && (
              <div className="space-y-1.5">
                <div className="grid grid-cols-12 gap-2 text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3 px-2">
                  <div className="col-span-5">Perícia</div>
                  <div className="col-span-2 text-center">Dados</div>
                  <div className="col-span-1 text-center">Bônus</div>
                  <div className="col-span-2 text-center">Treino</div>
                  <div className="col-span-2 text-center">Outros</div>
                </div>
                <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {PERICIAS_ORDEM.map(p => {
                   const treino = ficha.dados.pericias?.[p.nome]?.treino || 0;
                   const outros = ficha.dados.pericias?.[p.nome]?.outros || 0;
                   const isTrained = treino > 0;
                   const total = treino + outros + (atr[p.atr] || 0);
                   const isAtrPositive = (atr[p.atr] || 0) > 0;
                   
                   return (
                     <div key={p.nome} className="grid grid-cols-12 gap-2 items-center py-1.5 px-3 hover:bg-[#1a2b4c]/30 rounded transition-colors group">
                       <div className={`col-span-5 flex items-center gap-2.5 text-sm font-bold ${isTrained ? `text-[${neonBlue}]` : 'text-gray-300'}`}>
                          <Dices size={14} className={isTrained ? `text-[${neonBlue}]` : 'text-gray-600'}/>
                          {p.nome}
                       </div>
                       <div className={`col-span-2 text-center text-[11px] font-mono ${isTrained ? `text-[${neonBlue}]` : 'text-gray-500'}`}>( {p.atr.slice(0,3).toUpperCase()} )</div>
                       <div className={`col-span-1 text-center text-xs font-black font-mono ${isTrained ? `text-[${neonBlue}]` : textTitle}`}>({total})</div>
                       <div className="col-span-2 flex justify-center">
                         <input type="number" value={treino} onChange={(e) => atualizarFicha(`pericias.${p.nome}.treino`, parseInt(e.target.value)||0)} className={`bg-transparent border-b border-gray-700 w-10 text-center text-xs font-bold outline-none ${noArrows} ${isTrained ? `text-[${neonBlue}]` : 'text-white'}`} />
                       </div>
                       <div className="col-span-2 flex justify-center">
                         <input type="number" value={outros} onChange={(e) => atualizarFicha(`pericias.${p.nome}.outros`, parseInt(e.target.value)||0)} className={`bg-transparent border-b border-gray-700 w-10 text-center text-xs font-bold outline-none ${noArrows} ${isTrained ? `text-[${neonBlue}]` : 'text-white'}`} />
                       </div>
                     </div>
                   )
                })}
                </div>
              </div>
            )}

            {activeTab === 'habilidades' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`${textTitle} font-bold text-lg`}>Habilidades e Poderes</h3>
                    <button onClick={() => setModalOpen('habilidades')} className={`bg-[#1e6b6b] ${textTitle} border border-[${neonBlue}] px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-widest hover:bg-[${neonBlue}] hover:text-black transition-all shadow-[0_0_10px_rgba(74,217,217,0.2)]`}>Adicionar</button>
                </div>
                <div className="space-y-3">
                  {ficha.dados.habilidades.map((h:any) => (
                    <div key={h.id} className={`${bgCatan} p-4 rounded-lg border border-gray-800 flex justify-between items-start group`}>
                      <div>
                        <span className="font-bold text-white text-sm block mb-1.5">{h.nome} {h.dado && <span className={`ml-3 text-[10px] bg-[${neonBlue}]/20 px-2 py-0.5 rounded text-[${neonBlue}] font-mono border border-[${neonBlue}]/30`}>{h.dado}</span>}</span>
                        <p className="text-xs text-gray-400 leading-relaxed whitespace
