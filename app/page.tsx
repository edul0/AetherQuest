"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Play, Map as MapIcon, BookOpen, Settings2 } from 'lucide-react';
import { Cinzel, Inter } from 'next/font/google';
import { supabase } from '../src/lib/supabase'; // Importando o Supabase para checar o login

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700', '900'] });
const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '600'] });

const VTTCanvas = dynamic(() => import('../src/components/vtt/VTTCanvas'), { ssr: false });
import VTTControls from '../src/components/vtt/VTTControls';
import SceneNav from '../src/components/vtt/SceneNav';

export default function Home() {
  const [inGame, setInGame] = useState(false);
  const [salaId, setSalaId] = useState("ID-DA-SUA-SALA-AQUI");
  const [cenaAtiva, setCenaAtiva] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Verifica se o usuário está logado assim que a página carrega
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // A FUNÇÃO DA FECHADURA
  const handleIniciarJornada = () => {
    if (user) {
      setInGame(true); // Se tem usuário, abre a mesa
    } else {
      router.push('/login'); // Se não tem, manda pro login
    }
  };

  if (inGame) {
    return (
      <main className="h-screen w-full bg-[#0d131f] relative overflow-hidden">
        <SceneNav salaId={salaId} onSelectCena={setCenaAtiva} cenaAtivaId={cenaAtiva?.id} />
        {cenaAtiva && (
          <>
            <VTTCanvas cenaId={cenaAtiva.id} mapaUrl={cenaAtiva.mapa_url} />
            {/* Aumentei o Z-Index para garantir que os controles apareçam por cima de tudo */}
            <div className="absolute inset-0 pointer-events-none z-[100]">
               <VTTControls cenaId={cenaAtiva.id} />
            </div>
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
            onClick={handleIniciarJornada}
            className={`${inter.className} group flex items-center justify-center gap-3 bg-gradient-to-r from-[#218b8b] to-[#1a6666] hover:from-[#2aabab] hover:to-[#218b8b] text-white font-semibold py-4 px-10 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(33,139,139,0.3)] tracking-widest text-sm uppercase`}
          >
            <Play size={18} className="opacity-90 group-hover:scale-110 transition-transform" />
            Iniciar Jornada
          </button>
        </div>
      </div>
    </main>
  );
}
