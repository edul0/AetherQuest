"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Cinzel, Inter } from "next/font/google";
import { Plus, Shield, Swords } from "lucide-react";
import { supabase } from "../../src/lib/supabase";
import { PRESETS } from "../../src/lib/constants";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function FichasHubPage() {
  const router = useRouter();
  const [fichas, setFichas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPresetId, setSelectedPresetId] = useState("ordem_paranormal");

  useEffect(() => {
    const carregarFichas = async () => {
      try {
        const { data, error } = await supabase
          .from("fichas")
          .select("id, nome_personagem, sistema_preset, dados")
          .order("nome_personagem");
        if (error) {
          throw error;
        }
        setFichas(data ?? []);
      } catch (error) {
        console.error("Erro ao carregar fichas:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarFichas();
  }, []);

  const criarNovaFicha = async () => {
    try {
      const preset = PRESETS[selectedPresetId] ?? PRESETS.ordem_paranormal;
      const firstClass = preset.classes?.[0];
      const firstRace = preset.racas?.[0];
      const firstOrigin = preset.origens?.[0];
      const firstPath = firstClass?.caminhos?.[0];
      const progressValue = preset.progressMin ?? 1;

      const novaFicha = {
        nome_personagem: "Novo Personagem",
        sistema_preset: selectedPresetId,
        dados: {
          nex: progressValue,
          progressao: progressValue,
          classe: firstClass?.nome ?? "",
          classe_custom: "",
          trilha: firstPath?.nome ?? "",
          trilha_custom: "",
          origem: firstOrigin?.nome ?? "",
          origem_custom: "",
          raca: firstRace?.nome ?? "",
          raca_custom: "",
          deslocamento: firstRace?.deslocamento ?? "9m",
          atributos: { forca: 1, agilidade: 1, vigor: 1, intelecto: 1, presenca: 1 },
          status: {
            vida: { atual: 10, max: 10 },
            sanidade: { atual: 10, max: 10 },
            pe: { atual: 10, max: 10 },
          },
          habilidades: [],
          armas: [],
          pericias: {},
          defesa: { passiva: 10, bloqueio: 0, esquiva: 0 },
        },
      };

      const { data, error } = await supabase.from("fichas").insert([novaFicha]).select().single();
      if (error) {
        throw error;
      }

      if (data) {
        router.push(`/fichas/${data.id}`);
      }
    } catch (error: any) {
      alert(`Erro ao criar ficha: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="aq-page flex items-center justify-center">
        <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--aq-accent)] animate-pulse">
          Sincronizando arquivos...
        </div>
      </div>
    );
  }

  return (
    <main className={`aq-page ${inter.className}`}>
      <div className="aq-orb aq-orb-cyan" />
      <div className="aq-orb aq-orb-indigo" />

      <div className="aq-shell px-8 py-12 md:px-16">
        <header className="mb-12 flex flex-col gap-4 border-b border-[var(--aq-border)] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="aq-kicker">Omnis</div>
            <h1 className={`${cinzel.className} mt-3 text-4xl font-black tracking-[0.08em] text-[var(--aq-title)] md:text-6xl`}>
              Seus Personagens
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--aq-text-muted)]">
              Crie, organize e abra fichas prontas para a mesa tática. Tudo já alinhado com a paleta cyberpunk do AetherQuest.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={() => router.push("/mesa")} className="aq-button-secondary">
              Abrir Mesa
            </button>
            <button onClick={criarNovaFicha} className="aq-button-primary">
              <Plus size={14} />
              Criar Novo
            </button>
          </div>
        </header>

        <section className="mb-10 aq-panel p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="aq-kicker">Forge Preset</div>
              <h2 className={`${cinzel.className} mt-2 text-2xl font-black tracking-[0.08em] text-[var(--aq-title)]`}>
                Escolha o sistema antes de criar
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--aq-text-muted)]">
                A ficha ja nasce com classe, origem, raca e caminho base do sistema escolhido. Depois voce ainda pode trocar tudo ou usar opcoes personalizadas.
              </p>
            </div>
            <button onClick={criarNovaFicha} className="aq-button-primary">
              <Plus size={14} />
              Criar no sistema atual
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {Object.entries(PRESETS).map(([presetId, preset]) => (
              <button
                key={presetId}
                onClick={() => setSelectedPresetId(presetId)}
                className={`rounded-3xl border p-5 text-left transition-all ${
                  selectedPresetId === presetId
                    ? "border-[var(--aq-border-strong)] bg-[rgba(74,217,217,0.08)] shadow-[0_0_24px_rgba(74,217,217,0.12)]"
                    : "border-[var(--aq-border)] bg-[rgba(5,10,16,0.58)] hover:border-[var(--aq-border-strong)]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className={`${cinzel.className} text-xl font-black tracking-[0.06em] text-[var(--aq-title)]`}>
                    {preset.nome}
                  </h3>
                  {selectedPresetId === presetId ? <span className="aq-pill">Ativo</span> : null}
                </div>
                <div className="mt-4 space-y-2 text-xs uppercase tracking-[0.18em] text-[var(--aq-text-muted)]">
                  <div>{`${preset.progressLabel ?? "Nivel"} ${preset.progressMin ?? 1}-${preset.progressMax ?? 20}`}</div>
                  <div>{`${preset.classes?.length ?? 0} classes`}</div>
                  <div>{`${preset.racas?.length ?? 0} racas`}</div>
                  <div>{`${preset.origens?.length ?? 0} origens`}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {fichas.length === 0 ? (
          <div className="aq-empty-state">Nenhum personagem encontrado.</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {fichas.map((ficha) => (
              <button
                key={ficha.id}
                onClick={() => router.push(`/fichas/${ficha.id}`)}
                className="aq-panel group p-6 text-left transition-all hover:border-[var(--aq-border-strong)] hover:shadow-[0_0_28px_rgba(74,217,217,0.12)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className={`${cinzel.className} text-2xl font-black tracking-[0.06em] text-[var(--aq-title)] transition-colors group-hover:text-[var(--aq-accent)]`}>
                      {ficha.nome_personagem || "Sem Nome"}
                    </h2>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.24em] text-[var(--aq-accent)]">
                      Preset: {String(ficha.sistema_preset ?? "desconhecido").replace("_", " ")}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 border-t border-[var(--aq-border)] pt-4">
                  <div className="flex items-center gap-2 text-sm text-[var(--aq-title)]">
                    <Shield size={14} className="text-red-400" />
                    <span>
                      {ficha.dados?.status?.vida?.atual || 0}/{ficha.dados?.status?.vida?.max || 0} Vida
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--aq-title)]">
                    <Swords size={14} className="text-[var(--aq-accent)]" />
                    <span>
                      {ficha.dados?.status?.sanidade?.atual || 0}/{ficha.dados?.status?.sanidade?.max || 0} Sanidade
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
