"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Cinzel, Inter } from "next/font/google";
import {
  ArrowLeft,
  Camera,
  ChevronRight,
  Dices,
  Minus,
  Plus,
  Search,
  Shield,
  Sparkles,
  Trash2,
  X,
  Zap
} from "lucide-react";
import { supabase } from "../../../src/lib/supabase";
import { PRESETS } from "../../../src/lib/constants";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const CUSTOM_OPTION = "__custom__";
const ATTRIBUTE_POOL = 4;
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
      descricao_visual: record?.dados?.descricao_visual ?? "",
      conceito: record?.dados?.conceito ?? "",
      setup_completed: Boolean(record?.dados?.setup_completed),
      setup_step: normalizeNumber(record?.dados?.setup_step, 0),
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

function getOptionDescription(option: any) {
  return option?.desc ?? option?.poder ?? "";
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
      ? [{
          id: `origem-${origem.nome}`,
          nome: origem.nome,
          dado: "Origem",
          desc: origem.poder ?? origem.desc ?? "Origem selecionada.",
          subcat: "Origem",
          fonte: ficha?.sistema_preset
        }]
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
      ? [{
          id: `raca-${raca.nome}`,
          nome: raca.nome,
          dado: "Raca",
          desc: raca.poder ?? raca.desc ?? "Raca selecionada.",
          subcat: "Raca",
          fonte: ficha?.sistema_preset
        }]
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
    deslocamento: ficha?.dados?.deslocamento ?? raca?.deslocamento ?? "9m"
  };
}

function EmptyState({ message }: { message: string }) {
  return <div className="aq-empty-state">{message}</div>;
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
        <button onClick={() => onChange(Math.max(0, value - 1))} className="px-3 text-lg font-black text-[var(--aq-text-subtle)] transition-colors hover:text-[var(--aq-accent)]">-</button>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-[rgba(10,15,24,0.95)]">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: fill }} />
        </div>
        <button onClick={() => onChange(Math.min(max, value + 1))} className="px-3 text-lg font-black text-[var(--aq-text-subtle)] transition-colors hover:text-[var(--aq-accent)]">+</button>
      </div>
    </div>
  );
}

