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
    <main className={`aq-page flex flex-col justify-center py-12 ${inter.className}`}>
      {/* Luzes Ancestrais de Fundo */}
      <div className="aq-orb aq-orb-cyan" style={{ top: '5%', left: '15%' }} />
      <div className="aq-orb aq-orb-indigo" style={{ bottom: '5%', right: '15%' }} />

      <div className="aq-shell flex flex-col pt-12 md:pt-20">
        <div className="mb-8">
          {/* Runa superior */}
          <div className="w-16 h-1 bg-[var(--aq-accent)] mb-8 opacity-60 rounded-full shadow-[0_0_12px_var(--aq-accent-soft)]"></div>
          
          <h1 className={`${cinzel.className} text-6xl md:text-8xl font-black tracking-[0.1em] drop-shadow-2xl flex flex-wrap gap-x-4`}>
            <span className="text-[var(--aq-title)]">AETHER</span>
            <span className="text-[var(--aq-accent)] drop-shadow-[0_0_24px_var(--aq-accent-glow)]">QUEST</span>
          </h1>
        </div>

        <p className="max-w-xl text-base md:text-lg leading-relaxed text-[var(--aq-text)] mb-12">
          O Tabletop Virtual focado no essencial. Explore masmorras, role dados e guie seus jogadores em tempo real, moldado na pedra e na luz.
        </p>

        <div className="flex flex-wrap gap-6 mb-24">
          <button
            onClick={handleStartJourney}
            disabled={starting}
            className="aq-button-primary disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Play size={14} className="fill-current" />
            {starting ? 'Acordando relíquia...' : 'Iniciar Jornada'}
          </button>
        </div>

        <div className="w-full h-px bg-gradient-to-r from-[var(--aq-border)] to-transparent mb-16"></div>

        {/* Tabuletas de Funcionalidades */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <div className="aq-panel p-8 flex flex-col transition-colors hover:border-[var(--aq-border-strong)] group">
            <Map className="text-[var(--aq-accent)] mb-6 transition-transform group-hover:scale-110" size={28} strokeWidth={1.5} />
            <h3 className={`${cinzel.className} text-xl text-[var(--aq-title)] font-bold tracking-[0.15em] mb-4`}>
              MUNDO<br/>COMPARTILHADO
            </h3>
            <p className="text-sm text-[var(--aq-text-muted)] leading-relaxed">
              Grid dinâmico e movimentação de tokens em tempo real. A verdade da mesa refletida instantaneamente para o grupo.
            </p>
          </div>

          <div className="aq-panel p-8 flex flex-col transition-colors hover:border-[var(--aq-border-strong)] group">
            <BookOpen className="text-[var(--aq-accent)] mb-6 transition-transform group-hover:scale-110" size={28} strokeWidth={1.5} />
            <h3 className={`${cinzel.className} text-xl text-[var(--aq-title)] font-bold tracking-[0.15em] mb-4`}>
              COMPÊNDIO<br/>ANCESTRAL
            </h3>
            <p className="text-sm text-[var(--aq-text-muted)] leading-relaxed">
              Acesse fichas e grimórios sem perder a visão do tabuleiro. Interface desenhada para fluidez tática.
            </p>
          </div>

          <div className="aq-panel p-8 flex flex-col transition-colors hover:border-[var(--aq-border-strong)] group">
            <Settings2 className="text-[var(--aq-accent)] mb-6 transition-transform group-hover:scale-110" size={28} strokeWidth={1.5} />
            <h3 className={`${cinzel.className} text-xl text-[var(--aq-title)] font-bold tracking-[0.15em] mb-4`}>
              MESTRE NO<br/>CONTROLE
            </h3>
            <p className="text-sm text-[var(--aq-text-muted)] leading-relaxed">
              Ferramentas de upload de mapas e rolagem de dados acessíveis com o toque dos dedos, de qualquer dispositivo.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
