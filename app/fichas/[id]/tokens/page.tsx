"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Camera, Check, Loader2, Shield, Upload } from "lucide-react";
import { Cinzel, Inter } from "next/font/google";
import { supabase } from "@/src/lib/supabase";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

type TokenImageKey = "portrait" | "top" | "side";

type FichaRecord = {
  id: string;
  nome_personagem: string;
  avatar_url?: string | null;
  dados?: Record<string, any>;
};

const TOKEN_IMAGE_SLOTS: Array<{ key: TokenImageKey; label: string; title: string; description: string }> = [
  {
    key: "portrait",
    label: "Bolinha",
    title: "Retrato circular",
    description: "Use para HUD, barra inferior e fallback quando nao existir arte do mapa.",
  },
  {
    key: "top",
    label: "Top-down",
    title: "Visao de cima",
    description: "Arte ideal para jogar no mapa como token tatico.",
  },
  {
    key: "side",
    label: "2D",
    title: "Visao 2D lateral",
    description: "Arte para cards, cenas narrativas e futuros modos visuais.",
  },
];

function normalizeTokenImages(ficha: FichaRecord | null) {
  const dados = ficha?.dados ?? {};
  const tokenImages = dados.token_images ?? {};
  return {
    portrait: tokenImages.portrait ?? dados.avatar_url ?? ficha?.avatar_url ?? "",
    top: tokenImages.top ?? "",
    side: tokenImages.side ?? "",
  } satisfies Record<TokenImageKey, string>;
}

