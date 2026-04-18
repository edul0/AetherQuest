"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Cinzel, Inter } from "next/font/google";
import {
  ArrowLeft,
  Camera,
  Dices,
  Plus,
  Search,
  Shield,
  Sparkles,03:38 18/04/2026
  Trash2,
  X,
  Zap
} from "lucide-react";
import { supabase } from "../../../src/lib/supabase";
import { PRESETS } from "../../../src/lib/constants";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const CUSTOM_OPTION = "__custom__";
const DEFAULT_ATTRS = { forca: 1, agilidade: 1, vigor: 1, intelecto: 1, presenca: 1 };
const DEFAULT_STATUS = {
  vida: { atual: 10, max: 10 },
  sanidade: { atual: 10, max: 10 },
  pe: { atual: 5, max: 5 }
};
const ATTRIBUTE_ORDER = [
  { id: "agilidade", label: "AGI", nome: "Agilidade", pos: "top-0 left-1/2 -translate-x-1/2" },
  { id: "intelecto", label: "INT", nome: "Intelecto", pos: "top-[30%] right-0 translate-x-3" },
  { id: "vigor", label: "VIG", nome: "Vigor", pos: "bottom-3 right-3" },
  { id: "presenca", label: "PRE", nome: "Presenca", pos: "bottom-3 left-3" },
  { id: "forca", label: "FOR", nome: "Forca", pos: "top-[30%] left-0 -translate-x-3" }
] as const;

