"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Camera } from "lucide-react";

export default function FichaLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id?: string }>();
  const pathname = usePathname();
  const fichaId = params?.id;
  const isTokenManager = pathname?.endsWith("/tokens");

  return (
    <>
      {children}

      {fichaId && !isTokenManager ? (
        <Link
          href={`/fichas/${fichaId}/tokens`}
          className="fixed bottom-6 right-5 z-[70] flex items-center gap-2 rounded-full border border-[var(--aq-border-strong)] bg-[rgba(5,10,16,0.92)] px-4 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--aq-accent)] shadow-[0_18px_55px_rgba(0,0,0,0.42)] backdrop-blur-xl transition-all hover:border-[var(--aq-accent)] hover:text-white md:bottom-8 md:right-8"
          aria-label="Abrir imagens de token desta ficha"
        >
          <Camera size={14} />
          Tokens da ficha
        </Link>
      ) : null}
    </>
  );
}
