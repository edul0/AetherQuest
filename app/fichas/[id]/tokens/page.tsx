"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Camera, Check, Loader2, Shield, Upload, Wand2 } from "lucide-react";
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
    description: "Arte ideal para jogar no mapa como token tatico. Fundo claro e removido no envio.",
  },
  {
    key: "side",
    label: "2D",
    title: "Corpo vertical",
    description: "Arte de corpo inteiro para usar como miniatura cinematica. Fundo claro e removido no envio.",
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

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Nao foi possivel ler a imagem enviada."));
    };
    image.src = url;
  });
}

function toPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Nao foi possivel gerar PNG transparente."));
    }, "image/png");
  });
}

function filenameStem(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9-_]+/gi, "-").slice(0, 42) || "token";
}

function colorDistance(r: number, g: number, b: number, color: [number, number, number]) {
  return Math.hypot(r - color[0], g - color[1], b - color[2]);
}

async function removeLightBackground(file: File, slot: TokenImageKey) {
  if (slot === "portrait") return file;

  const image = await loadImage(file);
  const maxDimension = 1800;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
  const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
  const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return file;

  ctx.drawImage(image, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const sample = (x: number, y: number) => {
    const sx = Math.max(0, Math.min(width - 1, Math.round(x)));
    const sy = Math.max(0, Math.min(height - 1, Math.round(y)));
    const index = (sy * width + sx) * 4;
    return [data[index], data[index + 1], data[index + 2]] as [number, number, number];
  };

  const samples = [
    sample(0, 0),
    sample(width - 1, 0),
    sample(0, height - 1),
    sample(width - 1, height - 1),
    sample(width * 0.5, 0),
    sample(width * 0.5, height - 1),
    sample(0, height * 0.5),
    sample(width - 1, height * 0.5),
  ];
  const bg = samples.reduce<[number, number, number]>(
    (acc, color) => [acc[0] + color[0] / samples.length, acc[1] + color[1] / samples.length, acc[2] + color[2] / samples.length],
    [0, 0, 0],
  );

  for (let index = 0; index < data.length; index += 4) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max - min;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const distanceFromBg = colorDistance(r, g, b, bg);
    const whitePaper = luminance > 224 && saturation < 46;
    const cornerBackground = luminance > 172 && saturation < 70 && distanceFromBg < 76;
    const softHalo = luminance > 196 && saturation < 58 && distanceFromBg < 108;

    if (whitePaper || cornerBackground) {
      data[index + 3] = 0;
    } else if (softHalo) {
      data[index + 3] = Math.min(data[index + 3], 42);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const blob = await toPngBlob(canvas);
  return new File([blob], `${filenameStem(file.name)}-sem-fundo.png`, { type: "image/png" });
}

export default function TokenImagesPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;

  const [ficha, setFicha] = useState<FichaRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<TokenImageKey | null>(null);
  const [processing, setProcessing] = useState<TokenImageKey | null>(null);
  const [savingActive, setSavingActive] = useState<TokenImageKey | null>(null);
  const [error, setError] = useState("");

  const tokenImages = useMemo(() => normalizeTokenImages(ficha), [ficha]);
  const activeMapImage = ficha?.dados?.avatar_url || ficha?.avatar_url || "";

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
        const activeImage = normalized.dados?.avatar_url ?? normalized.avatar_url ?? images.portrait;
        setFicha({
          ...normalized,
          avatar_url: activeImage,
          dados: {
            ...(normalized.dados ?? {}),
            avatar_url: activeImage,
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

    const activeImage = nextActiveImage ?? ficha.dados?.avatar_url ?? ficha.avatar_url ?? nextImages.portrait;
    const nextDados = {
      ...(ficha.dados ?? {}),
      token_images: nextImages,
      avatar_url: activeImage,
    };

    const payload = {
      avatar_url: activeImage || null,
      dados: nextDados,
    };

    const { error: updateError } = await supabase.from("fichas").update(payload).eq("id", id);
    if (updateError) {
      throw updateError;
    }

    // Best-effort: keep already placed tokens from using an old avatar snapshot.
    await supabase.from("tokens").update({ avatar_url: activeImage || null }).eq("ficha_id", id);

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
    setProcessing(slot);
    setError("");

    try {
      const processedFile = await removeLightBackground(file, slot);
      setProcessing(null);
      const extension = processedFile.type === "image/png" ? "png" : processedFile.name.split(".").pop()?.toLowerCase() || "png";
      const path = `tokens/${id}-${slot}-${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("avatares").upload(path, processedFile, {
        cacheControl: "1",
        contentType: processedFile.type || "image/png",
        upsert: true,
      });
      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from("avatares").getPublicUrl(path);
      const nextImages = { ...tokenImages, [slot]: data.publicUrl };
      await updateFichaImages(nextImages, data.publicUrl);
    } catch (uploadError: any) {
      setError(uploadError.message ?? "Falha ao enviar imagem.");
    } finally {
      setUploading(null);
      setProcessing(null);
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
              Cadastre tres artes para a mesma ficha. Top-down e corpo vertical passam por corte automatico de fundo claro antes de ir para o mapa.
            </p>
          </div>

          {error ? <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {TOKEN_IMAGE_SLOTS.map((slot) => {
              const imageUrl = tokenImages[slot.key];
              const isActive = Boolean(imageUrl && activeMapImage === imageUrl);
              const isBusy = uploading === slot.key || savingActive === slot.key;
              const isProcessing = processing === slot.key;

              return (
                <article key={slot.key} className="rounded-[2rem] border border-[var(--aq-border)] bg-[rgba(5,10,16,0.68)] p-4">
                  <div className="relative aspect-square overflow-hidden rounded-[1.5rem] border border-dashed border-[var(--aq-border)] bg-[rgba(2,6,11,0.72)]">
                    {imageUrl ? (
                      <img src={imageUrl} alt={slot.title} className={slot.key === "side" ? "h-full w-full object-contain" : "h-full w-full object-cover"} />
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
                    {slot.key !== "portrait" ? (
                      <div className="absolute bottom-3 right-3 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-100">
                        <span className="inline-flex items-center gap-1"><Wand2 size={11} /> Remove fundo</span>
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
                      {isProcessing ? "Recortando fundo" : uploading === slot.key ? "Enviando" : "Enviar imagem"}
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