function uid() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function normalizeNumber(value: any, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function normalizeFicha(record: any) {
  const status = record?.dados?.status ?? {};
  const pe = status.pe ?? status.estamina ?? DEFAULT_STATUS.pe;

  return {
    ...record,
    dados: {
      ...(record?.dados ?? {}),
      nivel: normalizeNumber(record?.dados?.nivel, 1),
      nex: normalizeNumber(record?.dados?.nex, 5),
      origem: record?.dados?.origem ?? "",
      classe: record?.dados?.classe ?? "",
      raca: record?.dados?.raca ?? "",
      deslocamento: record?.dados?.deslocamento ?? "9m",
      avatar_url: record?.dados?.avatar_url ?? record?.avatar_url ?? "",
      habilidades: Array.isArray(record?.dados?.habilidades) ? record.dados.habilidades : [],
      armas: Array.isArray(record?.dados?.armas) ? record.dados.armas : [],
      pericias: record?.dados?.pericias ?? {},
      atributos: {
        ...DEFAULT_ATTRS,
        ...(record?.dados?.atributos ?? {})
      },
      status: {
        vida: { ...DEFAULT_STATUS.vida, ...(status.vida ?? {}) },
        sanidade: { ...DEFAULT_STATUS.sanidade, ...(status.sanidade ?? {}) },
        pe: { ...DEFAULT_STATUS.pe, ...pe }
      },
      defesa: {
        passiva: 10,
        bloqueio: 0,
        esquiva: 0,
        bonus: 0,
        bloqueio_bonus: 0,
        esquiva_bonus: 0,
        ...(record?.dados?.defesa ?? {})
      }
    }
  };
}

function getOptionName(option: any) {
  return typeof option === "string" ? option : option?.nome ?? "";
}

function findOption(list: any[] = [], name: string) {
  return list.find((item) => getOptionName(item) === name) ?? null;
}

function buildAutomaticData(ficha: any, sistema: any) {
  const attrsBase = { ...DEFAULT_ATTRS, ...(ficha?.dados?.atributos ?? {}) };
  const classe = findOption(sistema?.classes ?? [], ficha?.dados?.classe ?? "");
  const origem = findOption(sistema?.origens ?? [], ficha?.dados?.origem ?? "");
  const raca = findOption(sistema?.racas ?? [], ficha?.dados?.raca ?? "");
  const attrs = { ...attrsBase };

  Object.entries(raca?.atributos ?? {}).forEach(([key, value]) => {
    attrs[key as keyof typeof attrs] = normalizeNumber(attrs[key as keyof typeof attrs], 0) + normalizeNumber(value, 0);
  });

  const nex = Math.max(0, normalizeNumber(ficha?.dados?.nex, 5));
  const nivel = Math.max(1, normalizeNumber(ficha?.dados?.nivel, 1));
  const className = getOptionName(classe).toLowerCase();
  const isDnd = ficha?.sistema_preset === "dnd5e";
  const statusCurrent = ficha?.dados?.status ?? DEFAULT_STATUS;

  const vidaMax = isDnd
    ? normalizeNumber(classe?.vidaBase, 10) + Math.max(0, nivel - 1) * normalizeNumber(classe?.vidaPorNivel, 6) + attrs.vigor * 2
    : normalizeNumber(classe?.vidaBase, className.includes("combat") ? 18 : className.includes("ocult") ? 12 : 15) + nex + attrs.vigor * 3;

  const peMax = isDnd
    ? normalizeNumber(classe?.recursoBase, 3) + Math.max(0, nivel - 1) * normalizeNumber(classe?.recursoPorNivel, 2) + attrs.intelecto + Math.max(0, attrs.presenca - 1)
    : normalizeNumber(classe?.recursoBase, className.includes("ocult") ? 12 : className.includes("especial") ? 9 : 7) + nex + attrs.presenca * 2;

  const sanidadeMax = isDnd
    ? normalizeNumber(classe?.sanidadeBase, 10) + Math.max(0, nivel - 1) * normalizeNumber(classe?.sanidadePorNivel, 1) + attrs.presenca * 2
    : normalizeNumber(classe?.sanidadeBase, className.includes("ocult") ? 14 : 10) + nex * 2 + attrs.presenca * 3;

  const defesaBonus = normalizeNumber(ficha?.dados?.defesa?.bonus, 0);
  const bloqueioBonus = normalizeNumber(ficha?.dados?.defesa?.bloqueio_bonus, 0);
  const esquivaBonus = normalizeNumber(ficha?.dados?.defesa?.esquiva_bonus, 0);
  const defesaPassiva = 10 + attrs.agilidade + normalizeNumber(classe?.defesaBonus, 0) + defesaBonus;
  const bloqueio = attrs.vigor + attrs.forca + normalizeNumber(classe?.bloqueioBonus, 0) + bloqueioBonus;
  const esquiva = attrs.agilidade + normalizeNumber(classe?.esquivaBonus, 0) + esquivaBonus;

  const autoPericias: Record<string, number> = {};
  [origem, classe, raca].forEach((entry) => {
    (entry?.proficiencias ?? []).forEach((pericia: string) => {
      autoPericias[pericia] = Math.max(autoPericias[pericia] ?? 0, 2);
    });
  });

  const autoHabilidades = [
    ...(origem
      ? [
          {
            id: `origem-${origem.nome}`,
            nome: origem.nome,
            dado: "Origem",
            desc: origem.poder ?? "Origem selecionada.",
            subcat: "Origem",
            fonte: ficha?.sistema_preset
          }
        ]
      : []),
    ...((classe?.habilidades ?? []).map((habilidade: string) => ({
      id: `classe-${habilidade}`,
      nome: habilidade,
      dado: "Classe",
      desc: `${getOptionName(classe)} concede ${habilidade}.`,
      subcat: "Classe",
      fonte: ficha?.sistema_preset
    })) ?? []),
    ...(raca
      ? [
          {
            id: `raca-${raca.nome}`,
            nome: raca.nome,
            dado: "Raca",
            desc: raca.poder ?? "Raca selecionada.",
            subcat: "Raca",
            fonte: ficha?.sistema_preset
          }
        ]
      : [])
  ];

  return {
    attrs,
    autoPericias,
    autoHabilidades,
    status: {
      vida: { max: vidaMax, atual: Math.min(normalizeNumber(statusCurrent.vida?.atual, vidaMax), vidaMax) },
      sanidade: { max: sanidadeMax, atual: Math.min(normalizeNumber(statusCurrent.sanidade?.atual, sanidadeMax), sanidadeMax) },
      pe: { max: peMax, atual: Math.min(normalizeNumber(statusCurrent.pe?.atual, peMax), peMax) }
    },
    defesa: {
      passiva: defesaPassiva,
      bloqueio,
      esquiva
    },
    deslocamento: raca?.deslocamento ?? ficha?.dados?.deslocamento ?? "9m"
  };
}

function EmptyState({ message }: { message: string }) {
  return <div className="aq-empty-state">{message}</div>;
}

function SelectWithCustom({
  label,
  value,
  options,
  customPlaceholder,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  customPlaceholder: string;
  onChange: (value: string) => void;
}) {
  const [customMode, setCustomMode] = useState(Boolean(value) && !options.includes(value));

  useEffect(() => {
    if (value && !options.includes(value)) {
      setCustomMode(true);
      return;
    }
    if (!value && customMode) {
      return;
    }
    if (options.includes(value)) {
      setCustomMode(false);
    }
  }, [customMode, options, value]);

  return (
    <div>
      <div className="aq-kicker">{label}</div>
      <select
        value={customMode ? CUSTOM_OPTION : value}
        onChange={(e) => {
          if (e.target.value === CUSTOM_OPTION) {
            setCustomMode(true);
            onChange("");
            return;
          }
          setCustomMode(false);
          onChange(e.target.value);
        }}
        className="aq-input mt-2"
      >
        <option value="">Selecione</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value={CUSTOM_OPTION}>Personalizado</option>
      </select>
      {customMode ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={customPlaceholder}
          className="aq-input mt-2"
        />
      ) : null}
    </div>
  );
}

