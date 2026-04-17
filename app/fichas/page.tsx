"use client";
import React, { useState } from 'react';
import { Cinzel, Inter } from 'next/font/google';
import { Shield, Brain, Zap, User } from 'lucide-react';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700', '900'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '600'] });

export default function FichasPage() {
  // Estado simulando os dados que viriam do Supabase (JSONB)
  const [ficha, setFicha] = useState({
    nome: "Arthur Pendelton",
    idade: "32",
    raca: "Humano",
    gostos: "Uísque barato, silêncio.",
    status: { vida: 12, sanidade: 10, estamina: 14 },
    atributos: { forca: 15, destreza: 12, sabedoria: 10, intelecto: 13, carisma: 8, vigor: 14 }
  });

  return (
    <main className="min-h-screen bg-[#090e17] text-[#8b9bb4] p-6 md:p-12 relative overflow-y-auto">
      
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#1a2b4c]/30 to-transparent pointer-events-none z-0"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Cabeçalho da Ficha */}
        <header className="border-b border-[#2a3b52] pb-6 mb-8 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 text-[#4ad9d9] mb-2 text-sm uppercase tracking-widest font-semibold">
              <User size={16} /> Preset: Memórias Póstumas
            </div>
            <h1 className={`${cinzel.className} text-[#f0ebd8] text-4xl md:text-5xl font-bold`}>
              {ficha.nome}
            </h1>
          </div>
          <button className="bg-[#1a2b4c]/50 border border-[#4ad9d9]/30 text-[#4ad9d9] px-6 py-2 rounded-full hover:bg-[#4ad9d9]/20 transition-colors text-sm font-semibold tracking-wider">
            SALVAR FICHA
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Coluna Esquerda: Informações Pessoais */}
          <div className="col-span-1 space-y-6">
            <section className="bg-[#131b26]/80 border border-[#2a3b52] rounded-2xl p-6 shadow-lg">
              <h2 className={`${cinzel.className} text-[#f0ebd8] text-xl font-bold mb-4 border-b border-[#2a3b52] pb-2`}>.¸¸.•´¯` INFO</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#4ad9d9] mb-1">Idade / Altura</label>
                  <input type="text" value={`${ficha.idade} anos`} readOnly className="w-full bg-transparent border-b border-[#2a3b52] text-[#f0ebd8] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#4ad9d9] mb-1">Raça</label>
                  <input type="text" value={ficha.raca} readOnly className="w-full bg-transparent border-b border-[#2a3b52] text-[#f0ebd8] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#4ad9d9] mb-1">Gostos</label>
                  <textarea value={ficha.gostos} readOnly rows={2} className="w-full bg-transparent border-b border-[#2a3b52] text-[#f0ebd8] focus:outline-none resize-none" />
                </div>
              </div>
            </section>
          </div>

          {/* Coluna Direita: Status e Atributos */}
          <div className="col-span-1 md:col-span-2 space-y-6">
            
            {/* Status Principais */}
            <section className="grid grid-cols-3 gap-4">
              <div className="bg-[#131b26]/80 border border-[#2a3b52] rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Shield className="text-red-400 mb-2" size={24} />
                <span className="text-3xl font-black text-[#f0ebd8]">{ficha.status.vida}</span>
                <span className="text-xs uppercase tracking-widest text-red-400 mt-1">Vida</span>
              </div>
              
              <div className="bg-[#131b26]/80 border border-[#2a3b52] rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Brain className="text-purple-400 mb-2" size={24} />
                <span className="text-3xl font-black text-[#f0ebd8]">{ficha.status.sanidade}</span>
                <span className="text-xs uppercase tracking-widest text-purple-400 mt-1">Sanidade</span>
              </div>

              <div className="bg-[#131b26]/80 border border-[#2a3b52] rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Zap className="text-green-400 mb-2" size={24} />
                <span className="text-3xl font-black text-[#f0ebd8]">{ficha.status.estamina}</span>
                <span className="text-xs uppercase tracking-widest text-green-400 mt-1">Estamina</span>
              </div>
            </section>

            {/* Atributos */}
            <section className="bg-[#131b26]/80 border border-[#2a3b52] rounded-2xl p-6 shadow-lg">
               <h2 className={`${cinzel.className} text-[#f0ebd8] text-xl font-bold mb-6 border-b border-[#2a3b52] pb-2`}>.¸¸.•´¯` ATRIBUTOS</h2>
               
               <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {Object.entries(ficha.atributos).map(([key, value]) => {
                    const mod = Math.floor((value - 10) / 2);
                    return (
                      <div key={key} className="flex items-center gap-4 bg-[#0a0f18] p-3 rounded-xl border border-[#1a2b4c]">
                        <div className="w-12 h-12 bg-[#1a2b4c] rounded-lg flex items-center justify-center text-[#4ad9d9] font-black text-xl border border-[#2a3b52]">
                          {value}
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-widest text-[#6b7b94]">{key}</div>
                          <div className="text-[#f0ebd8] font-bold text-sm">
                            Mod: {mod >= 0 ? `+${mod}` : mod}
                          </div>
                        </div>
                      </div>
                    );
                  })}
               </div>
               <div className="mt-6 text-xs text-[#6b7b94] italic text-center">
                  Pool de Distribuição: 15, 14, 13, 12, 10, 8
               </div>
            </section>

          </div>
        </div>
      </div>
    </main>
  );
}
