"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../src/lib/supabase'; 
import { Cinzel, Inter } from 'next/font/google';
import { Camera, ArrowLeft, Trash2, Zap, Shield, Plus } from 'lucide-react';
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkill, setNewSkill] = useState({ nome: "", dado: "", desc: "" });

  useEffect(() => { 
    if (id && id !== 'undefined') {
      carregarFicha(); 
    } else {
      setLoading(false);
    }
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
        if (!data.dados.status) {
           data.dados.status = {
               vida: { atual: 10, max: 10 }, sanidade: { atual: 10, max: 10 }, estamina: { atual: 10, max: 10 }
           };
        }
        setFicha(data);
        const sys = PRESETS[data.sistema_preset as keyof typeof PRESETS];
        if (sys && sys.categorias_hab) setActiveTab(sys.categorias_hab[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar ficha:", error);
    } finally {
      setLoading(false);
    }
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
    for (let i = 0; i < keys.length - 1; i++) {
        if (temp[keys[i]] === undefined) temp[keys[i]] = {};
        temp = temp[keys[i]];
    }
    temp[keys[keys.length - 1]] = valor;

    const dadosComStatus = { ...novosDados, status: recalcularMaximos(novosDados, ficha.sistema_preset) };
    setFicha({ ...ficha, dados: dadosComStatus });
  };

  const salvarNoBanco = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('fichas').update({ 
          nome_personagem: ficha.nome_personagem, 
          sistema_preset: ficha.sistema_preset, 
          dados: ficha.dados 
      }).eq('id', id);
      
      if (error) throw error;
      alert("✔️ Ficha guardada com sucesso!");
    } catch (err: any) {
      console.error("Erro fatal ao guardar:", err);
      alert(`❌ Erro na Base de Dados: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
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

  const adicionarHabilidade = () => {
    if (!newSkill.nome) return;
    const habs = [...(ficha.dados.habilidades || []), { ...newSkill, id: Date.now(), cat: activeTab }];
    atualizarFicha('habilidades', habs);
    setNewSkill({ nome: "", dado: "", desc: "" });
    setIsAddingSkill(false);
  };

  // --- EARLY RETURNS (BLINDAGEM ANTI-CRASH) ---

  if (!id || id === 'undefined') {
    return (
      <div className="min-h-screen bg-[#090e17] flex flex-col items-center justify-center text-[#8b9bb4]">
        <h2 className="text-xl mb-4 font-bold text-red-500">Erro Fatal: ID não encontrado.</h2>
        <p className="text-sm mb-4">A URL está sem o ID do personagem. Verifique se clicou em um link quebrado.</p>
        <p className="text-xs mb-8 text-[#6b7b94]">Este código pertence EXCLUSIVAMENTE ao arquivo: <strong>app/fichas/[id]/page.tsx</strong></p>
        <button onClick={() => router.push('/fichas')} className="bg-[#4ad9d9] text-[#090e17] px-6 py-2 rounded text-xs font-black uppercase tracking-widest hover:bg-white transition-all">Voltar ao Hub de Fichas</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090e17] flex items-center justify-center text-[#4ad9d9] font-mono tracking-widest animate-pulse">
        Sincronizando Realidade...
      </div>
    );
  }

  if (!ficha) {
    return (
      <div className="min-h-screen bg-[#090e17] flex flex-col items-center justify-center text-[#8b9bb4]">
        <h2 className="text-xl mb-4 font-bold text-red-500">Erro: Ficha não encontrada.</h2>
        <p className="text-sm mb-8">Nenhum personagem com este ID foi encontrado no banco de dados.</p>
        <button onClick={() => router.push('/fichas')} className="bg-[#4ad9d9] text-[#090e17] px-6 py-2 rounded text-xs font-black uppercase tracking-widest hover:bg-white transition-all">Voltar ao Hub de Fichas</button>
      </div>
    );
  }

  // --- RENDERIZAÇÃO SEGURA ---
  const isOP = ficha.sistema_preset === 'ordem_paranormal';
  const noArrows = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const inputClass = "bg-transparent text-[#f0ebd8] text-sm outline-none border-b border-[#2a3b52] focus:border-[#4ad9d9] hover:border-[#6b7b94] transition-colors p-1 w-full";
  const currentSys = PRESETS[ficha.sistema_preset as keyof typeof PRESETS] as any;

  return (
    <main className={`min-h-screen w-full bg-[#090e17] text-[#8b9bb4] relative pb-32 ${inter.className} selection:bg-[#4ad9d9]/30 selection:text-white`}>
      {/* HEADER NAVBAR */}
      <header className="bg-[#090e17]/90 backdrop-blur-sm border-b border-[#2a3b52] p-4 px-8 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button onClick={() => router.push('/fichas')} className="text-xs uppercase tracking-widest text-[#6b7b94] hover:text-[#4ad9d9] flex items-center gap-2 transition-colors"><ArrowLeft size={14}/> Voltar ao Hub</button>
          <select value={ficha.sistema_preset} onChange={(e) => {
             const novosStatus = recalcularMaximos(ficha.dados, e.target.value);
             setFicha({ ...ficha, sistema_preset: e.target.value, dados: { ...ficha.dados, status: novosStatus } });
          }} className="bg-[#131b26] text-[#4ad9d9] text-[10px] uppercase tracking-widest font-bold outline-none cursor-pointer border border-[#2a3b52] rounded px-2 py-1 hover:border-[#4ad9d9] transition-colors">
            <option value="ordem_paranormal" className="bg-[#090e17]">Ordem Paranormal</option>
            <option value="dnd5e" className="bg-[#090e17]">D&D 5e</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsDeleteModalOpen(true)} className="p-2 border border-red-900/30 text-red-500 rounded hover:bg-red-900/20 transition-all"><Trash2 size={16}/></button>
          <button onClick={salvarNoBanco} disabled={isSaving} className="bg-[#4ad9d9] text-[#090e17] px-6 py-2 rounded text-xs uppercase tracking-widest font-bold hover:bg-white transition-all shadow-[0_0_15px_rgba(74,217,217,0.3)]">
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </header>

      {/* MODAL APAGAR */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090e17]/90 backdrop-blur-sm px-4">
          <div className="bg-[#131b26] border border-[#2a3b52] rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <h2 className={`${cinzel.className} text-red-400 text-2xl mb-4 font-bold`}>Apagar Personagem?</h2>
            <div className="flex gap-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 border border-[#2a3b52] py-2 rounded-lg text-[#f0ebd8] hover:bg-white/5 transition">Cancelar</button>
              <button onClick={async () => { await supabase.from('fichas').delete().eq('id', id); router.push('/fichas'); }} className="flex-1 bg-red-900/80 border border-red-900 text-white py-2 rounded-lg font-bold hover:bg-red-600 transition">Apagar</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto p-6 mt-4">
        {isOP ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* COLUNA ESQUERDA */}
            <div className="xl:col-span-4 flex flex-col items-center space-y-8">
              
              {/* CARTÃO IDENTIDADE */}
              <div className="w-full flex gap-4 bg-[#131b26]/60 p-4 rounded-xl border border-[#2a3b52] shadow-lg">
                <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 bg-[#0a0f18] border border-[#2a3b52] rounded overflow-hidden cursor-pointer flex-shrink-0 flex items-center justify-center hover:border-[#4ad9d9] transition-colors shadow-inner relative group">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                  {isUploading ? <span className="text-xs text-[#4ad9d9] animate-pulse">...</span> : ficha.dados.avatar_url ? <img src={ficha.dados.avatar_url} className="w-full h-full object-cover" alt="Avatar"/> : <Camera size={24} className="text-[#6b7b94] group-hover:text-[#4ad9d9]" />}
                </div>
                <div className="flex-1 space-y-3 pt-1">
                   {[
                     { label: 'Personagem', caminho: 'nome_personagem', val: ficha.nome_personagem },
                     { label: 'Origem', caminho: 'origem', val: ficha.dados.origem || '' },
                     { label: 'Classe', caminho: 'classe', val: ficha.dados.classe || '' }
                   ].map(field => (
                     <div key={field.label} className="border-b border-[#2a3b52] pb-1 flex items-end">
                       <span className="text-[9px] uppercase tracking-widest text-[#4ad9d9] w-24 flex-shrink-0 font-bold">{field.label}</span>
                       <input type="text" value={field.val} onChange={(e) => field.caminho === 'nome_personagem' ? setFicha({...ficha, nome_personagem: e.target.value}) : atualizarFicha(field.caminho, e.target.value)} className="bg-transparent text-[#f0ebd8] font-bold outline-none w-full text-sm placeholder:text-[#6b7b94]" placeholder="..." />
                     </div>
                   ))}
                </div>
              </div>

              {/* PENTAGRAMA */}
              <div className="relative w-[320px] h-[320px] my-6 flex items-center justify-center">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[50px] left-[160px] w-0.5 h-[220px] bg-[#4ad9d9]/20 -translate-x-1/2" />
                    <div className="absolute top-[160px] left-[50px] w-[220px] h-0.5 bg-[#4ad9d9]/20 -translate-y-1/2" />
                    <div className="absolute top-[160px] left-[50px] w-[220px] h-0.5 bg-[#4ad9d9]/20 -translate-y-1/2 rotate-45" />
                    <div className="absolute top-[160px] left-[50px] w-[220px] h-0.5 bg-[#4ad9d9]/20 -translate-y-1/2 -rotate-45" />
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110px] h-[110px] rounded-full border border-[#2a3b52] flex items-center justify-center bg-[#0a0f18] z-10 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                  <span className={`${cinzel.className} font-black text-[#6b7b94] tracking-widest text-[11px]`}>ATRIBUTOS</span>
                </div>
                
                {[
                  { id: 'agilidade', label: 'AGI', nome: 'AGILIDADE', top: '0%', left: '50%', tx: '-50%', ty: '0%' },
                  { id: 'intelecto', label: 'INT', nome: 'INTELECTO', top: '35%', left: '100%', tx: '-100%', ty: '-50%' },
                  { id: 'vigor', label: 'VIG', nome: 'VIGOR', top: '100%', left: '80%', tx: '-100%', ty: '-100%' },
                  { id: 'presenca', label: 'PRE', nome: 'PRESENÇA', top: '100%', left: '20%', tx: '0%', ty: '-100%' },
                  { id: 'forca', label: 'FOR', nome: 'FORÇA', top: '35%', left: '0%', tx: '0%', ty: '-50%' },
                ].map((atr) => (
                  <div key={atr.id} className="absolute flex flex-col items-center justify-center w-[85px] h-[85px] rounded-full border border-[#4ad9d9]/30 bg-[#131b26] z-20 hover:border-[#4ad9d9] transition-all shadow-[0_0_15px_rgba(74,217,217,0.15)] hover:scale-105" style={{ top: atr.top, left: atr.left, transform: `translate(${atr.tx}, ${atr.ty})` }}>
                    <input type="number" value={ficha.dados.atributos?.[atr.id] || 1} onChange={(e) => atualizarFicha(`atributos.${atr.id}`, parseInt(e.target.value) || 0)} className={`bg-transparent text-center font-bold text-3xl text-[#f0ebd8] w-14 outline-none ${noArrows}`} />
                    <span className="text-[8px] font-black text-[#6b7b94] leading-tight uppercase tracking-widest text-center">{atr.nome}<br/><span className="text-[#4ad9d9] font-black">{atr.label}</span></span>
                  </div>
                ))}
              </div>

              {/* PROGRESSÃO & DESLOCAMENTO */}
              <div className="flex gap-4 w-full justify-center bg-[#131b26]/60 p-4 rounded-xl border border-[#2a3b52] shadow-lg">
                 <div className="flex flex-col items-center">
                   <div className="flex items-center border border-[#2a3b52] bg-[#0a0f18] rounded-lg overflow-hidden h-9 shadow-inner">
                     <span className="text-[10px] font-black px-3 text-[#6b7b94] uppercase tracking-widest">NEX</span>
                     <input type="number" value={ficha.dados.nex || 5} onChange={(e) => {
                       const val = Math.max(0, parseInt(e.target.value) || 0);
                       const novosDados = { ...ficha.dados, nex: val };
                       setFicha({ ...ficha, dados: { ...novosDados, status: recalcularMaximos(novosDados, ficha.sistema_preset) } });
                     }} className={`w-14 bg-[#050a10] text-[#4ad9d9] text-center py-1 font-black text-lg outline-none border-l border-[#2a3b52] h-full ${noArrows}`} />
                     <span className="text-sm font-bold pr-3 bg-[#050a10] text-[#4ad9d9]/70">%</span>
                   </div>
                 </div>
                 <div className="flex flex-col items-center justify-center">
                   <div className="border border-[#2a3b52] bg-[#0a0f18] rounded-lg h-9 px-4 min-w-[110px] flex items-center justify-center font-bold text-[#f0ebd8] text-sm shadow-inner">
                      <input type="text" value={ficha.dados.deslocamento || "9m / 6q"} onChange={(e) => atualizarFicha('deslocamento', e.target.value)} className="bg-transparent text-center outline-none w-full"/>
                   </div>
                   <span className="text-[8px] uppercase text-[#6b7b94] mt-1 font-bold tracking-widest">DESLOCAMENTO</span>
                 </div>
              </div>
            </div>

            {/* COLUNA DIREITA */}
            <div className="xl:col-span-8 space-y-8">
              
              {/* BARRAS & DEFESAS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#131b26]/60 p-6 rounded-2xl border border-[#2a3b52] shadow-xl">
                
                <div className="space-y-5">
                  {[
                    { key: 'vida', label: 'VIDA', color: 'bg-red-600', fill: '#dc2626' },
                    { key: 'sanidade', label: 'SANIDADE', color: 'bg-purple-600', fill: '#a855f7' }, 
                    { key: 'estamina', label: 'ESFORÇO', color: 'bg-yellow-500', fill: '#eab308' } 
                  ].map(s => {
                    const stat = ficha.dados.status?.[s.key] || { atual: 10, max: 10 };
                    const pct = Math.max(0, Math.min(100, (stat.atual / stat.max) * 100));
                    
                    return (
                      <div key={s.key} className="flex items-center gap-4 group">
                         <div className="w-24 text-right flex-shrink-0">
                           <span className="text-[10px] font-black uppercase tracking-widest text-[#6b7b94]">{s.label}</span>
                         </div>
                         <div className="flex-1 flex border border-[#2a3b52] rounded bg-[#0a0f18] overflow-hidden h-11 shadow-inner relative">
                           <button onClick={() => atualizarFicha(`status.${s.key}.atual`, Math.max(0, stat.atual - 1))} className="px-4 text-[#6b7b94] hover:text-[#f0ebd8] hover:bg-[#2a3b52] font-bold transition-colors z-20">-</button>
                           <div className="flex-1 flex items-center justify-center relative">
                              <div className="absolute top-0 left-0 h-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: s.fill, opacity: 0.8 }}></div>
                              <div className="relative z-10 flex items-center font-black text-white text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                                <input type="number" value={stat.atual} onChange={(e) => atualizarFicha(`status.${s.key}.atual`, Math.max(0, Math.min(stat.max, parseInt(e.target.value)||0)))} className={`bg-transparent text-right w-11 outline-none ${noArrows}`} />
                                <span className="opacity-80">/{stat.max}</span>
                              </div>
                           </div>
                           <button onClick={() => atualizarFicha(`status.${s.key}.atual`, Math.min(stat.max, stat.atual + 1))} className="px-4 text-[#6b7b94] hover:text-[#f0ebd8] hover:bg-[#2a3b52] transition-colors z-20 font-bold">+</button>
                         </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-6">
                  <div className="flex items-end gap-6 justify-center md:justify-start pt-1">
                    <div className="flex items-center gap-3 bg-[#0a0f18] p-2 pr-4 rounded-xl border border-[#2a3b52] shadow-inner">
                      <div className="relative flex items-center justify-center w-14 h-16 bg-[#131b26] border border-[#4ad9d9]/30 rounded-lg shadow-inner">
                        <Shield className="absolute text-[#4ad9d9] w-full h-full opacity-10 p-2" strokeWidth={1}/>
                        <input type="number" value={ficha.dados.defesa?.passiva || 10} onChange={(e) => atualizarFicha('defesa.passiva', parseInt(e.target.value)||0)} className={`bg-transparent text-[#f0ebd8] font-black text-2xl text-center w-full z-10 outline-none relative -top-0.5 ${noArrows}`} />
                      </div>
                      <div className="flex flex-col">
                        <span className={`${cinzel.className} text-[14px] font-black text-[#4ad9d9] tracking-widest leading-none`}>DEFESA</span>
                        <span className="text-[9px] text-[#6b7b94] font-mono mt-0.5">= 10 + AGI + Equip</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-[#6b7b94] tracking-widest mb-1.5 uppercase">BLOQUEIO</span>
                      <input type="number" value={ficha.dados.defesa?.bloqueio || 0} onChange={(e) => atualizarFicha('defesa.bloqueio', parseInt(e.target.value)||0)} className={`w-16 bg-[#0a0f18] border border-[#2a3b52] text-center text-[#f0ebd8] py-1.5 rounded-lg font-bold outline-none focus:border-[#4ad9d9] ${noArrows}`} />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-[#6b7b94] tracking-widest mb-1.5 uppercase">ESQUIVA</span>
                      <input type="number" value={ficha.dados.defesa?.esquiva || 0} onChange={(e) => atualizarFicha('defesa.esquiva', parseInt(e.target.value)||0)} className={`w-16 bg-[#0a0f18] border border-[#2a3b52] text-center text-[#f0ebd8] py-1.5 rounded-lg font-bold outline-none focus:border-[#4ad9d9] ${noArrows}`} />
                    </div>
                  </div>

                  <div className="space-y-3 bg-[#0a0f18]/50 p-3 rounded-lg border border-[#2a3b52]">
                    {[ { label: 'PROTEÇÃO', caminho: 'protecao' }, { label: 'RESISTÊNCIAS', caminho: 'resistencias' } ].map(r => (
                      <div key={r.label} className="flex items-end gap-3">
                        <span className="text-[10px] font-black text-[#6b7b94] tracking-widest w-24 text-right mb-1">{r.label}</span>
                        <input type="text" value={ficha.dados[r.caminho] || ''} onChange={(e) => atualizarFicha(r.caminho, e.target.value)} className="flex-1 bg-transparent border-b border-[#2a3b52] text-[#f0ebd8] text-xs outline-none focus:border-[#4ad9d9] p-1" placeholder="Nenhuma" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* MENU DE ABAS */}
              <div className="border-b border-[#2a3b52] flex overflow-x-auto scrollbar-hide pt-1 bg-[#131b26]/50 rounded-t-xl">
                {currentSys?.categorias_hab ? (
                  currentSys.categorias_hab.map((cat:any) => (
                    <button key={cat.id} onClick={() => setActiveTab(cat.id)} className={`px-7 py-3 text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === cat.id ? 'text-[#4ad9d9] border-b-2 border-[#4ad9d9] bg-[#4ad9d9]/10' : 'text-[#6b7b94] hover:text-[#f0ebd8] hover:bg-white/5'}`}>
                      {cat.nome}
                    </button>
                  ))
                ) : (
                  ['pericias', 'comum', 'rituais', 'armas'].map(id => (
                    <button key={id} onClick={() => setActiveTab(id)} className={`px-7 py-3 text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === id ? 'text-[#4ad9d9] border-b-2 border-[#4ad9d9] bg-[#4ad9d9]/10' : 'text-[#6b7b94] hover:text-[#f0ebd8]'}`}>{id}</button>
                  ))
                )}
              </div>

              <div className="py-2">
                
                {/* ABA 1: PERÍCIAS */}
                {activeTab === 'pericias' && (
                  <div className="bg-[#131b26]/60 border border-[#2a3b52] rounded-b-xl rounded-t-none p-6 shadow-xl">
                    <div className="flex justify-between items-center border-b border-[#2a3b52] pb-3 mb-5 px-3">
                      <span className="text-[11px] font-black text-[#6b7b94] w-1/3 uppercase tracking-widest">PERÍCIA</span>
                      <div className="flex w-2/3 justify-between text-center items-center">
                        <span className="text-[10px] font-black text-[#6b7b94] w-20 uppercase tracking-widest">ATR</span>
                        <span className="text-[10px] font-black text-[#4ad9d9] w-20 uppercase tracking-widest">TOTAL</span>
                        <span className="text-[10px] font-black text-[#6b7b94] w-20 uppercase tracking-widest">TREINO</span>
                        <span className="text-[10px] font-black text-[#6b7b94] w-20 uppercase tracking-widest">OUTROS</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2 scrollbar-aq">
                      {PERICIAS_ORDEM.map(p => {
                        const treinado = ficha.dados.pericias?.[p.nome]?.treino || 0;
                        const outros = ficha.dados.pericias?.[p.nome]?.outros || 0;
                        const atrVal = ficha.dados.atributos?.[p.atr] || 0;
                        const total = treinado + outros;
                        const isTrained = treinado > 0;

                        return (
                          <div key={p.nome} className={`flex justify-between items-center py-2 px-3 rounded-lg hover:bg-white/5 transition-colors ${isTrained ? 'text-[#f0ebd8]' : 'text-[#6b7b94]'}`}>
                            <div className="w-1/3 flex items-center gap-2">
                              <Zap size={14} className="text-[#2a3b52] hover:text-[#4ad9d9] cursor-pointer"/>
                              <span className={`text-sm ${isTrained ? 'font-bold text-[#4ad9d9]' : 'font-medium'}`}>{p.nome}</span>
                            </div>
                            <div className="flex w-2/3 justify-between text-center items-center font-mono text-xs">
                              <span className="w-20 text-[#6b7b94]">{atrVal} {p.atr.substring(0,3).toUpperCase()}</span>
                              <span className={`w-20 font-black text-sm ${isTrained ? 'text-[#4ad9d9]' : 'text-[#6b7b94]'}`}>+{total}</span>
                              <input type="number" value={treinado} onChange={(e) => atualizarFicha(`pericias.${p.nome}.treino`, parseInt(e.target.value)||0)} className={`w-20 bg-[#0a0f18] border border-[#2a3b52] rounded-md text-center py-1 outline-none focus:border-[#4ad9d9] focus:text-[#f0ebd8] ${isTrained ? 'text-[#4ad9d9]' : 'text-[#6b7b94]'} ${noArrows}`} />
                              <input type="number" value={outros} onChange={(e) => atualizarFicha(`pericias.${p.nome}.outros`, parseInt(e.target.value)||0)} className={`w-20 bg-[#0a0f18] border border-[#2a3b52] rounded-md text-center py-1 outline-none focus:border-[#4ad9d9] focus:text-[#f0ebd8] ${isTrained ? 'text-[#4ad9d9]' : 'text-[#6b7b94]'} ${noArrows}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ABA: HABILIDADES, RITUAIS */}
                {activeTab !== 'pericias' && activeTab !== 'armas' && (
                  <div className="space-y-5">
                     <div className="flex justify-between items-center bg-[#131b26]/50 p-3 rounded-lg border border-[#2a3b52]">
                       <h4 className="text-[11px] font-black uppercase text-[#6b7b94] tracking-widest">
                          {currentSys?.categorias_hab?.find((c:any) => c.id === activeTab)?.nome || 'Poderes'}
                       </h4>
                       <button onClick={() => setIsAddingSkill(!isAddingSkill)} className="bg-[#4ad9d9] text-[#090e17] px-5 py-2 rounded text-[10px] font-bold uppercase hover:bg-white transition-all shadow-[0_0_15px_rgba(74,217,217,0.2)]">Adicionar</button>
                     </div>

                     {isAddingSkill && (
                       <div className="bg-[#0a0f18] border border-[#4ad9d9]/30 p-5 rounded-xl space-y-4 shadow-inner">
                         <div className="flex items-center gap-2 mb-2">
                           <span className="text-xs text-[#4ad9d9] font-bold uppercase">Preset do Livro:</span>
                           <select onChange={(e) => {
                               const habData = currentSys?.[activeTab]?.find((h: any) => h.nome === e.target.value);
                               if (habData) setNewSkill({ nome: habData.nome, dado: habData.dado || "", desc: habData.desc || "" });
                           }} className="bg-[#131b26] border border-[#2a3b52] text-[#f0ebd8] text-xs px-2 py-1 outline-none cursor-pointer rounded">
                             <option value="">Digitar Manualmente...</option>
                             {currentSys?.[activeTab]?.map((a:any) => <option key={a.nome} value={a.nome}>{a.nome}</option>)}
                           </select>
                         </div>
                         <input type="text" placeholder="Nome" value={newSkill.nome} onChange={(e) => setNewSkill({...newSkill, nome: e.target.value})} className={inputClass} />
                         <input type="text" placeholder="Custo / Dado" value={newSkill.dado} onChange={(e) => setNewSkill({...newSkill, dado: e.target.value})} className={inputClass} />
                         <textarea placeholder="Descrição completa..." value={newSkill.desc} onChange={(e) => setNewSkill({...newSkill, desc: e.target.value})} className={`${inputClass} resize-none`} rows={3}/>
                         <div className="flex justify-end gap-2 mt-2">
                           <button onClick={() => setIsAddingSkill(false)} className="text-[#6b7b94] text-[10px] font-bold uppercase px-4 py-2 hover:text-[#f0ebd8]">Cancelar</button>
                           <button onClick={adicionarHabilidade} className="bg-[#4ad9d9] text-[#090e17] py-2 rounded text-[10px] font-bold uppercase px-6 hover:bg-white transition-all">Guardar</button>
                         </div>
                       </div>
                     )}

                     <div className="space-y-4">
                       {ficha.dados.habilidades?.filter((h:any) => h.cat === activeTab).map((h:any) => (
                         <div key={h.id} className="bg-[#0a0f18] border border-[#1a2b4c] rounded-xl p-5 group relative hover:border-[#4ad9d9]/50 transition-colors shadow-md">
                           <button onClick={() => atualizarFicha('habilidades', ficha.dados.habilidades.filter((x:any) => x.id !== h.id))} className="absolute top-4 right-4 text-[#2a3b52] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                           <div className="flex gap-4 items-end mb-3 border-b border-[#1a2b4c] pb-2">
                             <h5 className={`${cinzel.className} font-black text-[#f0ebd8] text-xl tracking-tight`}>{h.nome}</h5>
                             {h.dado && <span className="bg-[#131b26] border border-[#2a3b52] text-[#4ad9d9] px-3 py-1 rounded-full text-[10px] font-mono shadow-inner">{h.dado}</span>}
                           </div>
                           <p className="text-sm text-[#8b9bb4] whitespace-pre-wrap leading-relaxed pr-8 font-medium">{h.desc}</p>
                         </div>
                       ))}
                       {ficha.dados.habilidades?.filter((h:any) => h.cat === activeTab).length === 0 && (
                         <div className="text-center py-16 text-[#2a3b52] border border-[#1a2b4c] rounded-xl bg-[#0a0f18] font-bold uppercase tracking-widest text-xs">Vazio. Adiciona novas habilidades.</div>
                       )}
                     </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-[#0a0f18] rounded-2xl border border-[#2a3b52]">
             <span className="text-[#4ad9d9] font-black text-xl mb-3">Layout D&D 5e Ativo</span>
             <span className="text-[#6b7b94] italic text-sm max-w-md">O sistema de D&D usa um layout simplificado em blocos. Mude o sistema no topo para "Ordem Paranormal" para ver o design completo C.R.I.S.</span>
          </div>
        )}
      </div>

      <style jsx global>{`
        .scrollbar-aq::-webkit-scrollbar { width: 5px; }
        .scrollbar-aq::-webkit-scrollbar-track { background: #0a0f18; border-radius: 10px; }
        .scrollbar-aq::-webkit-scrollbar-thumb { background: #1a2b4c; border-radius: 10px; }
        .scrollbar-aq::-webkit-scrollbar-thumb:hover { background: #4ad9d9; }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </main>
  );
}