export default function TokenImagesPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;

  const [ficha, setFicha] = useState<FichaRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<TokenImageKey | null>(null);
  const [savingActive, setSavingActive] = useState<TokenImageKey | null>(null);
  const [error, setError] = useState("");

  const tokenImages = useMemo(() => normalizeTokenImages(ficha), [ficha]);
  const activeMapImage = ficha?.avatar_url || ficha?.dados?.avatar_url || "";

  useEffect(() => {
    if (!id || id === "undefined") {
      setLoading(false);
      setError("ID da ficha invalido.");
      return;
    }

    let active = true;

    const loadFicha = async () => {
      setLoading(true);
      setError("");
      const { data, error: fetchError } = await supabase
        .from("fichas")
        .select("id, nome_personagem, avatar_url, dados")
        .eq("id", id)
        .maybeSingle();

      if (!active) return;

      if (fetchError) {
        setError(fetchError.message);
        setFicha(null);
      } else if (!data) {
        setError("Ficha nao encontrada ou sem permissao para leitura.");
        setFicha(null);
      } else {
        const normalized = data as FichaRecord;
        const images = normalizeTokenImages(normalized);
        setFicha({
          ...normalized,
          dados: {
            ...(normalized.dados ?? {}),
            avatar_url: normalized.dados?.avatar_url ?? normalized.avatar_url ?? images.portrait,
            token_images: images,
          },
        });
      }

      setLoading(false);
    };

    void loadFicha();

    return () => {
      active = false;
    };
  }, [id]);

  const updateFichaImages = async (nextImages: Record<TokenImageKey, string>, nextActiveImage?: string) => {
    if (!ficha || !id) return;

    const nextDados = {
      ...(ficha.dados ?? {}),
      token_images: nextImages,
      avatar_url: nextActiveImage ?? ficha.dados?.avatar_url ?? ficha.avatar_url ?? nextImages.portrait,
    };

    const payload = {
      avatar_url: nextActiveImage ?? ficha.avatar_url ?? nextDados.avatar_url ?? null,
      dados: nextDados,
    };

    const { error: updateError } = await supabase.from("fichas").update(payload).eq("id", id);
    if (updateError) {
      throw updateError;
    }

    setFicha((current) =>
      current
        ? {
            ...current,
            avatar_url: payload.avatar_url,
            dados: nextDados,
          }
        : current,
    );
  };

  const uploadSlot = async (slot: TokenImageKey, file: File | null) => {
    if (!file || !id || !ficha) return;

    setUploading(slot);
    setError("");

    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `tokens/${id}-${slot}-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("avatares").upload(path, file, { upsert: true });
      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from("avatares").getPublicUrl(path);
      const nextImages = { ...tokenImages, [slot]: data.publicUrl };
      const shouldBecomeActive = slot === "top" || (!activeMapImage && slot === "portrait");
      await updateFichaImages(nextImages, shouldBecomeActive ? data.publicUrl : undefined);
    } catch (uploadError: any) {
      setError(uploadError.message ?? "Falha ao enviar imagem.");
    } finally {
      setUploading(null);
    }
  };

  const useAsMapToken = async (slot: TokenImageKey) => {
    const imageUrl = tokenImages[slot];
    if (!imageUrl) return;

    setSavingActive(slot);
    setError("");
    try {
      await updateFichaImages(tokenImages, imageUrl);
    } catch (updateError: any) {
      setError(updateError.message ?? "Falha ao definir imagem ativa.");
    } finally {
      setSavingActive(null);
    }
  };

  if (loading) {
    return (
      <main className={`aq-page flex min-h-screen items-center justify-center ${inter.className}`}>
        <div className="flex items-center gap-3 text-[var(--aq-accent)]">
          <Loader2 className="animate-spin" size={18} />
          <span className="font-mono text-xs uppercase tracking-[0.35em]">Carregando imagens do token...</span>
        </div>
      </main>
    );
  }

  return (
    <main className={`aq-page min-h-screen px-4 py-6 ${inter.className}`}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => router.push(id ? `/fichas/${id}` : "/fichas")} className="aq-button-secondary">
            <ArrowLeft size={14} />
            Voltar para ficha
          </button>
          <button onClick={() => router.push("/mesa")} className="aq-button-secondary">
            <Shield size={14} />
            Mesa
          </button>
        </header>

        <section className="aq-panel overflow-hidden p-6 md:p-8">
          <div className="max-w-3xl">
            <div className="aq-kicker">Kit visual do token</div>
            <h1 className={`mt-2 text-4xl font-black uppercase tracking-[0.12em] text-[var(--aq-title)] md:text-6xl ${cinzel.className}`}>
              {ficha?.nome_personagem || "Personagem"}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-[var(--aq-text-muted)] md:text-base">
              Cadastre tres artes para a mesma ficha. A imagem marcada como ativa e a que o mapa usa hoje no token em tempo real.
            </p>
          </div>

          {error ? <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {TOKEN_IMAGE_SLOTS.map((slot) => {
              const imageUrl = tokenImages[slot.key];
              const isActive = Boolean(imageUrl && activeMapImage === imageUrl);
              const isBusy = uploading === slot.key || savingActive === slot.key;

              return (
                <article key={slot.key} className="rounded-[2rem] border border-[var(--aq-border)] bg-[rgba(5,10,16,0.68)] p-4">
                  <div className="relative aspect-square overflow-hidden rounded-[1.5rem] border border-dashed border-[var(--aq-border)] bg-[rgba(2,6,11,0.72)]">
                    {imageUrl ? (
                      <img src={imageUrl} alt={slot.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-3 text-[var(--aq-text-subtle)]">
                        <Camera size={32} />
                        <span className="text-[10px] font-black uppercase tracking-[0.26em]">Sem imagem</span>
                      </div>
                    )}
                    {isActive ? (
                      <div className="absolute left-3 top-3 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100">
                        Ativa no mapa
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    <div className="aq-kicker">{slot.label}</div>
                    <h2 className={`mt-1 text-xl font-black text-[var(--aq-title)] ${cinzel.className}`}>{slot.title}</h2>
                    <p className="mt-2 min-h-[48px] text-sm leading-relaxed text-[var(--aq-text-muted)]">{slot.description}</p>
                  </div>

                  <div className="mt-4 grid gap-2">
                    <label className="aq-button-primary cursor-pointer justify-center">
                      {uploading === slot.key ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                      {uploading === slot.key ? "Enviando" : "Enviar imagem"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          void uploadSlot(slot.key, event.target.files?.[0] ?? null);
                          event.target.value = "";
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => void useAsMapToken(slot.key)}
                      disabled={!imageUrl || isActive || isBusy}
                      className="aq-button-secondary justify-center disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {savingActive === slot.key ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                      Usar no mapa
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
