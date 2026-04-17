"use client";
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Sword, Scroll, Compass, BookOpen } from 'lucide-react';
import { Cinzel, Lora } from 'next/font/google';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700'] });
const lora = Lora({ subsets: ['latin'], style: ['italic'] });

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
    <main className="min-h-screen bg-[#0d1317] flex flex-col items-center justify-center p-4 sm:p-6 text-center relative overflow-hidden">
      
      {/* Background Sutil - Efeito Atmosférico */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#1c2e26] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#2d1b19] rounded-full blur-[120px]" />
      </div>

      {/* Painel Principal - Vidro Fosco/Fantasia Moderna */}
      <div className="z-10 bg-[#161d22]/70 backdrop-blur-xl px-6 py-12 md:p-16 rounded-2xl border border-[#2a363d] shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-2xl w-full relative">
        
        {/* Detalhe de Linha Dourada Acima do Título */}
        <div className="w-12 h-[1px] bg-[#cda462] mx-auto mb-6 opacity-60 rounded-full"></div>

        <h1 className={`${cinzel.className} text-4xl md:text-6xl font-bold mb-4 tracking-widest text-[#f4ecd8] drop-shadow-md`}>
          AETHER<span className="text-[#3b82f6]">QUEST</span>
        </h1>
        
        <p className={`${lora.className} text-[#8b9ba5] text-lg md:text-xl mb-12 tracking-wide font-light`}>
          "As lendas não se contam sozinhas, Mestre."
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-6">
          
          {/* Botão Principal - Verde Profundo */}
          <button 
            onClick={() => setInGame(true)}
            className={`${cinzel.className} group relative flex items-center justify-center gap-3 bg-gradient-to-b from-[#185238] to-[#0f3624] border border-[#2d855f] text-[#f4ecd8] font-bold tracking-widest py-3 px-8 rounded-lg hover:from-[#1e6646] hover:to-[#13452e] transition-all shadow-lg hover:shadow-[#185238]/40 duration-300 w-full sm:w-auto text-sm`}
          >
            <Sword size={18} className="opacity-80 group-hover:opacity-100 transition-opacity" />
            INICIAR JORNADA
          </button>
          
          {/* Botão Secundário - Escuro/Couro */}
          <button className={`${cinzel.className} group flex items-center justify-center gap-3 bg-gradient-to-b from-[#212a30] to-[#151c20] border border-[#374650] text-[#c3ced5] font-bold tracking-widest py-3 px-8 rounded-lg hover:from-[#29343c] hover:to-[#1a2328] transition-all shadow-lg duration-300 w-full sm:w-auto text-sm`}>
            <Scroll size={18} className="opacity-70 group-hover:opacity-100 transition-opacity"/>
            PERGAMINHOS
          </button>
        </div>

        {/* Menu Inferior - Ícones Orgânicos */}
        <div className={`${cinzel.className} mt-14 flex justify-center gap-12 text-[#5c6e7a] text-xs tracking-widest uppercase`}>
          <div className="flex flex-col items-center gap-2 hover:text-[#cda462] transition-colors cursor-pointer group">
            <BookOpen size={20} strokeWidth={1.5} className="group-hover:scale-110 transition-transform"/>
            <span>Compêndio</span>
          </div>
          <div className="flex flex-col items-center gap-2 hover:text-[#cda462] transition-colors cursor-pointer group">
            <Compass size={20} strokeWidth={1.5} className="group-hover:scale-110 transition-transform"/>
            <span>Bússola</span>
          </div>
        </div>
        
        {/* Detalhe de Linha Dourada Abaixo */}
        <div className="w-12 h-[1px] bg-[#cda462] mx-auto mt-10 opacity-30 rounded-full"></div>
      </div>
      
    </main>
  );
}
