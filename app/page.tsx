"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Cinzel, Inter } from 'next/font/google';
import { Play, Map, BookOpen, Settings2 } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700', '900'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500'] });

export default function HomePage() {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  const handleStartJourney = async () => {
    if (starting) {
      return;
    }

    setStarting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.push('/fichas');
        return;
      }

      router.push('/login?next=%2Ffichas');
    } catch (error) {
      console.error('[home] erro ao verificar sessao', error);
      router.push('/login?next=%2Ffichas');
    } finally {
      setStarting(false);
    }
  };

  return (
    <main className={`min-h-screen bg-[#050a10] text-[#8b9bb4] flex flex-col justify-center px-8 md:px-24 py-12 relative overflow-hidden ${inter.className}`}>
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#4ad9d9]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#1a2b4c]/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full z-10 flex flex-col pt-20">
        <div className="mb-8">
          <div className="w-16 h-0.5 bg-[#4ad9d9] mb-8 opacity-50"></div>
          <h1 className={`${cinzel.className} text-6xl md:text-8xl font-black tracking-widest drop-shadow-lg flex flex-wrap`}>
            <span className="text-[#f0ebd8]">AETHER</span>
            <span className="text-[#4ad9d9] drop-shadow-[0_0_20px_rgba(74,217,217,0.3)]">QUEST</span>
          </h1>
        </div>

        <p className="max-w-xl text-base md:text-lg leading-relaxed text-[#8b9bb4] mb-12">
          O Tabletop Virtual focado no essencial. Explore masmorras, role dados e guie seus jogadores em tempo real, de qualquer dispositivo.
        </p>

        <div className="flex flex-wrap gap-6 mb-24">
          <button
            onClick={handleStartJourney}
            disabled={starting}
            className="flex items-center gap-3 bg-[#1e6b6b] hover:bg-[#4ad9d9] text-white hover:text-[#050a10] px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(30,107,107,0.4)] hover:shadow-[0_0_30px_rgba(74,217,217,0.6)] disabled:opacity-70"
          >
            <Play size={14} className="fill-current" />
            {starting ? 'Abrindo...' : 'Iniciar Jornada'}
          </button>
        </div>

        <div className="w-full h-px bg-gradient-to-r from-[#2a3b52] to-transparent mb-16 opacity-50"></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-24">
          <div className="flex flex-col">
            <Map className="text-[#4ad9d9] mb-6" size={28} strokeWidth={1.5} />
            <h3 className={`${cinzel.className} text-xl text-[#f0ebd8] font-bold tracking-widest mb-4`}>
              MUNDO<br/>COMPARTILHADO
            </h3>
            <p className="text-sm text-[#6b7b94] leading-relaxed">
              Grid dinâmico e movimentação de tokens em tempo real. O que o Mestre vê, o grupo vê.
            </p>
          </div>

          <div className="flex flex-col">
            <BookOpen className="text-[#4ad9d9] mb-6" size={28} strokeWidth={1.5} />
            <h3 className={`${cinzel.className} text-xl text-[#f0ebd8] font-bold tracking-widest mb-4`}>
              COMPÊNDIO<br/>VELOZ
            </h3>
            <p className="text-sm text-[#6b7b94] leading-relaxed">
              Acesse fichas e anotações sem perder a visão do tabuleiro. Interface desenhada para fluidez.
            </p>
          </div>

          <div className="flex flex-col">
            <Settings2 className="text-[#f0ebd8] mb-6" size={28} strokeWidth={1.5} />
            <h3 className={`${cinzel.className} text-xl text-[#f0ebd8] font-bold tracking-widest mb-4`}>
              MESTRE NO<br/>CONTROLE
            </h3>
            <p className="text-sm text-[#6b7b94] leading-relaxed">
              Ferramentas de upload de mapas e rolagem de dados acessíveis com apenas um toque na tela.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
