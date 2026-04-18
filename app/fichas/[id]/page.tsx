"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../src/lib/supabase'; 
import { Cinzel, Inter } from 'next/font/google';
import { Camera, ArrowLeft, Trash2, Search, ChevronDown, Plus, X, Dices, Shield, Swords } from 'lucide-react';
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
        if (!data.dados.status) data.dados.status = { vida: { atual: 10, max: 10 }, sanidade: { atual: 10, max: 10 }, estamina: { atual: 10, max: 10 } };
        setFicha(data);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
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
    return dadosAtuais.status;
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
    
    if (caminho.includes('atributos') || caminho.includes('nex')) {
        novosDados.status = recalcularMaximos(novosDados, ficha.sistema_preset);
    }
    setFicha({ ...ficha, dados: novosDados });
  };

  const salvarNoBanco = async () => {
    setIsSaving(true);
    await supabase.from('fichas').update({ nome_personagem: ficha.nome_personagem, dados: ficha.dados }).eq('id', id);
    setIsSaving(false);
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const path = `retratos/${id}-${Date.now()}.png`;
    const { data } = await supabase.storage.from('avatares').upload(path, file);
    if (data) {
        const url = supabase.storage.from('avatares').getPublicUrl(path).data.publicUrl;
        atualizarFicha('avatar_url', url);
    }
    setIsUploading(false);
  };

  if (!id || id === 'undefined') return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-red-500 font-bold">ID não encontrado na URL. Vá para o Hub.</div>;
  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Carregando Ficha...</div>;
  if (!ficha) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-red-500 font-bold">Ficha não encontrada.</div>;

  const atr = ficha.dados.atributos;
  const sys = PRESETS[ficha.sistema_preset as keyof typeof PRESETS] as any;
  const noArrows = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <main className={`min-h-screen w-full bg-[#0a0a0a] text-gray-300 pb-32 ${inter.className}`}>
      
      {/* ── HEADER ── */}
      <header className="bg-[#111] border-b border-gray-800 p-4 px-8 flex justify-between items-center sticky top-0 z-40">
        <button onClick={() => router.push('/fichas')} className="text-xs uppercase tracking-widest text-gray-400 hover:text-white flex items-center gap-2"><ArrowLeft size={14}/> Voltar</button>
        <button onClick={salvarNoBanco} className="bg-purple-600 text-white px-6 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-purple-500 transition-all">{isSaving ? '...' : 'Salvar'}</button>
      </header>

      <div className="max-w-[1300px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ── COLUNA ESQUERDA: PENTAGRAMA E STATUS ── */}
        <div className="lg:col-span-5 flex flex-col items-center space-y-8">
          
          {/* Identidade */}
          <div className="w-full flex gap-4">
            <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 bg-[#111] border border-gray-800 rounded overflow-hidden cursor-pointer flex-shrink-0 flex items-center justify-center hover:border-purple-500 transition-colors">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              {isUploading ? <span className="text-xs text-purple-500 animate-pulse">...</span> : ficha.dados.avatar_url ? <img src={ficha.dados.avatar_url} className="w-full h-full object-cover" /> : <Camera size={24} className="text-gray-600" />}
            </div>
            <div className="flex-1 space-y-2 pt-1">
               <div className="border-b border-gray-800 pb-1 flex flex-col">
                 <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Personagem</span>
                 <input type="text" value={ficha.nome_personagem} onChange={(e) => setFicha({...ficha, nome_personagem: e.target.value})} className="bg-transparent text-white font-bold outline-none w-full text-base placeholder:text-gray-700" placeholder="Nome do Personagem" />
               </div>
               <div className="flex gap-4">
                 <div className="border-b border-gray-800 pb-1 flex flex-col w-full">
                   <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Origem</span>
                   <input type="text" value={ficha.dados.origem || ''} onChange={(e) => atualizarFicha('origem', e.target.value)} className="bg-transparent text-white font-bold outline-none w-full text-sm placeholder:text-gray-700" placeholder="Origem" />
                 </div>
                 <div className="border-b border-gray-800 pb-1 flex flex-col w-full">
                   <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Classe</span>
                   <input type="text" value={ficha.dados.classe || ''} onChange={(e) => atualizarFicha('classe', e.target.value)} className="bg-transparent text-white font-bold outline-none w-full text-sm placeholder:text-gray-700" placeholder="Classe" />
                 </div>
               </div>
            </div>
          </div>

          {/* PENTAGRAMA */}
          <div className="relative w-[300px] h-[300px] my-4">
            <div className="absolute inset-0 rounded-full border border-gray-800 opacity-30"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-black text-white tracking-widest">ATRIBUTOS</div>
            
            {[
              { id: 'agilidade', label: 'AGI', nome: 'AGILIDADE', pos: 'top-0 left-1/2 -translate-x-1/2' },
              { id: 'intelecto', label: 'INT', nome: 'INTELECTO', pos: 'top-[30%] right-0 translate-x-3' },
              { id: 'vigor', label: 'VIG', nome: 'VIGOR', pos: 'bottom-3 right-3' },
              { id: 'presenca', label: 'PRE', nome: 'PRESENÇA', pos: 'bottom-3 left-3' },
              { id: 'forca', label: 'FOR', nome: 'FORÇA', pos: 'top-[30%] left-0 -translate-x-3' },
            ].map((a) => (
              <div key={a.id} className={`absolute ${a.pos} flex flex-col items-center justify-center w-[85px] h-[85px] rounded-full border-[3px] border-white bg-[#0a0a0a] z-10 hover:border-gray-300 transition-colors`}>
                <input type="number" value={atr[a.id]} onChange={(e) => atualizarFicha(`atributos.${a.id}`, parseInt(e.target.value) || 0)} className={`bg-transparent text-center text-3xl font-bold text-white w-14 outline-none ${noArrows}`} />
                <span className="text-[7px] uppercase tracking-widest mt-0.5 text-gray-400">{a.nome}</span>
                <span className="text-sm font-black text-white">{a.label}</span>
              </div>
            ))}
          </div>

          {/* Status (NEX, Deslocamento e Barras) */}
          <div className="w-full space-y-4">
            <div className="flex gap-4">
               <div className="flex flex-col flex-1 border-b border-gray-800 pb-1">
                 <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">NEX</span>
                 <div className="flex items-center">
                    <input type="number" value={ficha.dados.nex || 5} onChange={(e) => atualizarFicha('nex', parseInt(e.target.value)||0)} className={`bg-transparent text-white font-bold outline-none w-8 text-base ${noArrows}`} />
                    <span className="text-gray-500 text-sm">%</span>
                 </div>
               </div>
               <div className="flex flex-col flex-1 border-b border-gray-800 pb-1">
                 <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Deslocamento</span>
                 <input type="text" value={ficha.dados.deslocamento || '9m / 6q'} onChange={(e) => atualizarFicha('deslocamento', e.target.value)} className="bg-transparent text-white font-bold outline-none w-full text-base" />
               </div>
            </div>

            {[ { key: 'vida', label: 'VIDA', color: 'bg-red-600', fill: '#dc2626' }, { key: 'sanidade', label: 'SANIDADE', color: 'bg-purple-600', fill: '#a855f7' }, { key: 'estamina', label: 'ESFORÇO', color: 'bg-yellow-600', fill: '#ca8a04' } ].map(s => {
              const stat = ficha.dados.status?.[s.key] || { atual: 10, max: 10 };
              const pct = Math.max(0, Math.min(100, (stat.atual / stat.max) * 100));
              return (
                <div key={s.key} className="space-y-1">
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">{s.label}</div>
                   <div className="flex items-center gap-3">
                     <button onClick={() => atualizarFicha(`status.${s.key}.atual`, Math.max(0, stat.atual - 1))} className="text-gray-600 hover:text-white font-black px-2">-</button>
                     <div className="flex-1 h-6 bg-[#111] border border-gray-800 rounded overflow-hidden relative">
                       <div className={`h-full transition-all duration-300`} style={{ width: `${pct}%`, backgroundColor: s.fill }}></div>
                       <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-white drop-shadow-md">
                         <input type="number" value={stat.atual} onChange={(e) => atualizarFicha(`status.${s.key}.atual`, parseInt(e.target.value)||0)} className={`w-8 bg-transparent text-right outline-none ${noArrows}`} />
                         <span>/{stat.max}</span>
                       </div>
                     </div>
                     <button onClick={() => atualizarFicha(`status.${s.key}.atual`, Math.min(stat.max, stat.atual + 1))} className="text-gray-600 hover:text-white font-black px-2">+</button>
                   </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── COLUNA DIREITA: ABAS ── */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Defesas Rápido */}
          <div className="flex gap-4 p-4 bg-[#111] rounded-xl border border-gray-800">
             <div className="flex items-center gap-3 pr-4 border-r border-gray-800">
                <Shield className="text-gray-500" size={24} />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Defesa</span>
                  <input type="number" value={ficha.dados.defesa?.passiva || 10} onChange={(e) => atualizarFicha('defesa.passiva', parseInt(e.target.value)||0)} className={`bg-transparent text-white font-bold text-xl outline-none w-12 ${noArrows}`} />
                </div>
             </div>
             <div className="flex flex-col justify-center">
                <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Bloqueio</span>
                <input type="number" value={ficha.dados.defesa?.bloqueio || 0} onChange={(e) => atualizarFicha('defesa.bloqueio', parseInt(e.target.value)||0)} className={`bg-transparent text-white font-bold outline-none w-12 border-b border-gray-800 ${noArrows}`} />
             </div>
             <div className="flex flex-col justify-center">
                <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Esquiva</span>
                <input type="number" value={ficha.dados.defesa?.esquiva || 0} onChange={(e) => atualizarFicha('defesa.esquiva', parseInt(e.target.value)||0)} className={`bg-transparent text-white font-bold outline-none w-12 border-b border-gray-800 ${noArrows}`} />
             </div>
          </div>

          <div className="flex gap-6 border-b border-gray-800">
             {['pericias', 'habilidades', 'armas'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-purple-500 border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-300'}`}>
                  {tab === 'armas' ? 'Inventário' : tab}
                </button>
             ))}
          </div>

          {/* CONTEÚDO DAS ABAS */}
          <div className="py-2">
            
            {activeTab === 'pericias' && (
              <div className="space-y-1">
                <div className="grid grid-cols-12 gap-2 text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2 px-2">
                  <div className="col-span-5">Perícia</div>
                  <div className="col-span-2 text-center">Dados</div>
                  <div className="col-span-1 text-center">Bônus</div>
                  <div className="col-span-2 text-center">Treino</div>
                  <div className="col-span-2 text-center">Outros</div>
                </div>
                {PERICIAS_ORDEM.map(p => {
                   const treino = ficha.dados.pericias?.[p.nome]?.treino || 0;
                   const outros = ficha.dados.pericias?.[p.nome]?.outros || 0;
                   const isTrained = treino > 0;
                   const valAtr = atr[p.atr] || 0;
                   
                   return (
                     <div key={p.nome} className="grid grid-cols-12 gap-2 items-center py-1.5 px-2 hover:bg-[#111] rounded transition-colors group">
                       <div className={`col-span-5 flex items-center gap-2 text-xs font-bold ${isTrained ? 'text-[#22c55e]' : 'text-gray-300'}`}>
                          <Dices size={12} className={isTrained ? 'text-[#22c55e]' : 'text-gray-600'}/>
                          {p.nome}
                       </div>
                       <div className={`col-span-2 text-center text-[10px] font-mono ${isTrained ? 'text-[#22c55e]' : 'text-gray-500'}`}>( {p.atr.slice(0,3).toUpperCase()} )</div>
                       <div className={`col-span-1 text-center text-[10px] font-mono ${isTrained ? 'text-[#22c55e]' : 'text-gray-500'}`}>({valAtr})</div>
                       <div className="col-span-2 flex justify-center">
                         <input type="number" value={treino} onChange={(e) => atualizarFicha(`pericias.${p.nome}.treino`, parseInt(e.target.value)||0)} className={`bg-transparent border-b border-gray-700 w-8 text-center text-xs font-bold outline-none ${noArrows} ${isTrained ? 'text-[#22c55e]' : 'text-white'}`} />
                       </div>
                       <div className="col-span-2 flex justify-center">
                         <input type="number" value={outros} onChange={(e) => atualizarFicha(`pericias.${p.nome}.outros`, parseInt(e.target.value)||0)} className={`bg-transparent border-b border-gray-700 w-8 text-center text-xs font-bold outline-none ${noArrows} ${isTrained ? 'text-[#22c55e]' : 'text-white'}`} />
                       </div>
                     </div>
                   )
                })}
              </div>
            )}

            {activeTab === 'habilidades' && (
              <div>
                <div className="flex justify-end mb-4">
                  <button onClick={() => setModalOpen('habilidades')} className="bg-[#1a1a1a] text-purple-400 border border-purple-900/50 px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest hover:bg-purple-900/20 transition-all">Adicionar Habilidade</button>
                </div>
                <div className="space-y-2">
                  {ficha.dados.habilidades.map((h:any) => (
                    <div key={h.id} className="bg-[#111] p-4 rounded border border-gray-800 flex justify-between items-start group">
                      <div>
                        <span className="font-bold text-white text-sm block mb-1">{h.nome} {h.dado && <span className="ml-2 text-[10px] bg-gray-800 px-2 py-0.5 rounded text-purple-400 font-mono">{h.dado}</span>}</span>
                        <p className="text-xs text-gray-400">{h.desc}</p>
                      </div>
                      <button onClick={() => atualizarFicha('habilidades', ficha.dados.habilidades.filter((x:any)=>x.id!==h.id))} className="text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                    </div>
                  ))}
                  {ficha.dados.habilidades.length === 0 && <p className="text-center text-gray-600 text-xs font-bold uppercase tracking-widest mt-10">Nenhuma habilidade adicionada.</p>}
                </div>
              </div>
            )}

            {activeTab === 'armas' && (
              <div>
                <div className="flex justify-end mb-4">
                  <button onClick={() => setModalOpen('armas')} className="bg-[#1a1a1a] text-purple-400 border border-purple-900/50 px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest hover:bg-purple-900/20 transition-all">Adicionar Item</button>
                </div>
                <div className="space-y-2">
                  {ficha.dados.armas.map((a:any) => (
                    <div key={a.id} className="bg-[#111] p-4 rounded border border-gray-800 flex justify-between items-start group">
                      <div>
                        <span className="font-bold text-white text-sm block mb-1">{a.nome} <span className="text-red-400 font-black ml-2">{a.dano}</span></span>
                        <p className="text-[10px] uppercase text-gray-500 tracking-widest">Tipo: {a.tipo} | Alcance: {a.alcance} | Crítico: {a.critico}</p>
                      </div>
                      <button onClick={() => atualizarFicha('armas', ficha.dados.armas.filter((x:any)=>x.id!==a.id))} className="text-gray-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                    </div>
                  ))}
                  {ficha.dados.armas.length === 0 && <p className="text-center text-gray-600 text-xs font-bold uppercase tracking-widest mt-10">Nenhum item adicionado.</p>}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── MODALS (VISUAL C.R.I.S.) ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111] w-full max-w-3xl rounded-xl border border-gray-800 flex flex-col max-h-[85vh] shadow-2xl">
            
            <div className="flex justify-between items-center p-4 border-b border-gray-800">
              <h2 className="text-white font-bold text-xl">{modalOpen === 'habilidades' ? 'Adicionar Habilidades' : 'Adicionar Itens'}</h2>
              <button onClick={() => setModalOpen(null)} className="text-gray-500 hover:text-white"><X size={20}/></button>
            </div>

            <div className="p-4 flex flex-col gap-4 overflow-hidden">
              <div className="flex gap-2">
                 <button className="bg-purple-600 text-white px-4 py-2 rounded-md text-xs font-bold">{modalOpen === 'habilidades' ? 'Habilidades' : 'Itens'}</button>
                 <button className="bg-transparent border border-gray-800 hover:border-gray-600 text-gray-400 px-4 py-2 rounded-md text-xs font-bold transition-colors">Meus Itens Customizados</button>
              </div>

              <div className="bg-[#1a1a1a] flex items-center px-4 py-3 rounded-md">
                <Search size={16} className="text-gray-500 mr-3"/>
                <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-transparent outline-none w-full text-sm text-white" />
              </div>

              <div className="space-y-2 overflow-y-auto custom-scrollbar pr-2 pb-4">
                {(sys[modalOpen === 'habilidades' ? 'comum' : 'armas'] || []).filter((i:any) => i.nome.toLowerCase().includes(searchTerm.toLowerCase())).map((item:any, idx:number) => (
                  <div key={idx} className="bg-[#151515] rounded-md border border-gray-800 overflow-hidden">
                    <div className="flex justify-between items-center p-4">
                      <div className="flex items-center gap-3">
                        <ChevronDown size={16} className="text-purple-600" />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">{item.nome}</span>
                          {item.dano && <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Dano: {item.dano} | Crit: {item.critico} | Alcance: {item.alcance}</span>}
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          if(modalOpen==='habilidades') atualizarFicha('habilidades', [...ficha.dados.habilidades, {...item, id: Date.now()}]);
                          else atualizarFicha('armas', [...ficha.dados.armas, {...item, id: Date.now()}]);
                        }} 
                        className="bg-purple-600 hover:bg-purple-500 text-white p-1.5 rounded transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
      `}</style>
    </main>
  );
}
