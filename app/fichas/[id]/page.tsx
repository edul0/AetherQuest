"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../src/lib/supabase';
import { Cinzel, Inter } from 'next/font/google';
import { Shield, Brain, Zap, User, Camera, Plus, Dices, Swords, Save, ArrowLeft, Trash2, X, Minus } from 'lucide-react';
import Image from 'next/image';

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
    const { data, error } = await supabase.from('fichas').select('*').eq('id', id).single();
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

  // --- O MOTOR MULTISSISTEMA ---
  const recalcularMaximos = (dadosAtuais: any, sistema: string) => {
    const atr = dadosAtuais.atributos;
    const modVigor = Math.floor((atr.vigor - 10) / 2);
    const modSabedoria = Math.floor((atr.sabedoria - 10) / 2);
    const modForca = Math.floor((atr.forca - 10) / 2);

    let novaVidaMax = 10;
    let novaSanidadeMax = 10;
    let novaEstaminaMax = 10;

    if (sistema === 'dnd5e') {
      const nivel = dadosAtuais.nivel || 1;
      // D&D genérico: D8 de vida. 8 no nível 1 + mod, 5 + mod por nível extra.
      novaVidaMax = (8 + modVigor) + ((nivel - 1) * (5 + modVigor));
      novaEstaminaMax = (10 + modForca) + ((nivel - 1) * (2 + modForca)); 
      novaSanidadeMax = 0; // D&D não usa sanidade
    } 
    else if (sistema === 'memorias_postumas') {
      const nex = dadosAtuais.nex || 5;
      const nivelNex = Math.max(1, Math.floor(nex / 5));
      novaVidaMax = 16 + modVigor + ((nivelNex - 1) * (4 + modVigor));
      novaSanidadeMax = 12 + modSabedoria + ((nivelNex - 1) * (3 + modSabedoria));
      novaEstaminaMax = 12 + modForca + ((nivelNex - 1) * (3 + modForca));
    }

    return {
      vida: { ...dadosAtuais.status.vida, max: Math.max(1, novaVidaMax) },
      sanidade: { ...dadosAtuais.status.sanidade, max: Math.max(0, novaSanidadeMax) },
      estamina: { ...dadosAtuais.status.estamina, max: Math.max(1, novaEstaminaMax) }
    };
  };

  const mudarSistema = (novoSistema: string) => {
    const novosStatus = recalcularMaximos(ficha.dados, novoSistema);
    setFicha({ ...ficha, sistema_preset: novoSistema, dados: { ...ficha.dados, status: novosStatus } });
  };

  const atualizarProgressao = (valor: number, tipo: 'nex' | 'nivel') => {
    const dadosAtualizados = { ...ficha.dados, [tipo]: Math.max(tipo === 'nivel' ? 1 : 0, valor) };
    const novosStatus = recalcularMaximos(dadosAtualizados, ficha.sistema_preset);
    setFicha({ ...ficha, dados: { ...dadosAtualizados, status: novosStatus } });
  };

  const atualizarAtributo = (key: string, valor: number) => {
    const dadosAtualizados = { ...ficha.dados, atributos: { ...ficha.dados.atributos, [key]: valor } };
    const novosStatus = recalcularMaximos(dadosAtualizados, ficha.sistema_preset);
    setFicha({ ...ficha, dados: { ...dadosAtualizados, status: novosStatus } });
  };

  const atualizarStatusAtual = (statNome: string, valorStr: string, incremental: boolean = false) => {
    let valor = parseInt(valorStr) || 0;
    const max = ficha.dados.status[statNome].max;
    const atual = ficha.dados.status[statNome].atual;
    let novoAtual = incremental ? atual + valor : valor;
    novoAtual = Math.max(0, Math.min(max, novoAtual));
    setFicha({ ...ficha, dados: { ...ficha.dados, status: { ...ficha.dados.status, [statNome]: { atual: novoAtual, max } } } });
  };

  // --- UPLOAD DE RETRATO REAL ---
  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);

    const path = `retratos/${id}-${Date.now()}.png`;
    // ATENÇÃO: Você precisa ter um bucket chamado 'avatares' no Supabase!
    const { data, error } = await supabase.storage.from('avatares').upload(path, file);

    if (error) {
      alert("Erro ao enviar retrato. O bucket 'avatares' existe e é público? " + error.message);
    } else if (data) {
      const { data: { publicUrl } } = supabase.storage.from('avatares').getPublicUrl(path);
      setFicha({ ...ficha, dados: { ...ficha.dados, avatar_url: publicUrl } });
    }
    setIsUploading(false);
  };

  const salvarFicha = async () => {
    setIsSaving(true);
    await supabase.from('fichas').update({ nome_personagem: ficha.nome_personagem, sistema_preset: ficha.sistema_preset, dados: ficha.dados }).eq('id', id);
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

  const isDnD = ficha.sistema_preset === 'dnd5e';

  return (
    <main className="min-h-screen bg-[#090e17] text-[#8b9bb4] p-4 md:p-8 relative overflow-y-auto pb-32 overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#1a2b4c]/20 to-transparent pointer-events-none z-0"></div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090e17]/90 backdrop-blur-sm px-4">
          <div className="bg-[#131b26] border border-red-900/50 rounded-2xl p-8 max-w-md w-full shadow-[0_0_40px_rgba(239,68,68,0.15)] relative">
            <h2 className={`${cinzel.className} text-red-400 text-2xl font-bold mb-2`}>Apagar Personagem?</h2>
            <p className={`${inter.className} text-sm text-[#8b9bb4] mb-6`}>A existência de <strong className="text-white">{ficha.nome_personagem}</strong> será apagada.</p>
            <div className="flex gap-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 border border-[#2a3b52] text-white py-3 rounded-lg">Cancelar</button>
              <button onClick={deletarFicha} className="flex-1 bg-red-900 text-white py-3 rounded-lg">Apagar</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto relative z-10">
        <header className="flex justify-between items-start mb-8">
          <div className="w-full md:w-auto">
            <button onClick={() => router.push('/fichas')} className="flex items-center gap-2 text-[#6b7b94] hover:text-[#4ad9d9] mb-4 text-xs uppercase"><ArrowLeft size={14} /> Hub</button>
            
            {/* SELETOR DE SISTEMA */}
            <select 
              value={ficha.sistema_preset} 
              onChange={(e) => mudarSistema(e.target.value)}
              className="bg-[#0a0f18] text-[#4ad9d9] text-xs uppercase font-semibold border border-[#2a3b52] rounded-md px-2 py-1 mb-2 focus:outline-none"
            >
              <option value="memorias_postumas">Ordem Paranormal (Memórias Póstumas)</option>
              <option value="dnd5e">Dungeons & Dragons 5e</option>
            </select>

            <input type="text" value={ficha.nome_personagem} onChange={(e) => setFicha({...ficha, nome_personagem: e.target.value})} className={`${cinzel.className} text-[#f0ebd8] text-4xl md:text-5xl font-black bg-transparent border-b border-transparent focus:border-[#4ad9d9] focus:outline-none w-full block mt-2`}/>
          </div>
          
          <div className="flex gap-3">
            <button onClick={salvarFicha} disabled={isSaving} className="bg-gradient-to-r from-[#218b8b] to-[#1a6666] text-white px-6 py-2 rounded-full uppercase text-xs font-semibold shadow-lg">
              {isSaving ? '...' : 'Salvar'}
            </button>
            <button onClick={() => setIsDeleteModalOpen(true)} className="bg-red-900/20 text-red-400 border border-red-900/30 px-4 rounded-full uppercase text-xs font-semibold"><Trash2 size={14}/></button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 space-y-6">
            
            {/* COMPONENTE DE RETRATO DINÂMICO */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#131b26]/60 backdrop-blur-md border border-[#2a3b52] rounded-2xl p-2 shadow-lg group cursor-pointer hover:border-[#4ad9d9]/50 transition-colors relative"
            >
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              <div className="w-full aspect-[3/4] bg-[#0a0f18] rounded-xl border border-[#1a2b4c] flex flex-col items-center justify-center text-[#2a3b52] overflow-hidden relative">
                {isUploading ? (
                  <span className="text-[#4ad9d9] animate-pulse">Forjando imagem...</span>
                ) : ficha.dados.avatar_url ? (
                  <img src={ficha.dados.avatar_url} alt="Retrato" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <>
                    <Camera size={48} strokeWidth={1} className="mb-2 group-hover:text-[#4ad9d9] transition-colors" />
                    <span className={`${inter.className} text-xs uppercase tracking-widest group-hover:text-[#4ad9d9] transition-colors`}>Adicionar Retrato</span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-[#131b26]/60 backdrop-blur-md border border-[#2a3b52] rounded-2xl p-6 shadow-lg space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#1a2b4c] border-b border-l border-[#2a3b52] rounded-bl-2xl p-3 text-center">
                 <label className="block text-[10px] uppercase tracking-widest text-[#4ad9d9] mb-1">{isDnD ? 'NÍVEL' : 'NEX (%)'}</label>
                 <input type="number" value={isDnD ? ficha.dados.nivel : ficha.dados.nex} onChange={(e) => atualizarProgressao(parseInt(e.target.value) || 0, isDnD ? 'nivel' : 'nex')} className="w-12 bg-transparent text-[#f0ebd8] font-bold text-lg text-center focus:outline-none" />
              </div>
              <div className="pt-2"><label className="block text-[10px] uppercase tracking-widest text-[#4ad9d9]">Idade / Altura</label><input type="text" value={ficha.dados.idade} onChange={(e) => setFicha({...ficha, dados: {...ficha.dados, idade: e.target.value}})} className="w-2/3 bg-transparent border-b border-[#2a3b52] text-[#f0ebd8] focus:outline-none pb-1" /></div>
              <div><label className="block text-[10px] uppercase tracking-widest text-[#4ad9d9]">Raça</label><input type="text" value={ficha.dados.raca} onChange={(e) => setFicha({...ficha, dados: {...ficha.dados, raca: e.target.value}})} className="w-full bg-transparent border-b border-[#2a3b52] text-[#f0ebd8] focus:outline-none pb-1" /></div>
              <div><label className="block text-[10px] uppercase tracking-widest text-[#4ad9d9]">Gostos / Vínculos</label><textarea value={ficha.dados.gostos} onChange={(e) => setFicha({...ficha, dados: {...ficha.dados, gostos: e.target.value}})} rows={3} className="w-full bg-transparent border-b border-[#2a3b52] text-[#f0ebd8] focus:outline-none resize-none pb-1" /></div>
            </div>
          </div>

          <div className="md:col-span-8 space-y-6">
            <section className={`grid grid-cols-1 gap-4 ${isDnD ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
              {[
                { id: 'vida', nome: 'Vida', icon: Shield, cor: 'red', mostrar: true },
                { id: 'sanidade', nome: 'Sanidade', icon: Brain, cor: 'purple', mostrar: !isDnD },
                { id: 'estamina', nome: 'Estamina / Ki', icon: Zap, cor: 'green', mostrar: true }
              ].filter(s => s.mostrar).map((stat) => {
                const s = ficha.dados.status[stat.id];
                const pct = Math.max(0, Math.min(100, (s.atual / s.max) * 100)) || 0;
                return (
                  <div key={stat.id} className={`bg-[#131b26]/60 border border-${stat.cor}-900/30 rounded-2xl p-4`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-xs uppercase text-${stat.cor}-400 font-bold tracking-widest`}><stat.icon size={14} className="inline mr-1"/> {stat.nome}</span>
                    </div>
                    <div className="w-full bg-[#0a0f18] h-1.5 rounded-full mb-4 overflow-hidden border border-[#1a2b4c]">
                       <div className={`bg-${stat.cor}-500 h-full`} style={{ width: `${pct}%` }}></div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <button onClick={() => atualizarStatusAtual(stat.id, '-1', true)} className={`border border-${stat.cor}-900/50 text-${stat.cor}-400 w-8 h-8 rounded-lg flex items-center justify-center`}><Minus size={14}/></button>
                      <div className="flex items-center gap-1">
                        <input type="number" value={s.atual} onChange={(e) => atualizarStatusAtual(stat.id, e.target.value)} className={`w-12 bg-transparent text-center text-xl font-black text-[#f0ebd8] focus:outline-none`} />
                        <span className="text-[#2a3b52]">/</span>
                        <span className="w-8 text-center text-sm font-bold text-[#6b7b94]/50">{s.max}</span>
                      </div>
                      <button onClick={() => atualizarStatusAtual(stat.id, '1', true)} className={`border border-${stat.cor}-900/50 text-${stat.cor}-400 w-8 h-8 rounded-lg flex items-center justify-center`}><Plus size={14}/></button>
                    </div>
                  </div>
                );
              })}
            </section>

            <section className="bg-[#131b26]/60 border border-[#2a3b52] rounded-2xl p-6">
               <h2 className={`${cinzel.className} text-[#f0ebd8] text-lg font-bold uppercase border-b border-[#2a3b52] mb-6 pb-2`}>Atributos Principais</h2>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(ficha.dados.atributos).map(([key, value]: any) => {
                    const mod = Math.floor((value - 10) / 2);
                    return (
                      <div key={key} className="flex items-center gap-4 bg-[#0a0f18]/50 p-2 rounded-xl border border-[#1a2b4c]/50">
                        <input type="number" value={value} onChange={(e) => atualizarAtributo(key, parseInt(e.target.value) || 0)} className="w-12 h-10 bg-[#0d131f] rounded-lg text-center text-[#4ad9d9] font-black focus:outline-none" />
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-[#6b7b94]">{key}</div>
                          <div className="text-[#f0ebd8] font-bold text-sm">Mod: <span className={mod >= 0 ? 'text-green-400' : 'text-red-400'}>{mod >= 0 ? `+${mod}` : mod}</span></div>
                        </div>
                      </div>
                    );
                  })}
               </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
