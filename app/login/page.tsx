"use client";

import { useRouter } from "next/navigation";
import { Cinzel, Inter } from "next/font/google";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function LoginPage() {
  const router = useRouter();

  return (
    <main className={`flex min-h-screen items-center justify-center bg-[#050a10] px-6 text-[#8b9bb4] ${inter.className}`}>
      <div className="w-full max-w-md rounded-3xl border border-[#1a2b4c] bg-[#0a0f18]/80 p-8 shadow-[0_0_30px_rgba(74,217,217,0.08)]">
        <div className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-[#4ad9d9]">AetherQuest</div>
        <h1 className={`${cinzel.className} text-3xl font-black text-[#f0ebd8]`}>Entrada da Mesa</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#6b7b94]">
          Esta tela ficou como placeholder. O fluxo principal esta nas fichas e na mesa tatica.
        </p>
        <div className="mt-8 flex gap-3">
          <button onClick={() => router.push("/fichas")} className="rounded-full bg-[#1e6b6b] px-5 py-3 text-xs font-black uppercase tracking-[0.24em] text-white transition-colors hover:bg-[#4ad9d9] hover:text-[#050a10]">
            Abrir fichas
          </button>
          <button onClick={() => router.push("/")} className="rounded-full border border-[#1a2b4c] px-5 py-3 text-xs font-black uppercase tracking-[0.24em] text-[#8b9bb4] transition-colors hover:border-[#4ad9d9] hover:text-[#4ad9d9]">
            Inicio
          </button>
        </div>
      </div>
    </main>
  );
}
