"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sword, Shield, Scroll, Settings } from 'lucide-react';
import dynamic from 'next/dynamic';

// 1. O SEGREDO DO SUCESSO: Importação dinâmica para o Konva não quebrar a Vercel
const VTTCanvas = dynamic(() => import('../src/components/vtt/VTTCanvas'), { 
  ssr: false 
});
// 2. Corrigindo o caminho do VTTControls
import VTTControls from '../src/components/vtt/VTTControls';

export default function Home() {
  const [inGame, setInGame] = useState(false);
  const [salaId, setSalaId] = useState("ID-DA-SUA-SALA-AQUI");

  if (inGame) {
    return (
      <main className="h-screen w-full bg-black">
        <VTTCanvas salaId={salaId} />
        <VTTControls salaId={salaId} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-black to-black text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-900 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 max-w-2xl"
      >
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">
          AETHER<span className="text-red-600">QUEST</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl mb-12 font-light">
          O Tabletop Virtual de alto nível para mestres que não param. 
          <span className="block italic text-sm mt-2">Sincronização total. Multiplataforma. Gratuito.</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md mx-auto">
          <button 
            onClick={() => setInGame(true)}
            className="group relative flex items-center justify-center gap-3 bg-white text-black font-bold py-4 px-8 rounded-2xl hover:bg-red-600 hover:text-white transition-all duration-300"
          >
            <Sword className="group-hover:rotate-12 transition-transform" />
            ENTRAR NA MESA
          </button>
          
          <button className="flex items-center justify-center gap-3 bg-slate-800/50 backdrop-blur-md border border-slate-700 text-white font-bold py-4 px-8 rounded-2xl hover:bg-slate-700 transition-all">
            <Scroll size={20} />
            CAMPANHAS
          </button>
        </div>

        <div className="mt-16 flex justify-center gap-8 text-slate-500">
          <div className="flex flex-col items-center gap-1">
            <Shield size={24} />
            <span className="text-[10px] uppercase tracking-widest">Seguro</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Settings size={24} />
            <span className="text-[10px] uppercase tracking-widest">Ajustes</span>
          </div>
        </div>
      </motion.div>

      <footer className="absolute bottom-8 text-[10px] text-slate-600 uppercase tracking-[0.2em]">
        Desenvolvido por Eduardo • 2026
      </footer>
    </main>
  );
}
