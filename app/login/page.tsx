"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Cinzel } from "next/font/google";
import { supabase } from '../../src/lib/supabase';
import { Swords, Shield, Scroll, ChevronRight, Sparkles } from "lucide-react";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // Se já tiver sessão ativa, manda direto pro hub de fichas
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/fichas");
      } else {
        setChecking(false);
      }
    };
    checkSession();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#050a14] flex items-center justify-center">
        <span
          className="text-[11px] uppercase tracking-[0.4em] animate-pulse"
          style={{ color: "#4ad9d9", fontFamily: "monospace" }}
        >
          Verificando sessão...
        </span>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "#050a14" }}
    >
      {/* ── Fundo atmosférico ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        {/* Gradiente central */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #4ad9d9 0%, transparent 70%)" }}
        />
        {/* Grade decorativa */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.03]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#4ad9d9" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {/* Linha horizontal central */}
        <div
          className="absolute left-0 right-0 h-px opacity-10"
          style={{ top: "50%", background: "linear-gradient(90deg, transparent, #4ad9d9, transparent)" }}
        />
      </div>

      {/* ── Conteúdo principal ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl">

        {/* Badge superior */}
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full mb-10"
          style={{
            background: "rgba(74,217,217,0.05)",
            border: "1px solid rgba(74,217,217,0.15)",
          }}
        >
          <Sparkles size={10} style={{ color: "#4ad9d9" }} />
          <span
            className="text-[9px] uppercase tracking-[0.3em] font-black"
            style={{ color: "#4ad9d9" }}
          >
            Virtual Tabletop · RPG
          </span>
        </div>

        {/* Logo / Título */}
        <h1
          className={`${cinzel.className} text-6xl md:text-8xl font-black mb-4 leading-none`}
          style={{
            color: "#e8f4fd",
            textShadow: "0 0 60px rgba(74,217,217,0.12)",
            letterSpacing: "0.05em",
          }}
        >
          AETHER
          <br />
          <span style={{ color: "#4ad9d9" }}>QUEST</span>
        </h1>

        {/* Linha decorativa */}
        <div
          className="w-24 h-px my-6"
          style={{ background: "linear-gradient(90deg, transparent, #4ad9d9, transparent)" }}
        />

        {/* Subtítulo */}
        <p
          className="text-sm md:text-base leading-relaxed mb-12 max-w-md"
          style={{ color: "#4a7a9a", fontFamily: "monospace" }}
        >
          Fichas inteligentes. Mesas sincronizadas.
          <br />
          Aventuras que não param na tela.
        </p>

        {/* ── CTAs ── */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Botão principal: Entrar */}
          <button
            onClick={() => router.push("/login")}
            className="group flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-200"
            style={{
              background: "#4ad9d9",
              color: "#050a14",
              boxShadow: "0 0 24px rgba(74,217,217,0.25)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 0 40px rgba(74,217,217,0.45)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow =
                "0 0 24px rgba(74,217,217,0.25)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            Entrar na Mesa
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* ── Feature pills ── */}
        <div className="flex flex-wrap justify-center gap-3 mt-16">
          {[
            { icon: Scroll, label: "Fichas Dinâmicas" },
            { icon: Shield, label: "Ordem Paranormal" },
            { icon: Swords, label: "D&D 5e" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{
                background: "rgba(13,27,46,0.8)",
                border: "1px solid #1e3a5f",
              }}
            >
              <Icon size={11} style={{ color: "#4ad9d9" }} />
              <span
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: "#4a7a9a" }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Rodapé ── */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p
          className="text-[9px] uppercase tracking-[0.3em]"
          style={{ color: "#1e3a5f" }}
        >
          AetherQuest · Powered by Supabase & Next.js
        </p>
      </div>
    </main>
  );
}
