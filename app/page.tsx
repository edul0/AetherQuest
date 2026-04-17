"use client";
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Sword, Scroll, Compass, BookOpen } from 'lucide-react';

const VTTCanvas = dynamic(() => import('../src/components/vtt/VTTCanvas'), { 
  ssr: false 
});
import VTTControls from '../src/components/vtt/VTTControls';

export default function Home() {
  const [inGame, setInGame] = useState(false);
  const [salaId, setSalaId] = useState("ID-DA-SUA-SALA-AQUI");

  if (inGame) {
    return (
      <main className="h-screen w-full bg-[#0a0f12]">
        <VTTCanvas salaId={salaId} />
        <VTTControls salaId={salaId} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d1317] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      
      {/* Background Sutil - Efeito de Fumaça/Masmorra */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#1c2e26] rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#2d1b19] rounded-full blur-[150px]" />
      </div>

      {/* Painel Principal - Vidro Fosco/Fantasia Moderna */}
      <div className="z-10 bg-[#161d22]/80 backdrop-blur-md p-10 md:p-16 rounded-3xl border border-[#2a363d] shadow-2xl max-w-2xl w-full relative">
        
        {/* Detalhe de Linha Dourada Acima do Título */}
        <div className="w-16 h-[2px] bg-[#cda462] mx-auto mb-8 opacity-70 rounded-full"></div>

        <h1 className="font-['var(--font-cinzel)'] text-5xl md:text-7xl font-bold mb-4 tracking-wider text-[#f4ecd8] drop-shadow-md">
          AETHER<span className="text-[#3b82f6]">QUEST</span>
        </h1>
        
        <p className="font-['var(--font-lora)'] italic text-[#a3b1b9] text-xl md:text-2xl mb-12 tracking-wide font-light">
          "As lendas não se contam sozinhas, Mestre."
        </p>

        <div className="flex flex-col sm:flex-row gap-5 w-full justify-center mt-8">
          
          {/* Botão Principal - Verde BotW / Polido */}
          <button 
            onClick={() => setInGame(true)}
            className="group relative flex items-center justify-center gap-3 bg-gradient-to-b from-[#1b5e40] to-[#12422c] border border-[#2d855f] text-[#f4ecd8] font-['var(--font-cinzel)'] font-bold tracking-widest py-4 px-8 rounded-full hover:from-[#237450] hover:to-[#175438] transition-all shadow-lg hover:shadow-[#1b5e40]/40 duration-300 w-full sm:w-auto"
          >
            <Sword size={20} className="opacity-80 group-hover:opacity-100 transition-opacity" />
            INICIAR JORNADA
          </button>
          
          {/* Botão Secundário - Pedra Escura / Couro */}
          <button className="group flex items-center justify-center gap-3 bg-gradient-to-b from-[#252f36] to-[#1a2227] border border-[#374650] text-[#c3ced5] font-['var(--font-cinzel)'] font-bold tracking-widest py-4 px-8 rounded-full hover:from-[#2c3840] hover:to-[#1f282e] transition-all shadow-lg duration-300 w-full sm:w-auto">
            <Scroll size={20} className="opacity-70 group-hover:opacity-100 transition-opacity"/>
            PERGAMINHOS
          </button>
        </div>

        {/* Menu Inferior - Ícones Orgânicos */}
        <div className="mt-16 flex justify-center gap-10 text-[#718590] font-['var(--font-cinzel)'] text-sm tracking-widest uppercase">
          <div className="flex flex-col items-center gap-3 hover:text-[#cda462] transition-colors cursor-pointer group">
            <BookOpen size={22} strokeWidth={1.5} className="group-hover:scale-110 transition-transform"/>
            <span>Compêndio</span>
          </div>
          <div className="flex flex-col items-center gap-3 hover:text-[#cda462] transition-colors cursor-pointer group">
            <Compass size={22} strokeWidth={1.5} className="group-hover:scale-110 transition-transform"/>
            <span>Bússola</span>
          </div>
        </div>
        
        {/* Detalhe de Linha Dourada Abaixo */}
        <div className="w-16 h-[2px] bg-[#cda462] mx-auto mt-12 opacity-30 rounded-full"></div>
      </div>
      
    </main>
  );
}
