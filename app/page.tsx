"use client";
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Shield, Scroll, Settings } from 'lucide-react';

const VTTCanvas = dynamic(() => import('../src/components/vtt/VTTCanvas'), { 
  ssr: false 
});
import VTTControls from '../src/components/vtt/VTTControls';

export default function Home() {
  const [inGame, setInGame] = useState(false);
  const [salaId, setSalaId] = useState("ID-DA-SUA-SALA-AQUI");

  if (inGame) {
    return (
      <main className="h-screen w-full bg-[#1a1c1d]">
        <VTTCanvas salaId={salaId} />
        <VTTControls salaId={salaId} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#141516] flex flex-col items-center justify-center p-6 text-center bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] bg-blend-overlay">
      
      {/* Container Principal Estilo Menu de RPG */}
      <div className="border-4 border-[#8b7355] bg-[#2a2d30] p-8 md:p-12 shadow-[8px_8px_0_#000] max-w-2xl w-full relative">
        
        {/* Cantos Decorativos (PixelArt style) */}
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-[#d4af37] border-2 border-black"></div>
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#d4af37] border-2 border-black"></div>
        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#d4af37] border-2 border-black"></div>
        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#d4af37] border-2 border-black"></div>

        <h1 className="font-['var(--font-press-start)'] text-3xl md:text-5xl mb-6 text-[#d4af37] drop-shadow-[4px_4px_0_#000] tracking-widest leading-relaxed">
          AETHER<br className="md:hidden"/><span className="text-[#3b82f6]">QUEST</span>
        </h1>
        
        <p className="font-['var(--font-vt323)'] text-[#a99c8f] text-2xl mb-10 tracking-wider">
          O Reinos o aguardam, Mestre.
        </p>

        <div className="flex flex-col gap-6 w-full max-w-xs mx-auto">
          {/* Botão Principal Estilo Zelda (Verde Esmeralda) */}
          <button 
            onClick={() => setInGame(true)}
            className="font-['var(--font-press-start)'] text-sm md:text-xs flex items-center justify-center gap-3 bg-[#10b981] border-4 border-[#059669] text-white py-5 px-6 hover:bg-[#34d399] hover:-translate-y-1 active:translate-y-1 transition-all shadow-[4px_4px_0_#000]"
          >
            ENTRAR NA MESA
          </button>
          
          <button className="font-['var(--font-press-start)'] text-sm md:text-xs flex items-center justify-center gap-3 bg-[#4b5563] border-4 border-[#374151] text-white py-5 px-6 hover:bg-[#6b7280] active:translate-y-1 transition-all shadow-[4px_4px_0_#000]">
            <Scroll size={16} className="hidden md:block"/>
            CAMPANHAS
          </button>
        </div>

        <div className="mt-12 flex justify-center gap-8 text-[#8b7355] font-['var(--font-vt323)'] text-xl">
          <div className="flex flex-col items-center gap-2 hover:text-[#d4af37] cursor-pointer">
            <Shield size={24} />
            <span>Regras</span>
          </div>
          <div className="flex flex-col items-center gap-2 hover:text-[#d4af37] cursor-pointer">
            <Settings size={24} />
            <span>Opções</span>
          </div>
        </div>
      </div>
    </main>
  );
}