function SelectionCard({
  title,
  description,
  meta,
  selected,
  onSelect
}: {
  title: string;
  description: string;
  meta?: string;
  selected?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`rounded-3xl border p-5 text-left transition-all ${selected ? "border-[var(--aq-accent)] bg-[rgba(74,217,217,0.08)]" : "border-[var(--aq-border)] bg-[rgba(5,10,16,0.64)] hover:border-[var(--aq-border-strong)]"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-black text-[var(--aq-title)]">{title}</h3>
          {meta ? <p className="mt-2 text-xs font-bold uppercase tracking-[0.22em] text-[var(--aq-accent)]">{meta}</p> : null}
        </div>
        <span className={selected ? "aq-button-primary" : "aq-button-secondary"}>Escolher</span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-[var(--aq-text)]">{description}</p>
    </button>
  );
}

function CompactPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] px-4 py-2">
      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--aq-accent)]">{label}</span>
      <div className="mt-1 text-sm font-bold text-[var(--aq-title)]">{value}</div>
    </div>
  );
}

function ChoiceChips({
  title,
  options,
  value,
  onToggle
}: {
  title: string;
  options: string[];
  value: string[];
  onToggle: (option: string) => void;
}) {
  return (
    <div>
      <div className="aq-kicker">{title}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={selected ? "aq-button-primary" : "aq-button-secondary"}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function parseList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinList(value: string[]) {
  return value.join(", ");
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
  const [wizardSearch, setWizardSearch] = useState("");
  const [editingBasics, setEditingBasics] = useState(false);
  const [showCalculations, setShowCalculations] = useState(false);

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
  const setupCompleted = Boolean(ficha?.dados?.setup_completed);
  const currentStep = normalizeNumber(ficha?.dados?.setup_step, 0);

  useEffect(() => {
    if (!ficha) return;
    if (!setupCompleted) return;

    const nextStatus = derived.status;
    const nextDefesa = derived.defesa;

    setFicha((current: any) => {
      const unchanged =
        current.dados.status.vida.max === nextStatus.vida.max &&
        current.dados.status.sanidade.max === nextStatus.sanidade.max &&
        current.dados.status.pe.max === nextStatus.pe.max &&
        current.dados.defesa.passiva === nextDefesa.passiva &&
        current.dados.defesa.bloqueio === nextDefesa.bloqueio &&
        current.dados.defesa.esquiva === nextDefesa.esquiva;

      if (unchanged) return current;

      return {
        ...current,
        dados: {
          ...current.dados,
          status: {
            vida: { ...nextStatus.vida, atual: Math.min(current.dados.status.vida.atual, nextStatus.vida.max) },
            sanidade: { ...nextStatus.sanidade, atual: Math.min(current.dados.status.sanidade.atual, nextStatus.sanidade.max) },
            pe: { ...nextStatus.pe, atual: Math.min(current.dados.status.pe.atual, nextStatus.pe.max) }
          },
          defesa: {
            ...current.dados.defesa,
            ...nextDefesa
          }
        }
      };
    });
  }, [derived, ficha, setupCompleted]);

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

  const classOptions = (sistema?.classes ?? []).map(getOptionName);
  const originOptions = (sistema?.origens ?? []).map(getOptionName);
  const raceOptions = (sistema?.racas ?? []).map(getOptionName);
  const labels =
    ficha?.sistema_preset === "dnd5e"
      ? {
          progresso: "Nivel",
          origem: "Antecedente",
          raca: "Raca",
          recurso: "Recursos",
          compendio: "Ferramentas de classe, magias e arsenal aberto",
          melhorias: "Propriedades",
          maldicoes: "Encantamentos"
        }
      : {
          progresso: "NEX",
          origem: "Origem",
          raca: "Linagem",
          recurso: "Pontos de Esforco",
          compendio: "Compendio paranormal e arsenal tatico",
          melhorias: "Modificacoes",
          maldicoes: "Maldicoes"
        };

  const setupDescriptions =
    ficha?.sistema_preset === "dnd5e"
      ? [
          "Distribua seus atributos base. Eles representam o eixo da sua ficha antes de equipamentos e detalhes finais.",
          "Escolha o antecedente que explica de onde o personagem veio e quais proficiências iniciais ele traz.",
          "Escolha a classe com base no papel do personagem, no dado de vida e no estilo de jogo.",
          "Feche raça, nome e conceito antes de ir para a ficha final compacta."
        ]
      : [
          "Todos os atributos começam em 1 e você recebe 4 pontos para distribuir. Pode reduzir um atributo a 0 para ganhar 1 ponto adicional.",
          "A origem mostra quem o agente era antes da Ordem e define perícias e poder de origem.",
          "A classe define o papel do investigador em campo e o eixo principal das regras da ficha.",
          "Feche nome, raça/linagem, deslocamento e conceito antes de ir para a ficha final."
        ];

  const remainingPoints =
    ATTRIBUTE_POOL - (Object.values(ficha?.dados?.atributos ?? DEFAULT_ATTRS).reduce((sum, value) => sum + normalizeNumber(value, 1), 0) - 5);

  const wizardStepItems = ["Atributos", labels.origem, "Classe", "Toques Finais"];

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
              melhorias: joinList(item.propriedades ?? []),
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
          }
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

  const apagarFicha = async () => {
    if (!id) return;
    if (!window.confirm("Tem certeza que deseja apagar esta ficha?")) return;
    const { error } = await supabase.from("fichas").delete().eq("id", id);
    if (error) {
      alert(`Falha ao apagar ficha: ${error.message}`);
      return;
    }
    router.push("/fichas");
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

  const setSetupStep = (step: number) => setFichaValue("setup_step", step);

  const adjustAttribute = (key: keyof typeof DEFAULT_ATTRS, delta: number) => {
    const currentValue = normalizeNumber(ficha?.dados?.atributos?.[key], 1);
    const nextValue = currentValue + delta;
    if (nextValue < 0 || nextValue > 3) return;
    const nextSpent = Object.entries(ficha?.dados?.atributos ?? DEFAULT_ATTRS).reduce((sum, [attrKey, attrValue]) => {
      if (attrKey === key) return sum + nextValue;
      return sum + normalizeNumber(attrValue, 1);
    }, 0);
    const nextRemaining = ATTRIBUTE_POOL - (nextSpent - 5);
    if (nextRemaining < 0) return;
    setFichaValue(`atributos.${key}`, nextValue);
  };

  const finishSetup = () => {
    setFicha((current: any) => ({
      ...current,
      dados: {
        ...current.dados,
        setup_completed: true,
        setup_step: 3
      }
    }));
  };

  const reopenSetup = () => {
    setFicha((current: any) => ({
      ...current,
      dados: {
        ...current.dados,
        setup_completed: false,
        setup_step: 0
      }
    }));
  };

  const toggleChoiceField = (itemId: number, key: "melhorias" | "maldicoes", option: string) => {
    const item = ficha?.dados?.armas?.find((arma: any) => arma.id === itemId);
    const list = parseList(item?.[key] ?? "");
    const next = list.includes(option) ? list.filter((entry) => entry !== option) : [...list, option];
    updateItem("armas", itemId, { [key]: joinList(next) });
  };

  const origemItems = useMemo(() => {
    const all = sistema?.origens ?? [];
    const query = wizardSearch.trim().toLowerCase();
    if (!query) return all;
    return all.filter((item: any) =>
      [item.nome, item.desc, item.poder].filter(Boolean).some((value) => String(value).toLowerCase().includes(query))
    );
  }, [sistema, wizardSearch]);

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

  if (!setupCompleted) {
    return (
      <main className={`aq-page min-h-screen pb-20 ${inter.className}`}>
        <div className="aq-orb aq-orb-cyan" />
        <div className="aq-orb aq-orb-indigo" />
        <div className="aq-shell px-6 py-10 md:px-8">
          <div className="mb-10 flex items-center gap-4">
            <button onClick={() => router.push("/fichas")} className="aq-button-secondary">
              <ArrowLeft size={14} />
              Voltar
            </button>
            <div className="flex flex-wrap items-center gap-4">
              {wizardStepItems.map((label, index) => (
                <button
                  key={label}
                  onClick={() => setSetupStep(index)}
                  className={`text-sm font-black uppercase tracking-[0.18em] ${currentStep === index ? "text-[var(--aq-accent)]" : "text-[var(--aq-title)]"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <section className="aq-panel p-8">
              <div className="aq-kicker">Criacao Guiada</div>
              <h1 className={`mt-4 text-4xl font-black text-[var(--aq-title)] ${cinzel.className}`}>{wizardStepItems[currentStep]}</h1>
              <p className="mt-6 text-lg leading-relaxed text-[var(--aq-text)]">{setupDescriptions[currentStep]}</p>

              {currentStep === 0 ? (
                <div className="mt-8 space-y-6">
                  <div className="rounded-3xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-5">
                    <div className="aq-kicker">Pontos restantes</div>
                    <div className="mt-2 text-4xl font-black text-[var(--aq-title)]">{remainingPoints}</div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {ATTRIBUTE_ORDER.map((attribute) => {
                      const value = ficha.dados.atributos[attribute.id] ?? 1;
                      return (
                        <div key={attribute.id} className="rounded-3xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-5">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="aq-kicker">{attribute.nome}</div>
                              <div className="mt-2 text-4xl font-black text-[var(--aq-title)]">{value}</div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <button onClick={() => adjustAttribute(attribute.id, 1)} className="aq-button-primary"><Plus size={14} /></button>
                              <button onClick={() => adjustAttribute(attribute.id, -1)} className="aq-button-secondary"><Minus size={14} /></button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {currentStep === 1 ? (
                <div className="mt-8 space-y-5">
                  <div className="flex items-center gap-3 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] px-4 py-3">
                    <Search size={16} className="text-[var(--aq-accent)]" />
                    <input
                      value={wizardSearch}
                      onChange={(e) => setWizardSearch(e.target.value)}
                      placeholder={`Buscar ${labels.origem.toLowerCase()}...`}
                      className="w-full bg-transparent text-[var(--aq-title)] outline-none"
                    />
                  </div>
                  <div className="aq-scrollbar max-h-[55vh] space-y-4 overflow-y-auto pr-2">
                    {origemItems.map((origem: any) => (
                      <SelectionCard
                        key={origem.nome}
                        title={origem.nome}
                        description={`${origem.desc ?? origem.poder ?? ""} ${origem.poder ? `Poder: ${origem.poder}.` : ""}`.trim()}
                        meta={`Pericias: ${(origem.proficiencias ?? []).join(", ") || "sem bonus"}`}
                        selected={ficha.dados.origem === origem.nome}
                        onSelect={() => setFichaValue("origem", origem.nome)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="mt-8 grid gap-4 xl:grid-cols-3">
                  {(sistema?.classes ?? []).map((classe: any) => (
                    <SelectionCard
                      key={getOptionName(classe)}
                      title={getOptionName(classe)}
                      description={getOptionDescription(classe)}
                      meta={`Vida base ${classe.vidaBase ?? "-"} • Recurso base ${classe.recursoBase ?? "-"}`}
                      selected={ficha.dados.classe === getOptionName(classe)}
                      onSelect={() => setFichaValue("classe", getOptionName(classe))}
                    />
                  ))}
                  {ficha.sistema_preset === "ordem_paranormal" ? (
                    <SelectionCard
                      title="Mundano"
                      description="Comece como alguém sem treino especializado. Você mantém a base da ficha e desenvolve o resto depois."
                      selected={ficha.dados.classe === "Mundano"}
                      onSelect={() => setFichaValue("classe", "Mundano")}
                    />
                  ) : null}
                </div>
              ) : null}

              {currentStep === 3 ? (
                <div className="mt-8 grid gap-4">
                  <div>
                    <div className="aq-kicker">Nome</div>
                    <input value={ficha.nome_personagem ?? ""} onChange={(e) => setFicha((current: any) => ({ ...current, nome_personagem: e.target.value }))} className="aq-input mt-2" />
                  </div>
                  <div>
                    <div className="aq-kicker">{labels.raca}</div>
                    <select value={ficha.dados.raca ?? ""} onChange={(e) => setFichaValue("raca", e.target.value)} className="aq-input mt-2">
                      <option value="">Selecione</option>
                      {raceOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="aq-kicker">Deslocamento</div>
                    <input value={ficha.dados.deslocamento ?? "9m"} onChange={(e) => setFichaValue("deslocamento", e.target.value)} className="aq-input mt-2" />
                  </div>
                  <div>
                    <div className="aq-kicker">Conceito</div>
                    <textarea value={ficha.dados.conceito ?? ""} onChange={(e) => setFichaValue("conceito", e.target.value)} className="aq-input mt-2 min-h-[120px] resize-y" />
                  </div>
                </div>
              ) : null}

              <div className="mt-10 flex items-center justify-between">
                <button disabled={currentStep === 0} onClick={() => setSetupStep(Math.max(0, currentStep - 1))} className="aq-button-secondary disabled:opacity-40">
                  Anterior
                </button>
                {currentStep < 3 ? (
                  <button onClick={() => setSetupStep(Math.min(3, currentStep + 1))} className="aq-button-primary">
                    Proximo
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <button onClick={finishSetup} className="aq-button-primary">
                    Ir para ficha final
                  </button>
                )}
              </div>
            </section>

            <section className="aq-panel flex items-center justify-center p-8">
              <div className="relative h-[360px] w-[360px]">
                <div className="absolute inset-0 rounded-full border border-[var(--aq-border)] opacity-60" />
                <div className="absolute inset-[40px] rounded-full border border-[rgba(74,217,217,0.18)]" />
                {ATTRIBUTE_ORDER.map((attribute) => (
                  <div
                    key={attribute.id}
                    className={`absolute ${attribute.pos} flex h-[92px] w-[92px] flex-col items-center justify-center rounded-full border border-[var(--aq-border-strong)] bg-[rgba(5,10,16,0.92)]`}
                  >
                    <div className="text-4xl font-black text-[var(--aq-title)]">{derived.attrs[attribute.id]}</div>
                    <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--aq-text-muted)]">{attribute.nome}</span>
                    <span className="text-sm font-black text-[var(--aq-accent)]">{attribute.label}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`aq-page overflow-y-auto pb-20 ${inter.className}`}>
      <div className="aq-orb aq-orb-cyan" />
      <div className="aq-orb aq-orb-indigo" />

      <header className="sticky top-0 z-40 border-b border-[var(--aq-border-strong)] bg-[rgba(5,10,16,0.86)] backdrop-blur-xl">
        <div className="aq-shell flex items-center justify-between gap-4 px-6 py-4 md:px-8">
          <button onClick={() => router.push("/fichas")} className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.28em] text-[var(--aq-accent)] transition-colors hover:text-white">
            <ArrowLeft size={14} />
            Voltar
          </button>
          <div className="flex items-center gap-3">
            <button onClick={reopenSetup} className="aq-button-secondary">
              Reabrir criacao
            </button>
            <button onClick={apagarFicha} className="rounded-full border border-red-500/40 bg-[rgba(127,29,29,0.25)] px-5 py-3 text-xs font-black uppercase tracking-[0.24em] text-red-300 transition-colors hover:bg-[rgba(127,29,29,0.4)] hover:text-white">
              <Trash2 size={14} className="mr-2 inline" />
              Apagar
            </button>
            <button onClick={salvarFicha} disabled={saving} className="aq-button-primary disabled:opacity-60">
              {saving ? "Sincronizando..." : "Sincronizar"}
            </button>
          </div>
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
                <div className="border-b border-[var(--aq-border)] pb-3">
                  <div className="aq-kicker">Personagem</div>
                  <input value={ficha.nome_personagem ?? ""} onChange={(e) => setFicha((current: any) => ({ ...current, nome_personagem: e.target.value }))} className={`mt-1 w-full bg-transparent text-2xl font-black text-[var(--aq-title)] outline-none ${cinzel.className}`} />
                </div>

                <div className="flex flex-wrap gap-3">
                  <CompactPill label="Sistema" value={ficha.sistema_preset === "dnd5e" ? "D&D 5e" : "Ordem Paranormal"} />
                  <CompactPill label={labels.origem} value={ficha.dados.origem || "Nao definido"} />
                  <CompactPill label="Classe" value={ficha.dados.classe || "Nao definida"} />
                  <CompactPill label={labels.raca} value={ficha.dados.raca || "Nao definida"} />
                </div>

                <button onClick={() => setEditingBasics((value) => !value)} className="aq-button-secondary">
                  {editingBasics ? "Fechar edicao" : "Editar base"}
                </button>

                {editingBasics ? (
                  <div className="grid gap-4">
                    <div>
                      <div className="aq-kicker">Sistema</div>
                      <select value={ficha.sistema_preset ?? "ordem_paranormal"} onChange={(e) => setFicha((current: any) => normalizeFicha({ ...current, sistema_preset: e.target.value }))} className="aq-input mt-2">
                        <option value="ordem_paranormal">Ordem Paranormal</option>
                        <option value="dnd5e">D&D 5e</option>
                      </select>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="aq-kicker">{labels.origem}</div>
                        <select value={ficha.dados.origem ?? ""} onChange={(e) => setFichaValue("origem", e.target.value)} className="aq-input mt-2">
                          <option value="">Selecione</option>
                          {originOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </div>
                      <div>
                        <div className="aq-kicker">Classe</div>
                        <select value={ficha.dados.classe ?? ""} onChange={(e) => setFichaValue("classe", e.target.value)} className="aq-input mt-2">
                          <option value="">Selecione</option>
                          {classOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="aq-kicker">{labels.raca}</div>
                        <select value={ficha.dados.raca ?? ""} onChange={(e) => setFichaValue("raca", e.target.value)} className="aq-input mt-2">
                          <option value="">Selecione</option>
                          {raceOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                        </select>
                      </div>
                      <div>
                        <div className="aq-kicker">Deslocamento</div>
                        <input value={ficha.dados.deslocamento ?? "9m"} onChange={(e) => setFichaValue("deslocamento", e.target.value)} className="aq-input mt-2" />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="aq-panel flex flex-col items-center p-6">
            <div className={`mb-6 text-center text-2xl font-black tracking-[0.24em] text-[var(--aq-title)] ${cinzel.className}`}>ATRIBUTOS</div>
            <div className="relative h-[320px] w-[320px]">
              <div className="absolute inset-0 rounded-full border border-[var(--aq-border)] opacity-60" />
              <div className="absolute inset-[40px] rounded-full border border-[rgba(74,217,217,0.18)]" />
              {ATTRIBUTE_ORDER.map((attribute) => (
                <div key={attribute.id} className={`absolute ${attribute.pos} flex h-[92px] w-[92px] flex-col items-center justify-center rounded-full border border-[var(--aq-border-strong)] bg-[rgba(5,10,16,0.92)] shadow-[0_0_24px_rgba(74,217,217,0.08)]`}>
                  <div className="text-4xl font-black text-[var(--aq-title)]">{derived.attrs[attribute.id]}</div>
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--aq-text-muted)]">{attribute.nome}</span>
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
                    onChange={(e) => ficha.sistema_preset === "dnd5e" ? setFichaValue("nivel", parseInt(e.target.value, 10) || 1) : setFichaValue("nex", parseInt(e.target.value, 10) || 0)}
                    className="w-16 bg-transparent text-2xl font-black text-[var(--aq-title)] outline-none"
                  />
                  <span className="text-lg font-black text-[var(--aq-text-muted)]">{ficha.sistema_preset === "dnd5e" ? "lv" : "%"}</span>
                </div>
              </div>
              <div>
                <div className="aq-kicker">Deslocamento</div>
                <input value={ficha.dados.deslocamento ?? "9m"} onChange={(e) => setFichaValue("deslocamento", e.target.value)} className="aq-input mt-2" />
              </div>
            </div>

            <StatBar label="Vida" value={ficha.dados.status.vida.atual} max={ficha.dados.status.vida.max} fill="linear-gradient(90deg, rgba(239,68,68,0.92), rgba(185,28,28,0.95))" onChange={(value) => setFichaValue("status.vida", { ...ficha.dados.status.vida, atual: value })} />
            <StatBar label="Sanidade" value={ficha.dados.status.sanidade.atual} max={ficha.dados.status.sanidade.max} fill="linear-gradient(90deg, rgba(139,92,246,0.92), rgba(59,130,246,0.92))" onChange={(value) => setFichaValue("status.sanidade", { ...ficha.dados.status.sanidade, atual: value })} />
            <StatBar label={labels.recurso} value={ficha.dados.status.pe.atual} max={ficha.dados.status.pe.max} fill="linear-gradient(90deg, rgba(74,217,217,0.92), rgba(30,107,107,0.95))" onChange={(value) => setFichaValue("status.pe", { ...ficha.dados.status.pe, atual: value })} />
          </div>
        </section>

        <section className="space-y-6 lg:col-span-7">
          <div className="aq-panel grid gap-4 p-5 md:grid-cols-[1.2fr_repeat(2,1fr)]">
            <div className="flex items-center gap-4 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.6)] p-4">
              <Shield className="text-[var(--aq-accent)]" />
              <div>
                <div className="aq-kicker">Defesa</div>
                <div className="mt-1 text-3xl font-black text-[var(--aq-title)]">{derived.defesa.passiva}</div>
                <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--aq-text-muted)]">Base 10 + AGI + bonus</div>
              </div>
            </div>
            <div>
              <div className="aq-kicker">Bonus Defesa</div>
              <input type="number" value={ficha.dados.defesa.bonus ?? 0} onChange={(e) => setFichaValue("defesa.bonus", parseInt(e.target.value, 10) || 0)} className="aq-input mt-2" />
            </div>
            <div className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.6)] p-4 text-sm text-[var(--aq-text-muted)]">
              <div className="mb-2 flex items-center gap-2 text-[var(--aq-accent)]">
                <Sparkles size={14} />
                <span className="aq-kicker">Defesa Funcional</span>
              </div>
              <div>Bloqueio: {derived.defesa.bloqueio}</div>
              <div>Esquiva: {derived.defesa.esquiva}</div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="aq-panel p-5">
              <div className="aq-kicker">Bonus Bloqueio</div>
              <input type="number" value={ficha.dados.defesa.bloqueio_bonus ?? 0} onChange={(e) => setFichaValue("defesa.bloqueio_bonus", parseInt(e.target.value, 10) || 0)} className="aq-input mt-2" />
            </div>
            <div className="aq-panel p-5">
              <div className="aq-kicker">Bonus Esquiva</div>
              <input type="number" value={ficha.dados.defesa.esquiva_bonus ?? 0} onChange={(e) => setFichaValue("defesa.esquiva_bonus", parseInt(e.target.value, 10) || 0)} className="aq-input mt-2" />
            </div>
          </div>

          <div className="aq-panel p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="aq-kicker">Calculos</div>
                <p className="mt-2 text-sm text-[var(--aq-text-muted)]">Deixei a ficha final menos poluida, mas voce pode abrir os calculos sempre que quiser.</p>
              </div>
              <button onClick={() => setShowCalculations((value) => !value)} className="aq-button-secondary">
                {showCalculations ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {showCalculations ? (
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <CompactPill label="Atributos finais" value={`FOR ${derived.attrs.forca} • AGI ${derived.attrs.agilidade} • VIG ${derived.attrs.vigor} • INT ${derived.attrs.intelecto} • PRE ${derived.attrs.presenca}`} />
                <CompactPill label="Defesa" value={`10 + AGI ${derived.attrs.agilidade} + bonus ${ficha.dados.defesa.bonus ?? 0} = ${derived.defesa.passiva}`} />
                <CompactPill label="Bloqueio" value={`VIG ${derived.attrs.vigor} + FOR ${derived.attrs.forca} + bonus ${ficha.dados.defesa.bloqueio_bonus ?? 0} = ${derived.defesa.bloqueio}`} />
                <CompactPill label="Esquiva" value={`AGI ${derived.attrs.agilidade} + bonus ${ficha.dados.defesa.esquiva_bonus ?? 0} = ${derived.defesa.esquiva}`} />
                <CompactPill label="Vida Max" value={String(derived.status.vida.max)} />
                <CompactPill label={labels.recurso} value={String(derived.status.pe.max)} />
                <CompactPill label="Sanidade Max" value={String(derived.status.sanidade.max)} />
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            {[{ id: "pericias", label: "Pericias" }, { id: "habilidades", label: "Habilidades" }, { id: "armas", label: "Inventario" }].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={activeTab === tab.id ? "aq-button-primary" : "aq-button-secondary"}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="aq-panel min-h-[560px] p-6">
            {activeTab === "pericias" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-2 px-3 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--aq-text-muted)]">
                  <div className="col-span-4">Pericia</div>
                  <div className="col-span-2 text-center">Atributo</div>
                  <div className="col-span-1 text-center">Auto</div>
                  <div className="col-span-1 text-center">Total</div>
                  <div className="col-span-2 text-center">Treino</div>
                  <div className="col-span-2 text-center">Outros</div>
                </div>
                <div className="aq-scrollbar max-h-[620px] space-y-2 overflow-y-auto pr-2">
                  {pericias.map((pericia: any) => {
                    const manual = ficha.dados.pericias?.[pericia.nome] ?? {};
                    const treino = normalizeNumber(manual.treino, 0);
                    const outros = normalizeNumber(manual.outros, 0);
                    const auto = normalizeNumber(derived.autoPericias[pericia.nome], 0);
                    const total = normalizeNumber(derived.attrs[pericia.atributo], 0) + treino + auto + outros;

                    return (
                      <div key={pericia.nome} className="grid grid-cols-12 items-center gap-2 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.6)] px-3 py-2">
                        <div className="col-span-4 flex items-center gap-3 text-sm font-bold text-[var(--aq-title)]">
                          <Dices size={14} className="text-[var(--aq-text-subtle)]" />
                          {pericia.nome}
                        </div>
                        <div className="col-span-2 text-center text-[11px] uppercase tracking-[0.2em] text-[var(--aq-text-muted)]">{pericia.atributo.slice(0, 3)}</div>
                        <div className="col-span-1 text-center text-sm font-black text-[var(--aq-accent)]">{auto}</div>
                        <div className="col-span-1 text-center text-sm font-black text-[var(--aq-title)]">{total}</div>
                        <div className="col-span-2 flex justify-center">
                          <input type="number" value={treino} onChange={(e) => setFichaValue(`pericias.${pericia.nome}.treino`, parseInt(e.target.value, 10) || 0)} className="aq-input w-14 text-center" />
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <input type="number" value={outros} onChange={(e) => setFichaValue(`pericias.${pericia.nome}.outros`, parseInt(e.target.value, 10) || 0)} className="aq-input w-14 text-center" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {activeTab === "habilidades" ? (
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
                              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--aq-text)]">{habilidade.desc || "Sem descricao adicional."}</p>
                            </div>
                            {!automatic ? (
                              <button onClick={() => removeItem("habilidades", habilidade.id)} className="rounded-full border border-[var(--aq-border)] p-2 text-[var(--aq-text-subtle)] transition-colors hover:border-red-400 hover:text-red-400">
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
            ) : null}

            {activeTab === "armas" ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className={`text-xl font-black text-[var(--aq-title)] ${cinzel.className}`}>Inventario</h2>
                    <p className="mt-1 text-sm text-[var(--aq-text-muted)]">Armas com opcoes do proprio sistema para nao ficar tudo manual.</p>
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
                              <input value={arma.nome} onChange={(e) => updateItem("armas", arma.id, { nome: e.target.value })} className={`bg-transparent text-xl font-black text-[var(--aq-title)] outline-none ${cinzel.className}`} />
                              <span className="aq-pill aq-pill-muted">{arma.tipo || "Equipamento"}</span>
                            </div>
                          </div>
                          <button onClick={() => removeItem("armas", arma.id)} className="rounded-full border border-[var(--aq-border)] p-2 text-[var(--aq-text-subtle)] transition-colors hover:border-red-400 hover:text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {[{ label: "Tipo", key: "tipo" }, { label: "Habilidade", key: "habilidade" }, { label: "Dano", key: "dano" }, { label: "Critico", key: "critico" }, { label: "Alcance", key: "alcance" }, { label: "Categoria", key: "categoria" }].map((field) => (
                            <div key={field.key}>
                              <div className="aq-kicker">{field.label}</div>
                              <input value={String(arma[field.key] ?? "")} onChange={(e) => updateItem("armas", arma.id, { [field.key]: e.target.value })} className="aq-input mt-2" />
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 grid gap-4 xl:grid-cols-3">
                          <div>
                            <div className="aq-kicker">Descricao</div>
                            <textarea value={arma.desc ?? ""} onChange={(e) => updateItem("armas", arma.id, { desc: e.target.value })} className="aq-input mt-2 min-h-[110px] resize-y" />
                          </div>
                          <div>
                            <ChoiceChips title={labels.melhorias} options={sistema?.modificacoes_arma ?? sistema?.propriedades_arma ?? []} value={parseList(arma.melhorias ?? "")} onToggle={(option) => toggleChoiceField(arma.id, "melhorias", option)} />
                            <textarea value={arma.melhorias ?? ""} onChange={(e) => updateItem("armas", arma.id, { melhorias: e.target.value })} className="aq-input mt-3 min-h-[90px] resize-y" />
                          </div>
                          <div>
                            <ChoiceChips title={labels.maldicoes} options={sistema?.maldicoes_arma ?? sistema?.encantamentos_arma ?? []} value={parseList(arma.maldicoes ?? "")} onToggle={(option) => toggleChoiceField(arma.id, "maldicoes", option)} />
                            <textarea value={arma.maldicoes ?? ""} onChange={(e) => updateItem("armas", arma.id, { maldicoes: e.target.value })} className="aq-input mt-3 min-h-[90px] resize-y" />
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </section>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,6,11,0.82)] p-6 backdrop-blur-md">
          <div className="aq-panel max-h-[85vh] w-full max-w-3xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--aq-border)] px-5 py-4">
              <div>
                <div className="aq-kicker">{modalOpen === "armas" ? "Arsenal" : "Compendio"}</div>
                <h3 className={`mt-1 text-2xl font-black text-[var(--aq-title)] ${cinzel.className}`}>{modalOpen === "armas" ? "Adicionar arma" : "Adicionar habilidade"}</h3>
              </div>
              <button onClick={() => { setModalOpen(null); setSearchTerm(""); }} className="rounded-full border border-[var(--aq-border)] p-2 text-[var(--aq-text-subtle)] transition-colors hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="border-b border-[var(--aq-border)] px-5 py-4">
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.72)] px-4 py-3">
                <Search size={16} className="text-[var(--aq-accent)]" />
                <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Filtrar por nome, descricao ou categoria..." className="w-full bg-transparent text-sm text-[var(--aq-title)] outline-none placeholder:text-[var(--aq-text-subtle)]" />
              </div>
            </div>

            <div className="aq-scrollbar max-h-[58vh] space-y-3 overflow-y-auto p-5">
              {modalItems.length === 0 ? (
                <EmptyState message="Nenhum item encontrado para esse filtro." />
              ) : (
                modalItems.map((item: any) => (
                  <button key={`${modalOpen}-${item.nome}-${item.dado ?? item.tipo ?? ""}`} onClick={() => addCompendiumItem(item)} className="w-full rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.65)] p-4 text-left transition-all hover:border-[var(--aq-border-strong)] hover:bg-[rgba(10,15,24,0.92)]">
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
