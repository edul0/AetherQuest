"use client";
import { useRouter } from 'next/navigation';
import { Cinzel, Inter } from 'next/font/google';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700', '900'] });
const inter = Inter({ subsets: ['latin'], weight: ['400'] });

export default function HomePage() {
  const router = useRouter();

  return (
    <main className={`min-h-screen bg-[#090e17] flex flex-col items-center justify-center text-center p-4 ${inter.className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1a2b4c33_0%,_transparent_100%)] pointer-events-none" />
      
      <div className="z-10 flex flex-col items-center">
        <h1 className={`${cinzel.className} text-5xl md:text-7xl text-[#4ad9d9] font-black mb-4 tracking-widest drop-shadow-[0_0_15px_rgba(74,217,217,0.4)]`}>
          AETHERQUEST
        </h1>
        <p className="text-[#6b7b94] mb-12 text-sm md:text-base tracking-widest uppercase">
          Sistema de Mesa Virtual Avançado
        </p>
        
        <button 
          onClick={() => router.push('/fichas')}
          className="bg-[#4ad9d9] text-[#090e17] px-10 py-4 rounded-lg text-xs font-black uppercase tracking-[0.3em] hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(74,217,217,0.3)]"
        >
          Entrar no Sistema
        </button>
      </div>
    </main>
  );
}
