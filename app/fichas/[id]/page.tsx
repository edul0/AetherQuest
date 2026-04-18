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
      if (!data.dados.status) {
         data.dados.status = {
             vida: { atual: 10, max: 10 }, sanidade: { atual: 10, max: 10 }, estamina: { atual: 10, max: 10 }
         };
      }
      setFicha(data);
      const sys = PRESETS[data.sistema_preset as keyof typeof PRESETS];
      if (sys && sys.categorias_hab) setActiveTab(sys.categorias_hab[0].id);
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

  if (loading) return <div className="min-h-screen bg-[#090e17] flex items-center justify-center text-[#4ad9d9] font-mono tracking-widest animate-pulse">Sincronizando Realidade...</div>;

  const isOP = ficha.sistema_preset === 'ordem_paranormal';
  const noArrows = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const inputClass = "bg-transparent text-[#f0ebd8] text-sm outline-none border-b border-[#2a3b52] focus:border-[#4ad9d9] hover:border-[#6b7b94] transition-colors p-1 w-full";
  const currentSys = PRESETS[ficha.sistema_preset as keyof typeof PRESETS] as any;

  return (
    <main className={`min-h-screen w-full bg-[#090e17] text-[#8b9bb4] relative pb-32 ${inter.className} selection:bg-[#4ad9d9]/30 selection:text-white`}>
      
      {/* HEADER NAVBAR - TEMA AETHERQUEST */}
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

              {/* PENTAGRAMA - TEMA CIANO */}
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
                 <div className="flex flex-col items-center justify-center
