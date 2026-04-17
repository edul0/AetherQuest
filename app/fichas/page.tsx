"use client";
import React, { useState } from 'react';
import { Cinzel, Inter } from 'next/font/google';
import { Shield, Brain, Zap, User, Camera, Plus, Dices, Swords } from 'lucide-react';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700', '900'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '600'] });

export default function FichasPage() {
  const [ficha, setFicha] = useState({
    nome: "Arthur Pendelton",
    idade: "32",
    raca: "Humano",
    gostos: "Uísque barato, silêncio.",
    status: { vida: 12, sanidade: 10, estamina: 14 },
    atributos: { forca: 15, destreza: 12, sabedoria: 10, intelecto: 13, carisma: 8, vigor: 14 }
  });

  const [habilidades, setHabilidades] = useState([
    { id: 1, nome: "Investigação Oculta", dado: "1d20 + Sabedoria" },
    { id: 2, nome: "Tiro Rápido", dado: "1d10 + Destreza" }
  ]);

  const adicionarHabilidade = () => {
    const nome = prompt("Nome da Nova Habilidade:");
    if (!nome) return;
    const dado = prompt("Qual dado rolar? (Ex: 1d20 + 2, ou 2d6 + Força):");
    if (!dado) return;
    
    setHabilidades([...habilidades, { id: Date.now(), nome, dado }]);
  };

  return (
    <main className="min-h-screen bg-[#090e17] text-[#8b9bb4] p-4 md:p-8 relative overflow-y-auto">
      
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#1a2b4c]/20 to-transparent pointer-events-none z-0"></div>

      <div className="max-w-5xl mx-auto relative z-10">
        
        <header className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center gap-2 text-[#4ad9d9] mb-1 text-xs uppercase tracking-widest font-semibold">
              <User size={14} /> Preset: Memórias Póstumas
            </div>
            <h1 className={`${cinzel.className} text-[#f0ebd8] text-4xl md:text-5xl font-black tracking-wider`}>
              {ficha.nome}
            </h1>
          </div>
          <button className="bg-gradient-to-r from-[#218b8b] to-[#1a6666] text-white px-6 py-2 rounded-full hover:from-[#2aabab] hover:to-[#218b8b] transition-all shadow-[0_0_15px_rgba(33,139,139,0.3)] text-sm font-semibold tracking-widest uppercase">
            Salvar
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          <div className="md:col-span-4 space-y-6">
            
            <div className="bg-[#131b26]/60 backdrop-blur-md border border-[#2a3b52] rounded-2xl p-2 shadow-lg group cursor-pointer hover:border-[#4ad9d9]/50 transition-colors">
              <div className="w-full aspect-[3/4] bg-[#0a0f18] rounded-xl border border-[#1a2b4c] flex flex-col items-center justify-center text-[#2a3b52] group-hover:text-[#4ad9d9] transition-colors relative overflow-hidden">
                <Camera size={48} strokeWidth={1} className="mb-2" />
                <span className={`${inter.className} text-xs uppercase tracking-widest`}>Adicionar Retrato</span>
                <div className="absolute inset-0 bg-gradient-to-t from-[#090e17] to-transparent opacity-50"></div>
              </div>
            </div>

            <div className="bg-[#131b26]/60 backdrop-blur-md border border-[#2a3b52] rounded-2xl p-6 shadow-lg">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#4ad9d9] mb-1 opacity-80">Idade / Altura</label>
                  <input type="text" value={`${ficha.idade} anos`} readOnly className={`${inter.className} w-full bg-transparent border-b border-[#2a3b52] text-[#f0ebd8] focus:outline-none pb-1`} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#4ad9d9] mb-1 opacity-80">Raça</label>
                  <input type="text" value={ficha.raca} readOnly className={`${inter.className} w-full bg-transparent border-b border-[#2a3b52] text-[#f0ebd8] focus:outline-none pb-1`} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#4ad9d9] mb-1 opacity-80">Gostos Pessoais</label>
                  <textarea value={ficha.gostos} readOnly rows={3} className={`${inter.className} w-full bg-transparent border-b border-[#2a3b52] text-[#f0ebd8] focus:outline-none resize-none pb-1`} />
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-8 space-y-6">
            
            <section className="grid grid-cols-3 gap-4">
              {[
                { label: 'Vida', value: ficha.status.vida, icon: Shield, color: 'text-red-400', bg: 'bg-red-500/5', border: 'border-red-900/30' },
                { label: 'Sanidade', value: ficha.status.sanidade, icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/5', border: 'border-purple-900/30' },
                { label: 'Estamina', value: ficha.status.estamina, icon: Zap, color: 'text-green-400', bg: 'bg-green-500/5', border: 'border-green-900/30' }
              ].map((stat) => (
                <div key={stat.label} className={`bg-[#131b26]/60 backdrop-blur-md border ${stat.border} rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden`}>
                  <div className={`absolute inset-0 ${stat.bg}`}></div>
                  <stat.icon className={`${stat.color} mb-1 opacity-80`} size={20} />
                  <span className={`${inter.className} text-3xl font-black text-[#f0ebd8]`}>{stat.value}</span>
                  <span className="text-[10px] uppercase tracking-widest text-[#6b7b94] mt-1">{stat.label}</span>
                </div>
              ))}
            </section>

            <section className="bg-[#131b26]/60 backdrop-blur-md border border-[#2a3b52] rounded-2xl p-6 shadow-lg">
               <div className="flex items-center gap-3 mb-6 border-b border-[#2a3b52] pb-2">
                 <Swords className="text-[#4ad9d9]" size={20} />
                 <h2 className={`${cinzel.className} text-[#f0ebd8] text-lg font-bold tracking-widest uppercase`}>Atributos Principais</h2>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(ficha.atributos).map(([key, value]) => {
                    const mod = Math.floor((value - 10) / 2);
                    return (
                      <div key={key} className="flex items-center gap-4 bg-[#0a0f18]/50 p-2 rounded-xl border border-[#1a2b4c]/50 hover:border-[#4ad9d9]/30 transition-colors">
                        <div className="w-10 h-10 bg-[#0d131f] rounded-lg flex items-center justify-center text-[#4ad9d9] font-black text-lg border border-[#2a3b52]">
                          {value}
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-[#6b7b94]">{key}</div>
                          <div className={`${inter.className} text-[#f0ebd8] font-bold text-sm`}>
                            Mod: <span className={mod >= 0 ? 'text-green-400' : 'text-red-400'}>{mod >= 0 ? `+${mod}` : mod}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
               </div>
            </section>

            <section className="bg-[#131b26]/60 backdrop-blur-md border border-[#2a3b52] rounded-2xl p-6 shadow-lg">
               <div className="flex justify-between items-center mb-6 border-b border-[#2a3b52] pb-2">
                 <div className="flex items-center gap-3">
                    <Dices className="text-[#4ad9d9]" size={20} />
                    <h2 className={`${cinzel.className} text-[#f0ebd8] text-lg font-bold tracking-widest uppercase`}>Habilidades e Perícias</h2>
                 </div>
                 <button 
                    onClick={adicionarHabilidade}
                    className="flex items-center gap-1 text-[#4ad9d9] text-xs uppercase tracking-widest font-semibold hover:text-white transition-colors bg-[#1a2b4c]/50 px-3 py-1.5 rounded-full border border-[#4ad9d9]/30 hover:bg-[#4ad9d9]/20"
                  >
                   <Plus size={14} /> Adicionar
                 </button>
               </div>
               
               <div className="space-y-3">
                 {habilidades.length === 0 ? (
                   <p className="text-sm text-[#6b7b94] italic text-center py-4">Nenhuma habilidade cadastrada.</p>
                 ) : (
                   habilidades.map((hab) => (
                     <div key={hab.id} className="flex justify-between items-center bg-[#0a0f18]/50 p-3 rounded-xl border border-[#1a2b4c] group hover:border-[#4ad9d9]/50 transition-colors">
                       <span className={`${inter.className} text-[#f0ebd8] font-semibold text-sm`}>{hab.nome}</span>
                       <div className="flex items-center gap-2">
                         <span className="text-[10px] text-[#6b7b94] uppercase tracking-widest">Rola:</span>
                         <span className="bg-[#1a2b4c] text-[#4ad9d9] px-3 py-1 rounded-md text-xs font-mono border border-[#2a3b52]">
                           {hab.dado}
                         </span>
                       </div>
                     </div>
                   ))
                 )}
               </div>
            </section>

          </div>
        </div>
      </div>
    </main>
  );
}