function StatBar({
  label,
  value,
  max,
  fill,
  onChange
}: {
  label: string;
  value: number;
  max: number;
  fill: string;
  onChange: (nextValue: number) => void;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.24em] text-[var(--aq-text-muted)]">
        <span>{label}</span>
        <div className="flex items-center gap-2 text-[var(--aq-title)]">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
            className="w-12 bg-transparent text-right outline-none"
          />
          <span className="text-[var(--aq-text-subtle)]">/</span>
          <span className="w-12 text-right text-[var(--aq-text)]">{max}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-[var(--aq-border)] bg-[rgba(5,10,16,0.75)] px-2 py-1">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="px-3 text-lg font-black text-[var(--aq-text-subtle)] transition-colors hover:text-[var(--aq-accent)]"
        >
          -
        </button>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-[rgba(10,15,24,0.95)]">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: fill }} />
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="px-3 text-lg font-black text-[var(--aq-text-subtle)] transition-colors hover:text-[var(--aq-accent)]"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function FichaPersonagemPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ficha, setFicha] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"pericias" | "habilidades" | "armas">("pericias");
  const [modalOpen, setModalOpen] = useState<"habilidades" | "armas" | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!id || id === "undefined") {
      setLoading(false);
      return;
    }

    const carregarFicha = async () => {
      try {
        const { data, error } = await supabase.from("fichas").select("*").eq("id", id).single();
        if (error) throw error;
        setFicha(normalizeFicha(data));
      } catch (error) {
        console.error("Erro ao carregar ficha:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarFicha();
  }, [id]);

  const sistema = useMemo(() => {
    if (!ficha?.sistema_preset) return PRESETS.ordem_paranormal as any;
    return PRESETS[ficha.sistema_preset as keyof typeof PRESETS] as any;
  }, [ficha?.sistema_preset]);

  const derived = useMemo(() => buildAutomaticData(ficha, sistema), [ficha, sistema]);

  useEffect(() => {
    if (!ficha) return;
    const nextStatus = derived.status;
    const nextDefesa = derived.defesa;
    const nextDeslocamento = derived.deslocamento;

    const changed =
      ficha.dados.status.vida.max !== nextStatus.vida.max ||
      ficha.dados.status.sanidade.max !== nextStatus.sanidade.max ||
      ficha.dados.status.pe.max !== nextStatus.pe.max ||
      ficha.dados.status.vida.atual !== nextStatus.vida.atual ||
      ficha.dados.status.sanidade.atual !== nextStatus.sanidade.atual ||
      ficha.dados.status.pe.atual !== nextStatus.pe.atual ||
      ficha.dados.defesa.passiva !== nextDefesa.passiva ||
      ficha.dados.defesa.bloqueio !== nextDefesa.bloqueio ||
      ficha.dados.defesa.esquiva !== nextDefesa.esquiva ||
      ficha.dados.deslocamento !== nextDeslocamento;

    if (!changed) return;

    setFicha((current: any) => ({
      ...current,
      dados: {
        ...current.dados,
        deslocamento: nextDeslocamento,
        status: nextStatus,
        defesa: {
          ...current.dados.defesa,
          ...nextDefesa
        }
      }
    }));
  }, [derived, ficha]);

  const pericias = useMemo(() => (Array.isArray(sistema?.pericias) ? sistema.pericias : []), [sistema]);

  const habilidadesCatalogo = useMemo(() => {
    const categorias = Array.isArray(sistema?.categorias_hab) ? sistema.categorias_hab : [];
    return categorias.flatMap((categoria: any) => {
      const items = Array.isArray(sistema?.[categoria.id]) ? sistema[categoria.id] : [];
      return items.map((item: any) => ({ ...item, categoriaId: categoria.id, categoriaNome: categoria.nome }));
    });
  }, [sistema]);

  const modalItems = useMemo(() => {
    const source = modalOpen === "armas" ? sistema?.armas ?? [] : habilidadesCatalogo;
    const query = searchTerm.trim().toLowerCase();
    if (!query) return source;
    return source.filter((item: any) =>
      [item.nome, item.desc, item.tipo, item.subcat, item.categoriaNome]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [habilidadesCatalogo, modalOpen, searchTerm, sistema]);

  const combinedHabilidades = useMemo(
    () => [...derived.autoHabilidades, ...(ficha?.dados?.habilidades ?? [])],
    [derived.autoHabilidades, ficha?.dados?.habilidades]
  );

  const setFichaValue = (path: string, value: any) => {
    setFicha((current: any) => {
      if (!current) return current;
      const next = { ...current, dados: { ...current.dados } };
      const keys = path.split(".");
      let target = next.dados;

      for (let index = 0; index < keys.length - 1; index += 1) {
        const key = keys[index];
        target[key] = { ...(target[key] ?? {}) };
        target = target[key];
      }

      target[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const updateItem = (collection: "habilidades" | "armas", itemId: number, patch: Record<string, any>) => {
    setFicha((current: any) => ({
      ...current,
      dados: {
        ...current.dados,
        [collection]: current.dados[collection].map((item: any) => (item.id === itemId ? { ...item, ...patch } : item))
      }
    }));
  };

  const removeItem = (collection: "habilidades" | "armas", itemId: number) => {
    setFicha((current: any) => ({
      ...current,
      dados: {
        ...current.dados,
        [collection]: current.dados[collection].filter((item: any) => item.id !== itemId)
      }
    }));
  };

  const addCompendiumItem = (item: any) => {
    if (modalOpen === "armas") {
      setFicha((current: any) => ({
        ...current,
        dados: {
          ...current.dados,
          armas: [
            ...current.dados.armas,
            {
              id: uid(),
              nome: item.nome,
              tipo: item.tipo ?? "Tatica",
              habilidade: item.habilidade ?? "Luta",
              dano: item.dano ?? "1d6",
              critico: item.critico ?? "20",
              alcance: item.alcance ?? "Adjacente",
              categoria: item.categoria ?? 0,
              desc: item.desc ?? "",
              melhorias: "",
              maldicoes: "",
              notas: ""
            }
          ]
        }
      }));
    } else {
      setFicha((current: any) => ({
        ...current,
        dados: {
          ...current.dados,
          habilidades: [
            ...current.dados.habilidades,
            {
              id: uid(),
              nome: item.nome,
              dado: item.dado ?? "",
              desc: item.desc ?? "",
              subcat: item.subcat ?? item.categoriaNome ?? "",
              fonte: item.fonte ?? ficha?.sistema_preset ?? ""
            }
          ]
        }
      }));
    }

    setModalOpen(null);
    setSearchTerm("");
  };

  const salvarFicha = async () => {
    if (!id || !ficha) return;
    setSaving(true);
    try {
      const payload = {
        nome_personagem: ficha.nome_personagem,
        sistema_preset: ficha.sistema_preset,
        avatar_url: ficha.dados.avatar_url || null,
        dados: {
          ...ficha.dados,
          status: derived.status,
          defesa: {
            ...ficha.dados.defesa,
            ...derived.defesa
          },
          deslocamento: derived.deslocamento
        }
      };

      const { error } = await supabase.from("fichas").update(payload).eq("id", id);
      if (error) throw error;
      alert("Ficha sincronizada com a mesa.");
    } catch (error: any) {
      alert(`Falha ao salvar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `retratos/${id}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatares").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatares").getPublicUrl(path);
      setFicha((current: any) => ({
        ...current,
        avatar_url: data.publicUrl,
        dados: {
          ...current.dados,
          avatar_url: data.publicUrl
        }
      }));
    } catch (error: any) {
      alert(`Falha no upload: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (!id || id === "undefined") {
    return <div className="aq-page flex items-center justify-center"><div className="aq-panel px-8 py-10 text-center text-red-400">ID invalido na URL.</div></div>;
  }

  if (loading) {
    return (
      <div className="aq-page flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-[var(--aq-accent)]">
          <Zap className="animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-[0.35em]">Estabelecendo conexao...</span>
        </div>
      </div>
    );
  }

  if (!ficha) {
    return <div className="aq-page flex items-center justify-center"><div className="aq-panel px-8 py-10 text-center text-red-400">Registro de ficha nao localizado.</div></div>;
  }

  const classOptions = (sistema?.classes ?? []).map(getOptionName);
  const originOptions = (sistema?.origens ?? []).map(getOptionName);
  const raceOptions = (sistema?.racas ?? []).map(getOptionName);
  const labels =
    ficha.sistema_preset === "dnd5e"
      ? { progresso: "Nivel", recurso: "Recursos", compendio: "Ferramentas de classe e magia" }
      : { progresso: "NEX", recurso: "Pontos de Esforco", compendio: "Compendio paranormal e arsenal" };

  return (
    <main className={`aq-page overflow-y-auto pb-20 ${inter.className}`}>
      <div className="aq-orb aq-orb-cyan" />
      <div className="aq-orb aq-orb-indigo" />

      <header className="sticky top-0 z-40 border-b border-[var(--aq-border-strong)] bg-[rgba(5,10,16,0.86)] backdrop-blur-xl">
        <div className="aq-shell flex items-center justify-between gap-4 px-6 py-4 md:px-8">
          <button
            onClick={() => router.push("/fichas")}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.28em] text-[var(--aq-accent)] transition-colors hover:text-white"
          >
            <ArrowLeft size={14} />
            Voltar
          </button>
          <button onClick={salvarFicha} disabled={saving} className="aq-button-primary disabled:opacity-60">
            {saving ? "Sincronizando..." : "Sincronizar"}
          </button>
        </div>
      </header>

      <div className="aq-shell mt-8 grid gap-8 px-6 md:px-8 lg:grid-cols-12">
        <section className="space-y-8 lg:col-span-5">
          <div className="aq-panel p-5">
            <div className="flex flex-col gap-5 md:flex-row">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[var(--aq-border)] bg-[rgba(5,10,16,0.8)]"
              >
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                {ficha.dados.avatar_url ? (
                  <img src={ficha.dados.avatar_url} alt="Retrato" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="text-[var(--aq-text-subtle)] transition-colors group-hover:text-[var(--aq-accent)]" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(5,10,16,0.92))] px-3 py-2 text-center text-[10px] font-black uppercase tracking-[0.24em] text-[var(--aq-accent)]">
                  {uploading ? "Enviando..." : "Retrato"}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="border-b border-[var(--aq-border)] pb-2">
                  <div className="aq-kicker">Personagem</div>
                  <input
                    value={ficha.nome_personagem ?? ""}
                    onChange={(e) => setFicha((current: any) => ({ ...current, nome_personagem: e.target.value }))}
                    placeholder="Sem nome"
                    className={`mt-1 w-full bg-transparent text-2xl font-black text-[var(--aq-title)] outline-none ${cinzel.className}`}
                  />
                </div>

                <div>
                  <div className="aq-kicker">Sistema</div>
                  <select
                    value={ficha.sistema_preset ?? "ordem_paranormal"}
                    onChange={(e) => setFicha((current: any) => normalizeFicha({ ...current, sistema_preset: e.target.value }))}
                    className="aq-input mt-2"
                  >
                    <option value="ordem_paranormal">Ordem Paranormal</option>
                    <option value="dnd5e">D&D 5e</option>
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <SelectWithCustom
                    label="Origem"
                    value={ficha.dados.origem ?? ""}
                    options={originOptions}
                    customPlaceholder="Origem personalizada"
                    onChange={(value) => setFichaValue("origem", value)}
                  />
                  <SelectWithCustom
                    label="Classe"
                    value={ficha.dados.classe ?? ""}
                    options={classOptions}
                    customPlaceholder="Classe personalizada"
                    onChange={(value) => setFichaValue("classe", value)}
                  />
                </div>

                <SelectWithCustom
                  label="Raca"
                  value={ficha.dados.raca ?? ""}
                  options={raceOptions}
                  customPlaceholder="Raca personalizada"
                  onChange={(value) => setFichaValue("raca", value)}
                />
              </div>
            </div>
          </div>

          <div className="aq-panel flex flex-col items-center p-6">
            <div className={`mb-6 text-center text-2xl font-black tracking-[0.24em] text-[var(--aq-title)] ${cinzel.className}`}>ATRIBUTOS</div>
            <div className="mb-4 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.6)] px-4 py-3 text-center text-xs text-[var(--aq-text-muted)]">
              Bonus automaticos de raca ja entram nos calculos de vida, defesa e pericias.
            </div>
            <div className="relative h-[320px] w-[320px]">
              <div className="absolute inset-0 rounded-full border border-[var(--aq-border)] opacity-60" />
              <div className="absolute inset-[40px] rounded-full border border-[rgba(74,217,217,0.18)]" />
              {ATTRIBUTE_ORDER.map((attribute) => (
                <div
                  key={attribute.id}
                  className={`absolute ${attribute.pos} flex h-[92px] w-[92px] flex-col items-center justify-center rounded-full border border-[var(--aq-border-strong)] bg-[rgba(5,10,16,0.92)] shadow-[0_0_24px_rgba(74,217,217,0.08)]`}
                >
                  <input
                    type="number"
                    value={ficha.dados.atributos[attribute.id] ?? 0}
                    onChange={(e) => setFichaValue(`atributos.${attribute.id}`, parseInt(e.target.value, 10) || 0)}
                    className="w-14 bg-transparent text-center text-4xl font-black text-[var(--aq-title)] outline-none"
                  />
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--aq-text-muted)]">
                    {attribute.nome}
                  </span>
                  <span className="text-sm font-black text-[var(--aq-accent)]">{attribute.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="aq-panel space-y-5 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="aq-kicker">{labels.progresso}</div>
                <div className="mt-2 flex items-center gap-2 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.78)] px-4 py-3">
                  <input
                    type="number"
                    value={ficha.sistema_preset === "dnd5e" ? ficha.dados.nivel ?? 1 : ficha.dados.nex ?? 5}
                    onChange={(e) =>
                      ficha.sistema_preset === "dnd5e"
                        ? setFichaValue("nivel", parseInt(e.target.value, 10) || 1)
                        : setFichaValue("nex", parseInt(e.target.value, 10) || 0)
                    }
                    className="w-16 bg-transparent text-2xl font-black text-[var(--aq-title)] outline-none"
                  />
                  <span className="text-lg font-black text-[var(--aq-text-muted)]">
                    {ficha.sistema_preset === "dnd5e" ? "lv" : "%"}
                  </span>
                </div>
              </div>
              <div>
                <div className="aq-kicker">Deslocamento</div>
                <input value={ficha.dados.deslocamento ?? "9m"} readOnly className="aq-input mt-2 opacity-80" />
              </div>
            </div>

            <StatBar
              label="Vida"
              value={ficha.dados.status.vida.atual}
              max={ficha.dados.status.vida.max}
              fill="linear-gradient(90deg, rgba(239,68,68,0.92), rgba(185,28,28,0.95))"
              onChange={(value) => setFichaValue("status.vida", { ...ficha.dados.status.vida, atual: value })}
            />
            <StatBar
              label="Sanidade"
              value={ficha.dados.status.sanidade.atual}
              max={ficha.dados.status.sanidade.max}
              fill="linear-gradient(90deg, rgba(139,92,246,0.92), rgba(59,130,246,0.92))"
              onChange={(value) => setFichaValue("status.sanidade", { ...ficha.dados.status.sanidade, atual: value })}
            />
            <StatBar
              label={labels.recurso}
              value={ficha.dados.status.pe.atual}
              max={ficha.dados.status.pe.max}
              fill="linear-gradient(90deg, rgba(74,217,217,0.92), rgba(30,107,107,0.95))"
              onChange={(value) => setFichaValue("status.pe", { ...ficha.dados.status.pe, atual: value })}
            />
          </div>
        </section>

        <section className="space-y-6 lg:col-span-7">
          <div className="aq-panel grid gap-4 p-5 md:grid-cols-[1.2fr_repeat(2,1fr)]">
            <div className="flex items-center gap-4 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.6)] p-4">
              <Shield className="text-[var(--aq-accent)]" />
              <div>
                <div className="aq-kicker">Defesa</div>
                <div className="mt-1 text-3xl font-black text-[var(--aq-title)]">{ficha.dados.defesa.passiva}</div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--aq-text-muted)]">
                  Base 10 + AGI + bonus
                </div>
              </div>
            </div>
            <div>
              <div className="aq-kicker">Bonus Defesa</div>
              <input
                type="number"
                value={ficha.dados.defesa.bonus ?? 0}
                onChange={(e) => setFichaValue("defesa.bonus", parseInt(e.target.value, 10) || 0)}
                className="aq-input mt-2"
              />
            </div>
            <div className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.6)] p-4 text-sm text-[var(--aq-text-muted)]">
              <div className="mb-2 flex items-center gap-2 text-[var(--aq-accent)]">
                <Sparkles size={14} />
                <span className="aq-kicker">Defesa Funcional</span>
              </div>
              <div>Bloqueio: {ficha.dados.defesa.bloqueio}</div>
              <div>Esquiva: {ficha.dados.defesa.esquiva}</div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="aq-panel p-5">
              <div className="aq-kicker">Bonus Bloqueio</div>
              <input
                type="number"
                value={ficha.dados.defesa.bloqueio_bonus ?? 0}
                onChange={(e) => setFichaValue("defesa.bloqueio_bonus", parseInt(e.target.value, 10) || 0)}
                className="aq-input mt-2"
              />
            </div>
            <div className="aq-panel p-5">
              <div className="aq-kicker">Bonus Esquiva</div>
              <input
                type="number"
                value={ficha.dados.defesa.esquiva_bonus ?? 0}
                onChange={(e) => setFichaValue("defesa.esquiva_bonus", parseInt(e.target.value, 10) || 0)}
                className="aq-input mt-2"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { id: "pericias", label: "Pericias" },
              { id: "habilidades", label: "Habilidades" },
              { id: "armas", label: "Inventario" }
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={activeTab === tab.id ? "aq-button-primary" : "aq-button-secondary"}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="aq-panel min-h-[560px] p-6">
            {activeTab === "pericias" && (
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-2 px-3 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--aq-text-muted)]">
                  <div className="col-span-4">Pericia</div>
                  <div className="col-span-2 text-center">Atributo</div>
                  <div className="col-span-1 text-center">Auto</div>
                  <div className="col-span-1 text-center">Total</div>
                  <div className="col-span-2 text-center">Treino</div>
                  <div className="col-span-2 text-center">Outros</div>
                </div>
                <div className="aq-scrollbar max-h-[600px] space-y-2 overflow-y-auto pr-2">
                  {pericias.map((pericia: any) => {
                    const manual = ficha.dados.pericias?.[pericia.nome] ?? {};
                    const treino = normalizeNumber(manual.treino, 0);
                    const outros = normalizeNumber(manual.outros, 0);
                    const auto = normalizeNumber(derived.autoPericias[pericia.nome], 0);
                    const atributo = pericia.atributo;
                    const total = normalizeNumber(derived.attrs[atributo], 0) + treino + auto + outros;

                    return (
                      <div key={pericia.nome} className="grid grid-cols-12 items-center gap-2 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.6)] px-3 py-2">
                        <div className="col-span-4 flex items-center gap-3 text-sm font-bold text-[var(--aq-title)]">
                          <Dices size={14} className="text-[var(--aq-text-subtle)]" />
                          {pericia.nome}
                        </div>
                        <div className="col-span-2 text-center text-[11px] uppercase tracking-[0.2em] text-[var(--aq-text-muted)]">
                          {atributo.slice(0, 3)}
                        </div>
                        <div className="col-span-1 text-center text-sm font-black text-[var(--aq-accent)]">{auto}</div>
                        <div className="col-span-1 text-center text-sm font-black text-[var(--aq-title)]">{total}</div>
                        <div className="col-span-2 flex justify-center">
                          <input
                            type="number"
                            value={treino}
                            onChange={(e) => setFichaValue(`pericias.${pericia.nome}.treino`, parseInt(e.target.value, 10) || 0)}
                            className="aq-input w-14 text-center"
                          />
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <input
                            type="number"
                            value={outros}
                            onChange={(e) => setFichaValue(`pericias.${pericia.nome}.outros`, parseInt(e.target.value, 10) || 0)}
                            className="aq-input w-14 text-center"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "habilidades" && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className={`text-xl font-black text-[var(--aq-title)] ${cinzel.className}`}>Habilidades</h2>
                    <p className="mt-1 text-sm text-[var(--aq-text-muted)]">{labels.compendio}</p>
                  </div>
                  <button onClick={() => setModalOpen("habilidades")} className="aq-button-primary">
                    <Plus size={14} />
                    Adicionar
                  </button>
                </div>

                {combinedHabilidades.length === 0 ? (
                  <EmptyState message="Nenhuma habilidade registrada ainda." />
                ) : (
                  <div className="aq-scrollbar max-h-[620px] space-y-3 overflow-y-auto pr-2">
                    {combinedHabilidades.map((habilidade: any) => {
                      const automatic = typeof habilidade.id === "string";
                      return (
                        <article key={habilidade.id} className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.65)] p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-black text-[var(--aq-title)]">{habilidade.nome}</h3>
                                {habilidade.dado ? <span className="aq-pill">{habilidade.dado}</span> : null}
                                {habilidade.subcat ? <span className="aq-pill aq-pill-muted">{habilidade.subcat}</span> : null}
                                {automatic ? <span className="aq-pill aq-pill-muted">Auto</span> : null}
                              </div>
                              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--aq-text)]">
                                {habilidade.desc || "Sem descricao adicional."}
                              </p>
                            </div>
                            {!automatic ? (
                              <button
                                onClick={() => removeItem("habilidades", habilidade.id)}
                                className="rounded-full border border-[var(--aq-border)] p-2 text-[var(--aq-text-subtle)] transition-colors hover:border-red-400 hover:text-red-400"
                              >
                                <Trash2 size={14} />
                              </button>
                            ) : null}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "armas" && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className={`text-xl font-black text-[var(--aq-title)] ${cinzel.className}`}>Inventario</h2>
                    <p className="mt-1 text-sm text-[var(--aq-text-muted)]">Mapeie armas, notas e modificacoes da ficha.</p>
                  </div>
                  <button onClick={() => setModalOpen("armas")} className="aq-button-primary">
                    <Plus size={14} />
                    Nova Arma
                  </button>
                </div>

                {ficha.dados.armas.length === 0 ? (
                  <EmptyState message="Nenhuma arma ou equipamento cadastrado." />
                ) : (
                  <div className="aq-scrollbar max-h-[620px] space-y-4 overflow-y-auto pr-2">
                    {ficha.dados.armas.map((arma: any) => (
                      <article key={arma.id} className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.65)] p-4">
                        <div className="mb-4 flex items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                value={arma.nome}
                                onChange={(e) => updateItem("armas", arma.id, { nome: e.target.value })}
                                className={`bg-transparent text-xl font-black text-[var(--aq-title)] outline-none ${cinzel.className}`}
                              />
                              <span className="aq-pill aq-pill-muted">{arma.tipo || "Equipamento"}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem("armas", arma.id)}
                            className="rounded-full border border-[var(--aq-border)] p-2 text-[var(--aq-text-subtle)] transition-colors hover:border-red-400 hover:text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {[
                            { label: "Tipo", key: "tipo" },
                            { label: "Habilidade", key: "habilidade" },
                            { label: "Dano", key: "dano" },
                            { label: "Critico", key: "critico" },
                            { label: "Alcance", key: "alcance" },
                            { label: "Categoria", key: "categoria" }
                          ].map((field) => (
                            <div key={field.key}>
                              <div className="aq-kicker">{field.label}</div>
                              <input
                                value={String(arma[field.key] ?? "")}
                                onChange={(e) => updateItem("armas", arma.id, { [field.key]: e.target.value })}
                                className="aq-input mt-2"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 grid gap-4 xl:grid-cols-3">
                          {[
                            { label: "Descricao", key: "desc" },
                            { label: "Melhorias", key: "melhorias" },
                            { label: "Maldicoes", key: "maldicoes" }
                          ].map((field) => (
                            <div key={field.key}>
                              <div className="aq-kicker">{field.label}</div>
                              <textarea
                                value={arma[field.key] ?? ""}
                                onChange={(e) => updateItem("armas", arma.id, { [field.key]: e.target.value })}
                                className="aq-input mt-2 min-h-[110px] resize-y"
                              />
                            </div>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,6,11,0.82)] p-6 backdrop-blur-md">
          <div className="aq-panel max-h-[85vh] w-full max-w-3xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--aq-border)] px-5 py-4">
              <div>
                <div className="aq-kicker">{modalOpen === "armas" ? "Arsenal" : "Compendio"}</div>
                <h3 className={`mt-1 text-2xl font-black text-[var(--aq-title)] ${cinzel.className}`}>
                  {modalOpen === "armas" ? "Adicionar arma" : "Adicionar habilidade"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setModalOpen(null);
                  setSearchTerm("");
                }}
                className="rounded-full border border-[var(--aq-border)] p-2 text-[var(--aq-text-subtle)] transition-colors hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="border-b border-[var(--aq-border)] px-5 py-4">
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] px-4 py-3">
                <Search size={16} className="text-[var(--aq-accent)]" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filtrar por nome, descricao ou categoria..."
                  className="w-full bg-transparent text-sm text-[var(--aq-title)] outline-none placeholder:text-[var(--aq-text-subtle)]"
                />
              </div>
            </div>

            <div className="aq-scrollbar max-h-[58vh] space-y-3 overflow-y-auto p-5">
              {modalItems.length === 0 ? (
                <EmptyState message="Nenhum item encontrado para esse filtro." />
              ) : (
                modalItems.map((item: any) => (
                  <button
                    key={`${modalOpen}-${item.nome}-${item.dado ?? item.tipo ?? ""}`}
                    onClick={() => addCompendiumItem(item)}
                    className="w-full rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.65)] p-4 text-left transition-all hover:border-[var(--aq-border-strong)] hover:bg-[rgba(10,15,24,0.92)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-black text-[var(--aq-title)]">{item.nome}</span>
                          {item.dado ? <span className="aq-pill">{item.dado}</span> : null}
                          {item.tipo ? <span className="aq-pill aq-pill-muted">{item.tipo}</span> : null}
                          {item.categoriaNome ? <span className="aq-pill aq-pill-muted">{item.categoriaNome}</span> : null}
                        </div>
                        {item.desc ? <p className="mt-2 text-sm leading-relaxed text-[var(--aq-text)]">{item.desc}</p> : null}
                      </div>
                      <span className="aq-button-secondary shrink-0">Adicionar</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
