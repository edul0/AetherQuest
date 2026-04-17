"use client";
import React, { useState } from 'react';
import { Cinzel, Inter } from 'next/font/google';
import { supabase } from '../../src/lib/supabase';
import { useRouter } from 'next/navigation';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700', '900'] });
const inter = Inter({ subsets: ['latin'], weight: ['400', '600'] });

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isRegistering) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) alert("Erro no registro: " + error.message);
      else alert("Registro concluído! Você já pode entrar.");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        alert("Erro no login: " + error.message);
      } else {
        router.push('/');
      }
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#090e17] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none flex items-center justify-center">
        <div className="w-[50%] h-[50%] bg-[#1a2b4c] rounded-full blur-[150px]" />
      </div>

      <div className="z-10 bg-[#131b26]/80 backdrop-blur-md p-10 rounded-2xl border border-[#2a3b52] shadow-2xl w-full max-w-sm text-center">
        <h1 className={`${cinzel.className} text-[#f0ebd8] text-3xl font-black tracking-widest mb-2`}>
          AETHER<span className="text-[#4ad9d9] font-light">QUEST</span>
        </h1>
        <p className={`${inter.className} text-[#8b9bb4] text-sm mb-8`}>
          {isRegistering ? "Registre-se para a jornada." : "Identifique-se, viajante."}
        </p>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`${inter.className} bg-[#0a0f18] border border-[#2a3b52] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#4ad9d9] transition-colors`}
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={`${inter.className} bg-[#0a0f18] border border-[#2a3b52] text-white px-4 py-3 rounded-lg focus:outline-none focus:border-[#4ad9d9] transition-colors`}
          />
          
          <button 
            type="submit"
            disabled={loading}
            className={`${inter.className} w-full mt-4 bg-gradient-to-r from-[#218b8b] to-[#1a6666] hover:from-[#2aabab] hover:to-[#218b8b] text-white font-semibold py-3 rounded-lg transition-all shadow-[0_0_15px_rgba(33,139,139,0.3)] tracking-widest text-sm uppercase disabled:opacity-50`}
          >
            {loading ? 'Aguarde...' : (isRegistering ? 'Registrar' : 'Entrar')}
          </button>
        </form>

        <button 
          type="button"
          onClick={() => setIsRegistering(!isRegistering)}
          className={`${inter.className} w-full mt-6 text-[#4ad9d9] text-xs hover:text-white transition-colors underline`}
        >
          {isRegistering ? 'Já possui conta? Entre aqui.' : 'Novo no reino? Registre-
