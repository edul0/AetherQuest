"use client";
import React, { useEffect, useState, useRef } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ficha, setFicha] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillDice, setNewSkillDice] = useState("");

  useEffect(() => {
    carregarFicha();
  }, [id]);

  const carregarFicha = async () => {
    const { data } = await supabase.from('fichas').select('*').eq('id', id).single();
    if (data) {
      const d = data.dados;
      if (d.nex === undefined) d.nex = 5;
      if (d.nivel === undefined) d.nivel = 1;
      
      const st = d.status;
      ['vida', 'sanidade', 'estamina'].forEach(attr => {
        if (typeof st[attr] === 'number') st[attr] = { atual: st[attr], max: st[attr] };
      });
      setFicha(data);
    }
    setLoading(false);
  };

  const recalcularMaximos = (dadosAtuais: any, sistema: string) => {
    const atr = dadosAtuais.atributos;
    const modVigor = Math.floor((atr.vigor - 10) / 2);
    const modSab = Math.floor((atr.sabedoria - 10) / 2);
    const modInt = Math.floor((atr.intelecto - 10) / 2);
    const modFor = Math.floor((atr.forca - 10) / 2);

    let vMax = 10, sMax = 10, eMax = 10;

    if (sistema === 'dnd5e') {
      const lv = dadosAtuais.nivel || 1;
      vMax = (10 + modVigor) + ((lv - 1) * (6 + modVigor));
      eMax = (10 + modFor) + ((lv - 1) * (2 + modFor));
      sMax = 0;
    } 
    else if (sistema === 'ordem_paranormal') {
      const nex = dadosAtuais.nex || 5;
      const rank = Math.max(1, Math.floor(nex / 5));
      vMax = 16 + modVigor + ((rank - 1) * (4 + modVigor));
      sMax = 12 + modSab + ((rank - 1) * (3 + modSab));
      eMax = 10 + modInt + ((rank - 1) * (2 + modInt)); // PE no Ordem
    }
    else if (sistema === 'memorias_postumas') {
      const lv = dadosAtuais.nivel || 1; // Memórias agora é Level!
      vMax = 20 + modVigor + ((lv - 1) * (5 + modVigor));
      sMax = 15 + modSab + ((lv - 1) * (4 + modSab));
      eMax = 15 + modFor + ((lv - 1) * (4 + modFor));
    }

    return {
      vida: { ...dadosAtuais.status.vida, max: Math.max(1, vMax) },
      sanidade: { ...dadosAtuais.status.sanidade, max: Math.max(0, sMax) },
      estamina: { ...dadosAtuais.status.estamina, max: Math.max(0, eMax) }
    };
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

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const path = `retratos/${id}-${Date.now()}.png`;
    const { data, error } = await supabase.storage.from('avatares').upload(path, file);
    if (data) {
      const { data: { publicUrl } } = supabase.storage.from('avatares').getPublicUrl(path);
      setFicha({ ...ficha, dados: { ...ficha.dados, avatar_url: publicUrl } });
    }
    setIsUploading(false);
  };

  const adicionarHabilidade = () => {
    if (!newSkillName || !newSkillDice) return;
    const habs = [...(ficha.dados.habilidades || []), { id: Date.now(), nome: newSkillName, dado: newSkillDice }];
    setFicha({ ...ficha, dados: { ...ficha.dados, habilidades: habs } });
    setNewSkillName(""); setNewSkillDice(""); setIsAddingSkill(false);
  };

  const salvarFicha = async () => {
    setIsSaving(true);
    await supabase.from('fichas').update({ nome_personagem: ficha.nome_personagem, sistema_preset: ficha.sistema_preset, dados: ficha.dados }).eq('id', id);
    setIsSaving(false);
  };

  if (loading) return <div className="h-screen bg-[#090e17] flex items-center justify-center text-[#4ad9d9]">Sincronizando...</div>;

  const isNEX = ficha.sistema_preset === 'ordem_paranormal';
  const hasSanity = ficha.sistema_preset !== 'dnd5e';

  return (
    <main className="min-h-screen bg-[#090e17] text-[#8b9bb4] p-4 md:p-8 relative overflow-y-auto pb-32 overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#1a2b4c]/20 to-transparent pointer-events-none z-0" />

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090e17]/90 backdrop-blur-sm px-4">
          <div className="bg-[#131b26] border border-red-900/50 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className={`${cinzel.className} text-red-400 text-2xl mb-4`}>Apagar Registro?</h2>
            <div className="flex gap-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 border border-[#2a3b52] py-3 rounded-lg">Cancelar</button>
              <button onClick={async () => { await supabase.from('fichas').delete().eq('id', id); router.push('/fichas'); }} className="flex-1 bg-red-900 text-white py-3 rounded-lg">Apagar</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
          <div className="w-full md:w-auto">
            <button onClick={() => router.push('/fichas')} className="flex items-center gap-2 text-[#6b7b94] hover:text-[#4ad9d9] mb-4 text-xs uppercase tracking-tighter"><ArrowLeft size={14} /> Hub</button>
            <select value={ficha.sistema_preset} onChange={(e) => mudarSistema(e.target.value)} className="bg-[#0a0f18] text-[#4ad9d9] text-[10px] uppercase font-bold border border-[#2a3b52] rounded px-2 py-1 mb-2">
              <option value="memorias_postumas">Memórias Póstumas (Level)</option>
              <option value="ordem_paranormal">Ordem Paranormal (NEX)</option>
              <option value="dnd5e">D&D 5e (Level)</option>
            </select>
            <input type="text" value={ficha.nome_personagem} onChange={(e) => setFicha({...ficha, nome_personagem: e.target.value})} className={`${cinzel.className} text-[#f0ebd8] text-4xl md:text-5xl font-black bg-transparent border-b border-transparent focus:border-[#4ad9d9] focus:outline-none w-full`} />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={salvarFicha} disabled={isSaving} className="flex-1 bg-[#218b8b] text-white px-6 py-2 rounded-full uppercase text-[10px] font-bold tracking-widest">{isSaving ? '...' : 'Salvar'}</button>
            <button onClick={() => setIsDeleteModalOpen(true)} className="p-2 border border-red-900/30 text-red-400 rounded-full"><Trash2 size={16}/></button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 space-y-6">
            <div onClick={() => fileInputRef.current?.click()} className="bg-[#131b26]/60 border border-[#2a3b52] rounded-2xl p-2 cursor-pointer group hover:border-[#4ad9d9]/50 transition-all">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              <div className="w-full aspect-[3/4] bg-[#0a0f18] rounded-xl flex items-center justify-center overflow-hidden">
                {isUploading ? <span className="animate-pulse text-[#4ad9d9]">...</span> : ficha.dados.avatar_url ? <img src={ficha.dados.avatar_url} className="w-full h-full object-cover" /> : <Camera size={48} className="text-[#2a3b52] group-hover:text-[#4ad9d9]" />}
              </div>
            </div>
            <div className="bg-[#131b26]/60 border border-[#2a3b52] rounded-2xl p-6 relative">
              <div className="absolute top-0 right-0 bg-[#1a2b4c] p-3 rounded-bl-2xl border-l border-b border-[#2a3b52]">
                <label className="block text-[8px] text-[#4ad9d9] tracking-[0.2em]">{isNEX ? 'NEX' : 'LEVEL'}</label>
                <input type="number" value={isNEX ? ficha.dados.nex : ficha.dados.nivel} onChange={(e) => atualizarProgressao(parseInt(e.target.value) || 0, isNEX ? 'nex' : 'nivel')} className="w-10 bg-transparent text-[#f0ebd8] font-black text-center focus:outline-none" />
              </div>
              <div className="space-y-4 pt-4 text-xs font-semibold">
                <div><label className="text-[#4ad9d9] text-[9px] uppercase tracking-widest">Idade</label><input type="text" value={ficha.dados.idade} onChange={(e) => setFicha({...ficha, dados: {...ficha.dados, idade: e.target.value}})} className="w-full bg-transparent border-b border-[#2a3b52] text-[#f0ebd8] focus:outline-none" /></div>
                <div><label className="text-[#4ad9d9] text-[9px] uppercase tracking-widest">Raça</label><input type="text" value={ficha.dados.raca} onChange={(e) => setFicha({...ficha, dados: {...ficha.dados, raca: e.target.value}})} className="w-full bg-transparent border-b border-[#2a3b52] text-[#f0ebd8] focus:outline-none" /></div>
              </div>
            </div>
          </div>

          <div className="md:col-span-8 space-y-6">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['vida', 'sanidade', 'estamina'].map(s => {
                const stat = ficha.dados.status[s];
                const active = s !== 'sanidade' || hasSanity;
                if (!active) return null;
                const color = s === 'vida' ? 'red' : s === 'sanidade' ? 'purple' : 'green';
                const pct = Math.min(100, (stat.atual / stat.max) * 100);
                return (
                  <div key={s} className="bg-[#131b26]/60 border border-[#2a3b52] p-4 rounded-2xl">
                    <div className="flex justify-between text-[10px] uppercase font-bold text-[#f0ebd8] mb-2"><span>{s}</span><span>{stat.atual}/{stat.max}</span></div>
                    <div className="h-1 bg-[#0a0f18] rounded-full overflow-hidden mb-4"><div className="h-full bg-current transition-all" style={{ width: `${pct}%`, color: color }} /></div>
                    <div className="flex justify-between gap-1">
                      <button onClick={() => atualizarStatusAtual(s, '-1', true)} className="p-1 border border-[#2a3b52] rounded hover:bg-white/5"><Minus size={12}/></button>
                      <input type="number" value={stat.atual} onChange={(e) => atualizarStatusAtual(s, e.target.value)} className="w-full bg-transparent text-center font-black text-white focus:outline-none" />
                      <button onClick={() => atualizarStatusAtual(s, '1', true)} className="p-1 border border-[#2a3b52] rounded hover:bg-white/5"><Plus size={12}/></button>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="bg-[#131b26]/60 border border-[#2a3b52] p-6 rounded-2xl">
              <h3 className={`${cinzel.className} text-[#f0ebd8] mb-6 text-sm tracking-widest`}>ATRIBUTOS</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(ficha.dados.atributos).map(([k, v]: any) => (
                  <div key={k} className="bg-[#0a0f18] border border-[#1a2b4c] p-2 rounded-xl flex items-center gap-3">
                    <input type="number" value={v} onChange={(e) => atualizarAtributo(k, parseInt(e.target.value) || 0)} className="w-10 h-10 bg-[#0d131f] rounded text-center text-[#4ad9d9] font-black focus:outline-none" />
                    <div className="text-[10px] uppercase tracking-tighter">{k}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-[#131b26]/60 border border-[#2a3b52] p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className={`${cinzel.className} text-[#f0ebd8] text-sm tracking-widest uppercase`}>Habilidades</h3>
                <button onClick={() => setIsAddingSkill(!isAddingSkill)} className="p-1.5 border border-[#4ad9d9]/30 text-[#4ad9d9] rounded-full hover:bg-[#4ad9d9]/10"><Plus size={16}/></button>
              </div>
              {isAddingSkill && (
                <div className="flex flex-col md:flex-row gap-2 mb-4 bg-[#0a0f18] p-3 rounded-xl border border-[#4ad9d9]/30">
                  <input type="text" placeholder="Nome" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} className="bg-transparent border-b border-[#2a3b52] text-sm text-white px-2 py-1 w-full focus:outline-none" />
                  <input type="text" placeholder="Dado" value={newSkillDice} onChange={(e) => setNewSkillDice(e.target.value)} className="bg-transparent border-b border-[#2a3b52] text-sm text-white px-2 py-1 w-24 focus:outline-none" />
                  <button onClick={adicionarHabilidade} className="bg-[#4ad9d9] text-black px-4 py-1 rounded text-[10px] font-bold uppercase">OK</button>
                </div>
              )}
              <div className="space-y-2">
                {ficha.dados.habilidades?.map((h: any) => (
                  <div key={h.id} className="flex justify-between bg-[#0a0f18]/50 p-3 rounded-xl border border-[#1a2b4c] group">
                    <span className="text-white font-bold text-xs">{h.nome}</span>
                    <div className="flex gap-2">
                      <span className="bg-[#1a2b4c] text-[#4ad9d9] px-2 py-0.5 rounded font-mono text-[10px]">{h.dado}</span>
                      <button onClick={() => setFicha({...ficha, dados: {...ficha.dados, habilidades: ficha.dados.habilidades.filter((x:any) => x.id !== h.id)}})} className="text-red-900 group-hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
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
