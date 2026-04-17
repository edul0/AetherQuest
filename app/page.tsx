"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../src/lib/supabase';
import { Cinzel, Inter } from 'next/font/google';
import { Camera, Plus, Save, ArrowLeft, Trash2, Minus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Shield, Swords, Zap } from 'lucide-react';
import { PRESETS } from '../src/lib/constants';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700', '900'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '600'] });

export default function FichaPersonagemPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ficha, setFicha] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('combate');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => { carregarFicha(); }, [id]);

  const carregarFicha = async () => {
    const { data } = await supabase.from('fichas').select('*').eq('id', id).single();
    if (data) {
      if (!data.dados.habilidades) data.dados.habilidades = [];
      if (!data.dados.armas) data.dados.armas = [];
      if (!data.dados.pericias) data.dados.pericias = {};
      setFicha(data);
    }
    setLoading(false);
  };

  const recalcularMaximos = (dadosAtuais: any, sistema: string) => {
    const atr = dadosAtuais.attributes || { forca: 1, agilidade: 1, vigor: 1, intelecto: 1, presenca: 1 };
    const nex = dadosAtuais.nex || 5;
    const lv = Math.max(1, Math.floor(nex / 5));
    
    if (sistema === 'ordem_paranormal') {
      const baseVida = 12 + (atr.vigor || 1);
      const porNivelVida = 2 + (atr.vigor || 1);
      const baseSan = 12 + (atr.presenca || 1);
      const porNivelSan = 3;
      const basePE = 2 + (atr.intelecto || 1);
      const porNivelPE = 2 + (atr.intelecto || 1);

      return {
        vida: { ...dadosAtuais.status?.vida, max: baseVida + (lv - 1) * porNivelVida },
        sanidade: { ...dadosAtuais.status?.sanidade, max: baseSan + (lv - 1) * porNivelSan },
        estamina: { ...dadosAtuais.status?.estamina, max: basePE + (lv - 1) * porNivelPE }
      };
    }
    return dadosAtuais.status;
  };

  const atualizarFicha = (caminho: string, valor: any) => {
    const novosDados = { ...ficha.dados };
    const keys = caminho.split('.');
    let temp = novosDados;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!temp[keys[i]]) temp[keys[i]] = {};
      temp = temp[keys[i]];
    }
    temp[keys[keys.length - 1]] = valor;

    if (caminho.includes('attributes') || caminho.includes('nex')) {
      novosDados.status = recalcularMaximos(novosDados, ficha.sistema_preset);
    }
    
    setFicha({ ...ficha, dados: novosDados });
  };

  const salvarNoBanco = async () => {
    setIsSaving(true);
    await supabase.from('fichas').update({ 
      nome_personagem: ficha.nome_personagem, 
      dados: ficha.dados 
    }).eq('id', id);
    setIsSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-cyan-400 font-mono animate-pulse">SINCRONIZANDO COM O OUTRO LADO...</div>;

  const sys = PRESETS.ordem_paranormal as any;
  const d = ficha.dados;
  const atr = d.attributes || { forca: 1, agilidade: 1, vigor: 1, intelecto: 1, presenca: 1 };

  // Componente de Atributo Circular
  const AtributoNode = ({ label, value, keyName, pos }: any) => (
    <div className={`absolute ${pos} flex flex-col items-center group`}>
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 border-2 border-white/20 rounded-full group-hover:border-cyan-500/50 transition-all"></div>
        <input 
          type="number" 
          value={value} 
          onChange={(e) => atualizarFicha(`attributes.${keyName}`, parseInt(e.target.value) || 0)}
          className="bg-transparent text-white text-2xl font-black text-center w-full outline-none z-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
      <span className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">{label}</span>
      <span className="text-[8px] text-gray-600 font-black uppercase">{keyName.substring(0,3)}</span>
    </div>
  );

  // Componente de Barra de Status (Estilo Crisordem)
  const StatusBar = ({ label, current, max, color, keyName }: any) => {
    const percent = Math.min(100, Math.max(0, (current / max) * 100));
    return (
      <div className="w-full space-y-1">
        <div className="flex justify-between items-end px-1">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{label}</span>
        </div>
        <div className="flex items-center gap-2 bg-black border border-white/10 p-1 rounded-sm">
          <div className="flex gap-1">
            <button onClick={() => atualizarFicha(`status.${keyName}.atual`, Math.max(0, current - 5))} className="text-gray-500 hover:text-white"><ChevronsLeft size={14}/></button>
            <button onClick={() => atualizarFicha(`status.${keyName}.atual`, Math.max(0, current - 1))} className="text-gray-500 hover:text-white"><ChevronLeft size={14}/></button>
          </div>
          <div className="flex-1 h-6 bg-gray-900 relative overflow-hidden rounded-sm border border-white/5">
            <div className={`absolute inset-0 ${color} transition-all duration-300`} style={{ width: `${percent}%` }}></div>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white drop-shadow-md">
              {current} / {max}
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => atualizarFicha(`status.${keyName}.atual`, Math.min(max, current + 1))} className="text-gray-500 hover:text-white"><ChevronRight size={14}/></button>
            <button onClick={() => atualizarFicha(`status.${keyName}.atual`, Math.min(max, current + 5))} className="text-gray-500 hover:text-white"><ChevronsRight size={14}/></button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#050505] text-gray-300 p-4 md:p-6 font-sans selection:bg-cyan-500/30">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUNA ESQUERDA: ATRIBUTOS E STATUS */}
        <div className="lg:col-span-4 space-y-8">
          <header className="space-y-4">
            <div className="flex justify-between items-start">
               <button onClick={() => router.push('/fichas')} className="text-[10px] uppercase tracking-[0.3em] text-gray-500 hover:text-cyan-400 flex items-center gap-2 transition-all">
                <ArrowLeft size={12}/> HUB
              </button>
              <button onClick={salvarNoBanco} disabled={isSaving} className="bg-white text-black px-4 py-1 rounded-sm font-black text-[10px] uppercase tracking-widest hover:bg-cyan-400 transition-all">
                {isSaving ? '...' : 'SALVAR'}
              </button>
            </div>
            <input 
              type="text" 
              value={ficha.nome_personagem} 
              onChange={(e) => setFicha({...ficha, nome_personagem: e.target.value})}
              className={`${cinzel.className} bg-transparent text-white text-3xl font-black outline-none w-full border-b border-white/10 pb-2 focus:border-cyan-500/50 transition-all`}
            />
          </header>

          {/* PENTAGRAMA DE ATRIBUTOS */}
          <div className="relative w-full aspect-square max-w-[320px] mx-auto flex items-center justify-center">
            {/* Imagem de Fundo do Pentagrama (Placeholder Visual com CSS) */}
            <div className="absolute inset-0 border border-white/5 rounded-full opacity-20"></div>
            <div className="absolute inset-8 border border-white/10 rounded-full opacity-10"></div>
            <div className={`${cinzel.className} text-[10px] text-white/20 font-bold tracking-[0.5em] uppercase`}>ATRIBUTOS</div>
            
            <AtributoNode label="Agilidade" value={atr.agilidade} keyName="agilidade" pos="top-0" />
            <AtributoNode label="Força" value={atr.forca} keyName="forca" pos="top-1/4 -left-4" />
            <AtributoNode label="Intelecto" value={atr.intelecto} keyName="intelecto" pos="top-1/4 -right-4" />
            <AtributoNode label="Presença" value={atr.presenca} keyName="presenca" pos="bottom-4 left-4" />
            <AtributoNode label="Vigor" value={atr.vigor} keyName="vigor" pos="bottom-4 right-4" />
          </div>

          {/* NEX E BARRAS */}
          <div className="space-y-6 bg-white/5 p-6 rounded-lg border border-white/10">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">NEX</span>
                <input 
                  type="number" 
                  value={d.nex || 5} 
                  onChange={(e) => atualizarFicha('nex', parseInt(e.target.value) || 0)}
                  className="bg-transparent text-white text-2xl font-black outline-none w-16"
                />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Deslocamento</span>
                <div className="text-white font-black text-xl">9 m / 6 q</div>
              </div>
            </div>

            <StatusBar label="Vida" current={d.status?.vida?.atual || 0} max={d.status?.vida?.max || 1} color="bg-red-700" keyName="vida" />
            <StatusBar label="Sanidade" current={d.status?.sanidade?.atual || 0} max={d.status?.sanidade?.max || 1} color="bg-purple-700" keyName="sanidade" />
            <StatusBar label="Esforço" current={d.status?.estamina?.atual || 0} max={d.status?.estamina?.max || 1} color="bg-orange-600" keyName="estamina" />
          </div>
        </div>

        {/* COLUNA DIREITA: PERÍCIAS E ABAS */}
        <div className="lg:col-span-8 space-y-6">
          <nav className="flex gap-4 border-b border-white/10 pb-2">
            {['combate', 'habilidades', 'rituais', 'inventario'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[10px] font-black uppercase tracking-widest pb-2 transition-all ${activeTab === tab ? 'text-white border-b-2 border-cyan-500' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {tab}
              </button>
            ))}
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* LISTA DE PERÍCIAS */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 text-[8px] font-black text-gray-500 uppercase tracking-widest pb-2 border-b border-white/5 px-2">
                <div className="col-span-6">Perícia</div>
                <div className="col-span-2 text-center">Dados</div>
                <div className="col-span-2 text-center">Bônus</div>
                <div className="col-span-2 text-center">Treino</div>
              </div>
              <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar space-y-1">
                {sys.pericias.map((p: any) => {
                  const valAtr = atr[p.atributo] || 0;
                  const treino = d.pericias?.[p.nome] || 0;
                  return (
                    <div key={p.nome} className="grid grid-cols-12 items-center py-1 px-2 hover:bg-white/5 rounded-sm transition-all group">
                      <div className="col-span-6 flex items-center gap-2">
                        <Swords size={10} className="text-gray-600 group-hover:text-cyan-400 transition-colors" />
                        <span className="text-[11px] font-bold text-gray-300">{p.nome}</span>
                      </div>
                      <div className="col-span-2 text-center text-[10px] font-black text-gray-500">({valAtr})</div>
                      <div className="col-span-2 text-center text-[10px] font-black text-cyan-400">+{treino}</div>
                      <div className="col-span-2 flex justify-center">
                        <input 
                          type="number" 
                          value={treino} 
                          onChange={(e) => atualizarFicha(`pericias.${p.nome}`, parseInt(e.target.value) || 0)}
                          className="w-8 bg-transparent text-center text-[10px] font-black text-white border-b border-white/10 outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CONTEÚDO DA ABA ATIVA */}
            <div className="bg-white/5 rounded-lg border border-white/10 p-6 min-h-[400px]">
              {activeTab === 'combate' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <h3 className={`${cinzel.className} text-white font-bold text-lg`}>ATAQUES</h3>
                    <button className="p-1 hover:text-cyan-400"><Plus size={16}/></button>
                  </div>
                  {d.armas.length === 0 ? (
                    <div className="text-center py-20 text-gray-600 text-[10px] uppercase font-black tracking-widest">Você ainda não possui ataques</div>
                  ) : (
                    <div className="space-y-4">
                      {d.armas.map((arma: any) => (
                        <div key={arma.id} className="p-3 bg-black/40 border border-white/5 rounded-sm hover:border-cyan-500/30 transition-all">
                          <div className="flex justify-between font-black text-xs text-white">
                            <span>{arma.nome}</span>
                            <span className="text-cyan-400">{arma.dano}</span>
                          </div>
                          <div className="text-[9px] text-gray-500 mt-1 uppercase tracking-tighter">Crit: {arma.critico} | Alcance: {arma.alcance}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* Outras abas seguiriam o mesmo padrão visual... */}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #333; }
      `}</style>
    </main>
  );
}
