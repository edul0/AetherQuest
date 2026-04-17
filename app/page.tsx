"use client";
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Play, Map as MapIcon, BookOpen, Settings2 } from 'lucide-react';
import { Cinzel, Inter } from 'next/font/google';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700', '900'] });
const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '600'] });

const VTTCanvas = dynamic(() => import('../src/components/vtt/VTTCanvas'), { ssr: false });
import VTTControls from '../src/components/vtt/VTTControls';
import SceneNav from '../src/components/vtt/SceneNav';

export default function Home() {
  const [inGame, setInGame] = useState(false);
  const [salaId, setSalaId] = useState("ID-DA-SUA-SALA-AQUI");
  const [cenaAtiva, setCenaAtiva] = useState<any>(null); // Estado para controlar a cena selecionada

  if (inGame) {
    return (
      <main className="h-screen w-full bg-[#0d131f] relative">
        {/* Barra de Navegação de Cenas no topo */}
        <SceneNav salaId={salaId} onSelectCena={setCenaAtiva} cenaAtivaId={cenaAtiva?.id} />
        
        {/* Renderiza Canvas e Controles apenas se houver uma cena selecionada */}
        {cenaAtiva && (
          <>
            <VTTCanvas cenaId={cenaAtiva.id} mapaUrl={cenaAtiva.mapa_url} />
            <VTTControls cenaId={cenaAtiva.id} />
          </>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090e17] text-white flex flex-col justify-center px-6 md:px-16 lg:px-32 relative overflow-hidden">
      
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#1a2b4c] rounded-full blur-[130px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#0f2c25] rounded-full blur-[120px]" />
      </div>

      <div className="z-10 max-w-5xl mt-8">
        <div className="w-16 h-[2px] bg-gradient-to-r from-[#4ad9d9] to-transparent mb-6 opacity-70"></div>

        <h1 className={`${cinzel.className} text-[#f0ebd8] text-5xl md:text-8xl font-black tracking-widest leading-tight mb-4 drop-shadow-[0_0_15px_rgba(74,217,217,0.2)]`}>
          AETHER<span className="text-[#4ad9d9] font-light">QUEST</span>
        </h1>
        
        <p className={`${inter.className} text-[#8b9bb4] text-lg md:text-2xl max-w-2xl mb-12 leading-relaxed font-light tracking-wide`}>
          O Tabletop Virtual focado no essencial. Explore masmorras, role dados e guie seus jogadores em tempo real.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 mb-24">
          <button 
            onClick={() => setInGame(true)}
            className={`${inter.className} group flex items-center justify-center gap-3 bg-gradient-to-r from-[#218b8b] to-[#1a6666] hover:from-[#2aabab] hover:to-[#218b8b] text-white font-semibold py-4 px-10 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(33,139,139,0.3)] hover:shadow-[0_0_30px_rgba(74,217,217,0.5)] border border-[#4ad9d9]/30 tracking-widest text-sm uppercase`}
          >
            <Play size={18} fill="currentColor" className="opacity-90 group-hover:scale-110 transition-transform" />
            Iniciar Jornada
          </button>
          
          <button className={`${inter.className} flex items-center justify-center gap-3 bg-[#131b26]/50 backdrop-blur-md border border-[#2a3b52] hover:border-[#4ad9d9]/50 text-[#8b9bb4] hover:text-[#f0ebd8] font-semibold py-4 px-10 rounded-full transition-all duration-300 tracking-widest text-sm uppercase`}>
            Campanhas
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-[#1a2b4c]/50 pt-12">
          <div className="group">
            <div className="mb-4 text-[#4ad9d9] opacity-80 group-hover:opacity-100 transition-opacity">
              <MapIcon size={32} strokeWidth={1.5} />
            </div>
            <h3 className={`${cinzel.className} text-xl text-[#f0ebd8] font-bold tracking-widest uppercase mb-3`}>
              Mundo Compartilhado
            </h3>
            <p className={`${inter.className} text-[#6b7b94] text-sm leading-relaxed font-light`}>
              Grid dinâmico e movimentação de tokens em tempo real. O que o Mestre vê, o grupo vê.
            </p>
          </div>

          <div className="group">
            <div className="mb-4 text-[#4ad9d9] opacity-80 group-hover:opacity-100 transition-opacity">
              <BookOpen size={32} strokeWidth={1.5} />
            </div>
            <h3 className={`${cinzel.className} text-xl text-[#f0ebd8] font-bold tracking-widest uppercase mb-3`}>
              Compêndio Veloz
            </h3>
            <p className={`${inter.className} text-[#6b7b94] text-sm leading-relaxed font-light`}>
              Acesse fichas e anotações sem perder a visão do tabuleiro. Interface desenhada para fluidez.
            </p>
          </div>

          <div className="group">
            <div className="mb-4 text-[#4ad9d9] opacity-80 group-hover:opacity-100 transition-opacity">
              <Settings2 size={32} strokeWidth={1.5} />
            </div>
            <h3 className={`${cinzel.className} text-xl text-[#f0ebd8] font-bold tracking-widest uppercase mb-3`}>
              Mestre no Controle
            </h3>
            <p className={`${inter.className} text-[#6b7b94] text-sm leading-relaxed font-light`}>
              Ferramentas de upload de mapas e rolagem de dados acessíveis com apenas um toque na tela.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
