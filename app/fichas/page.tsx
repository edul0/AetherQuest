"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Cinzel, Inter } from "next/font/google";
import {
  ArrowLeft,
  Camera,
  Dice5,
  Dices,
  Plus,
  Search,
  Shield,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { PRESETS } from "../../../src/lib/constants";
import { supabase } from "../../../src/lib/supabase";
import { AttributeDefinition, AttributeMap, ChoiceOption, Skill, SystemPreset } from "../../../src/lib/types";
import IdentityBriefing from "../../../src/components/ficha/IdentityBriefing";
import WeaponModsEditor from "../../../src/components/ficha/WeaponModsEditor";
import ChoiceLibrary from "../../../src/components/ficha/ChoiceLibrary";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "700", "900"] });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const DEFAULT_ATTRIBUTE_LAYOUT: AttributeDefinition[] = [
  { id: "agilidade", label: "AGI", nome: "Agilidade" },
  { id: "intelecto", label: "INT", nome: "Intelecto" },
  { id: "vigor", label: "VIG", nome: "Vigor" },
  { id: "presenca", label: "PRE", nome: "Presenca" },
  { id: "forca", label: "FOR", nome: "Forca" },
];

const DEFAULT_ATTRS: AttributeMap = {
  forca: 1,
  agilidade: 1,
  destreza: 1,
  vigor: 1,
  intelecto: 1,
  presenca: 1,
  sabedoria: 1,
  carisma: 1,
};

const DEFAULT_STATUS = {
  vida: { atual: 10, max: 10 },
  sanidade: { atual: 10, max: 10 },
  pe: { atual: 10, max: 10 },
};

const DEFAULT_DEFESA = {
  passiva: 10,
  bloqueio: 0,
  esquiva: 0,
  outros: 0,
};

type ModalType = "habilidades" | "armas" | null;
type SelectionMenuType = "raca" | "origem" | "classe" | "trilha" | null;

function uid() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function rollDiceExpression(formula: string) {
  const matches = Array.from(formula.matchAll(/(\d+)d(\d+)/gi));
  const rolls: number[] = [];

  matches.forEach((match) => {
    const count = Number(match[1] ?? 0);
    const sides = Number(match[2] ?? 0);
    for (let index = 0; index < count; index += 1) {
      rolls.push(Math.floor(Math.random() * sides) + 1);
    }
  });

  return {
    total: rolls.reduce((sum, value) => sum + value, 0),
    rolls,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getPreset(presetId?: string): SystemPreset {
  return PRESETS[presetId as keyof typeof PRESETS] ?? PRESETS.ordem_paranormal;
}

function getChoiceByName(options: ChoiceOption[] = [], nome?: string) {
  return options.find((option) => option.nome === nome) ?? null;
}

function getChoiceLabel(nome?: string, customValue?: string) {
  return nome === "Personalizada" ? customValue || "Personalizada" : nome || "";
}

function getPathOptions(classOption: ChoiceOption | null) {
  return classOption?.caminhos ?? [];
}

function buildAutoSkillMap(
  preset: SystemPreset,
  race: ChoiceOption | null,
  origin: ChoiceOption | null,
  classOption: ChoiceOption | null,
  pathOption: ChoiceOption | null,
) {
  const treino = preset.proficienciaTreino ?? 2;
  const map: Record<string, number> = {};

  [race, origin, classOption, pathOption].forEach((option) => {
    (option?.proficiencias ?? []).forEach((skill) => {
      map[skill] = Math.max(map[skill] ?? 0, treino);
    });
  });

  return map;
}

function buildDerivedAbilities(
  preset: SystemPreset,
  race: ChoiceOption | null,
  origin: ChoiceOption | null,
  classOption: ChoiceOption | null,
  pathOption: ChoiceOption | null,
) {
  const automaticas: Array<Skill & { sourceType: string }> = [];

  if (origin?.poder) {
    automaticas.push({
      id: uid(),
      nome: origin.nome,
      desc: origin.poder,
      dado: "-",
      subcat: "Origem",
      fonte: preset.nome,
      sourceType: "origem",
    });
  }

  const raceLabel = getChoiceLabel(race?.nome, race?.custom ? race?.desc : "");
  if (race && race.tags?.length) {
    automaticas.push({
      id: uid(),
      nome: raceLabel,
      desc: race.tags.join(", "),
      dado: "-",
      subcat: "Raca",
      fonte: preset.nome,
      sourceType: "raca",
    });
  }

  const flatCatalog: Skill[] = (preset.categorias_hab ?? []).flatMap((category) => {
    const source = preset[category.id];
    return Array.isArray(source) ? source : [];
  });

  const className = getChoiceLabel(classOption?.nome, classOption?.desc);
  const classGroup = classOption?.grupo?.toLowerCase() ?? "";
  const raceName = getChoiceLabel(race?.nome, race?.desc);
  const pathName = getChoiceLabel(pathOption?.nome, pathOption?.desc);

  flatCatalog.forEach((entry) => {
    const subcat = entry.subcat?.toLowerCase() ?? "";
    if (className && subcat === className.toLowerCase()) {
      automaticas.push({ ...entry, id: uid(), sourceType: "classe" });
    }
    if (raceName && subcat === raceName.toLowerCase()) {
      automaticas.push({ ...entry, id: uid(), sourceType: "raca" });
    }
    if (pathName && subcat === pathName.toLowerCase()) {
      automaticas.push({ ...entry, id: uid(), sourceType: "caminho" });
    }
    if (classGroup && subcat === classGroup) {
      automaticas.push({ ...entry, id: uid(), sourceType: "classe" });
    }
  });

  return automaticas;
}

function normalizeFicha(record: any) {
  const preset = getPreset(record?.sistema_preset);
  const fallbackClass = preset.classes?.[0]?.nome ?? "";
  const fallbackRace = preset.racas?.[0]?.nome ?? "";
  const fallbackOrigin = preset.origens?.[0]?.nome ?? "";
  const progressMin = preset.progressMin ?? 1;

  const dados = {
    ...(record?.dados ?? {}),
    avatar_url: record?.dados?.avatar_url ?? record?.avatar_url ?? "",
    idade: record?.dados?.idade ?? "",
    altura: record?.dados?.altura ?? "",
    gostos: record?.dados?.gostos ?? "",
    habilidades: Array.isArray(record?.dados?.habilidades) ? record.dados.habilidades : [],
    armas: Array.isArray(record?.dados?.armas) ? record.dados.armas : [],
    rolagens_status: record?.dados?.rolagens_status ?? {},
    pericias: record?.dados?.pericias ?? {},
    defesa: {
      ...DEFAULT_DEFESA,
      ...(record?.dados?.defesa ?? {}),
    },
    atributos: {
      ...DEFAULT_ATTRS,
      ...(record?.dados?.atributos ?? {}),
    },
    status: {
      ...DEFAULT_STATUS,
      ...(record?.dados?.status ?? {}),
      vida: { ...DEFAULT_STATUS.vida, ...(record?.dados?.status?.vida ?? {}) },
      sanidade: { ...DEFAULT_STATUS.sanidade, ...(record?.dados?.status?.sanidade ?? {}) },
      pe: { ...DEFAULT_STATUS.pe, ...(record?.dados?.status?.pe ?? {}) },
    },
    classe: record?.dados?.classe ?? fallbackClass,
    classe_custom: record?.dados?.classe_custom ?? "",
    trilha: record?.dados?.trilha ?? preset.classes?.[0]?.caminhos?.[0]?.nome ?? "",
    trilha_custom: record?.dados?.trilha_custom ?? "",
    origem: record?.dados?.origem ?? fallbackOrigin,
    origem_custom: record?.dados?.origem_custom ?? "",
    raca: record?.dados?.raca ?? fallbackRace,
    raca_custom: record?.dados?.raca_custom ?? "",
    progressao: record?.dados?.progressao ?? record?.dados?.nex ?? progressMin,
    deslocamento: record?.dados?.deslocamento ?? preset.racas?.[0]?.deslocamento ?? "9m",
  };

  return {
    ...record,
    sistema_preset: record?.sistema_preset ?? "ordem_paranormal",
    dados,
  };
}

function StatBar({
  label,
  value,
  max,
  fill,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  fill: string;
  onChange: (next: { atual?: number; max?: number }) => void;
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
            onChange={(e) => onChange({ atual: parseInt(e.target.value, 10) || 0 })}
            className="w-12 bg-transparent text-right outline-none"
          />
          <span className="text-[var(--aq-text-subtle)]">/</span>
          <input
            type="number"
            value={max}
            onChange={(e) => onChange({ max: parseInt(e.target.value, 10) || 0 })}
            className="w-12 bg-transparent text-right outline-none text-[var(--aq-text)]"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-[var(--aq-border)] bg-[rgba(5,10,16,0.75)] px-2 py-1">
        <button
          onClick={() => onChange({ atual: Math.max(0, value - 1) })}
          className="px-3 text-lg font-black text-[var(--aq-text-subtle)] transition-colors hover:text-[var(--aq-accent)]"
        >
          -
        </button>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-[rgba(10,15,24,0.95)]">
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: fill }} />
        </div>
        <button
          onClick={() => onChange({ atual: Math.min(max, value + 1) })}
          className="px-3 text-lg font-black text-[var(--aq-text-subtle)] transition-colors hover:text-[var(--aq-accent)]"
        >
          +
        </button>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="aq-empty-state">{message}</div>;
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
  const [modalOpen, setModalOpen] = useState<ModalType>(null);
  const [selectionMenu, setSelectionMenu] = useState<SelectionMenuType>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [compendiumFilter, setCompendiumFilter] = useState("all");

  useEffect(() => {
    if (!id || id === "undefined") {
      setLoading(false);
      return;
    }

    const carregarFicha = async () => {
      try {
        const { data, error } = await supabase.from("fichas").select("*").eq("id", id).single();
        if (error) {
          throw error;
        }
        setFicha(normalizeFicha(data));
      } catch (error) {
        console.error("Erro ao carregar ficha:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarFicha();
  }, [id]);

  const preset = useMemo(() => getPreset(ficha?.sistema_preset), [ficha?.sistema_preset]);
  const progressLabel = preset.progressLabel ?? "Nivel";
  const progressMin = preset.progressMin ?? 1;
  const progressMax = preset.progressMax ?? 20;
  const progressStep = preset.progressStep ?? 1;
  const resourceLabels = preset.resourceLabels ?? {
    vida: "Vida",
    pe: "PE",
    sanidade: "Sanidade",
  };
  const attributeLayout = preset.attributeLayout ?? DEFAULT_ATTRIBUTE_LAYOUT;
  const hasStatusRolls = (preset.statusRolls ?? []).length > 0;

  const selectedRace = useMemo(() => getChoiceByName(preset.racas, ficha?.dados?.raca), [ficha?.dados?.raca, preset.racas]);
  const selectedOrigin = useMemo(() => getChoiceByName(preset.origens, ficha?.dados?.origem), [ficha?.dados?.origem, preset.origens]);
  const selectedClass = useMemo(() => getChoiceByName(preset.classes, ficha?.dados?.classe), [ficha?.dados?.classe, preset.classes]);
  const availablePaths = useMemo(() => getPathOptions(selectedClass), [selectedClass]);
  const selectedPath = useMemo(() => getChoiceByName(availablePaths, ficha?.dados?.trilha), [availablePaths, ficha?.dados?.trilha]);

  const baseAttributes = ficha?.dados?.atributos ?? DEFAULT_ATTRS;
  const racialBonuses = selectedRace?.atributos ?? {};
  const effectiveAttributes: AttributeMap = useMemo(() => ({
    forca: (baseAttributes.forca ?? 0) + (racialBonuses.forca ?? 0),
    agilidade: (baseAttributes.agilidade ?? 0) + (racialBonuses.agilidade ?? 0),
    destreza: (baseAttributes.destreza ?? 0) + (racialBonuses.destreza ?? 0),
    vigor: (baseAttributes.vigor ?? 0) + (racialBonuses.vigor ?? 0),
    intelecto: (baseAttributes.intelecto ?? 0) + (racialBonuses.intelecto ?? 0),
    presenca: (baseAttributes.presenca ?? 0) + (racialBonuses.presenca ?? 0),
    sabedoria: (baseAttributes.sabedoria ?? 0) + (racialBonuses.sabedoria ?? 0),
    carisma: (baseAttributes.carisma ?? 0) + (racialBonuses.carisma ?? 0),
  }), [baseAttributes, racialBonuses]);

  const autoSkillMap = useMemo(
    () => buildAutoSkillMap(preset, selectedRace, selectedOrigin, selectedClass, selectedPath),
    [preset, selectedRace, selectedOrigin, selectedClass, selectedPath],
  );
  const automaticAbilities = useMemo(
    () => buildDerivedAbilities(preset, selectedRace, selectedOrigin, selectedClass, selectedPath),
    [preset, selectedRace, selectedOrigin, selectedClass, selectedPath],
  );

  const habilidadeCatalogo = useMemo(() => {
    const allItems = (preset.categorias_hab ?? []).flatMap((category) => {
      const source = preset[category.id];
      return Array.isArray(source)
        ? source.map((item: any) => ({
            ...item,
            categoriaId: category.id,
            categoriaNome: category.nome,
          }))
        : [];
    });

    return allItems;
  }, [preset]);

  const availableCompendiumFilters = useMemo(() => {
    const values = new Set<string>(["all"]);
    habilidadeCatalogo.forEach((item: any) => {
      if (item.subcat) {
        values.add(item.subcat);
      }
      if (item.categoriaNome) {
        values.add(item.categoriaNome);
      }
    });
    return Array.from(values);
  }, [habilidadeCatalogo]);

  const modalItems = useMemo(() => {
    const source = modalOpen === "armas" ? preset.armas ?? [] : habilidadeCatalogo;
    const query = searchTerm.trim().toLowerCase();
    return source.filter((item: any) => {
      if (modalOpen === "habilidades" && compendiumFilter !== "all") {
        const subcat = item.subcat ?? item.categoriaNome ?? "";
        if (subcat !== compendiumFilter) {
          return false;
        }
      }

      if (!query) {
        return true;
      }

      return [item.nome, item.desc, item.tipo, item.subcat, item.categoriaNome]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [compendiumFilter, habilidadeCatalogo, modalOpen, preset.armas, searchTerm]);

  const selectionMenuConfig = useMemo(() => {
    switch (selectionMenu) {
      case "raca":
        return {
          title: "Racas",
          description: "Selecione a raca em um menu dedicado e veja os detalhes antes de aplicar.",
          items: preset.racas,
          selectedName: ficha?.dados?.raca,
          selectedCustom: ficha?.dados?.raca_custom,
          onApply: (item: ChoiceOption) =>
            setFicha((current: any) => ({ ...current, dados: { ...current.dados, raca: item.nome, raca_custom: item.custom ? current.dados.raca_custom : "" } })),
        };
      case "origem":
        return {
          title: "Origens",
          description: "Cada origem abre num menu proprio com descricao, poder e pericias.",
          items: preset.origens,
          selectedName: ficha?.dados?.origem,
          selectedCustom: ficha?.dados?.origem_custom,
          onApply: (item: ChoiceOption) =>
            setFicha((current: any) => ({ ...current, dados: { ...current.dados, origem: item.nome, origem_custom: item.custom ? current.dados.origem_custom : "" } })),
        };
      case "classe":
        return {
          title: "Classes",
          description: "Escolha a classe por menu dedicado para manter a ficha limpa.",
          items: preset.classes,
          selectedName: ficha?.dados?.classe,
          selectedCustom: ficha?.dados?.classe_custom,
          onApply: (item: ChoiceOption) =>
            setFicha((current: any) => ({ ...current, dados: { ...current.dados, classe: item.nome, classe_custom: item.custom ? current.dados.classe_custom : "" } })),
        };
      case "trilha":
        return {
          title: ficha?.sistema_preset === "ordem_paranormal" ? "Trilhas" : "Caminhos",
          description: "Abra apenas quando quiser escolher o caminho da classe atual.",
          items: availablePaths,
          selectedName: ficha?.dados?.trilha,
          selectedCustom: ficha?.dados?.trilha_custom,
          onApply: (item: ChoiceOption) =>
            setFicha((current: any) => ({ ...current, dados: { ...current.dados, trilha: item.nome, trilha_custom: item.custom ? current.dados.trilha_custom : "" } })),
        };
      default:
        return null;
    }
  }, [availablePaths, ficha?.dados?.classe, ficha?.dados?.classe_custom, ficha?.dados?.origem, ficha?.dados?.origem_custom, ficha?.dados?.raca, ficha?.dados?.raca_custom, ficha?.dados?.trilha, ficha?.dados?.trilha_custom, ficha?.sistema_preset, preset.classes, preset.origens, preset.racas, selectionMenu]);

  const setFichaValue = (path: string, value: any) => {
    setFicha((current: any) => {
      if (!current) {
        return current;
      }

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
        [collection]: current.dados[collection].map((item: any) => (item.id === itemId ? { ...item, ...patch } : item)),
      },
    }));
  };

  const removeItem = (collection: "habilidades" | "armas", itemId: number) => {
    setFicha((current: any) => ({
      ...current,
      dados: {
        ...current.dados,
        [collection]: current.dados[collection].filter((item: any) => item.id !== itemId),
      },
    }));
  };

  const createManualAbility = () => {
    setFicha((current: any) => ({
      ...current,
      dados: {
        ...current.dados,
        habilidades: [
          ...current.dados.habilidades,
          {
            id: uid(),
            nome: "Nova habilidade",
            dado: "",
            desc: "",
            subcat: "Manual",
            fonte: "Personalizada",
          },
        ],
      },
    }));
  };

  const createCustomWeapon = () => {
    setFicha((current: any) => ({
      ...current,
      dados: {
        ...current.dados,
        armas: [
          ...current.dados.armas,
          {
            id: uid(),
            nome: "Arma personalizada",
            tipo: "Custom",
            habilidade: "forca",
            dano: "1d6",
            critico: "20",
            alcance: "Adjacente",
            categoria: 0,
            desc: "",
            melhorias: "",
            maldicoes: "",
            notas: "",
          },
        ],
      },
    }));
  };

  const handleSystemChange = (nextPresetId: string) => {
    const nextPreset = getPreset(nextPresetId);
    const nextRace = nextPreset.racas?.[0]?.nome ?? "";
    const nextOrigin = nextPreset.origens?.[0]?.nome ?? "";
    const nextClass = nextPreset.classes?.[0]?.nome ?? "";
    const nextPath = nextPreset.classes?.[0]?.caminhos?.[0]?.nome ?? "";

    setFicha((current: any) =>
      normalizeFicha({
        ...current,
        sistema_preset: nextPresetId,
        dados: {
          ...current.dados,
          raca: nextRace,
          raca_custom: "",
          origem: nextOrigin,
          origem_custom: "",
          classe: nextClass,
          classe_custom: "",
          trilha: nextPath,
          trilha_custom: "",
          progressao: nextPreset.progressMin ?? 1,
          nex: nextPreset.progressMin ?? 1,
          deslocamento: nextPreset.racas?.[0]?.deslocamento ?? current?.dados?.deslocamento ?? "9m",
        },
      }),
    );
    setCompendiumFilter("all");
  };

  const addCompendiumItem = (item: any) => {
    if (modalOpen === "armas") {
      const novaArma = {
        id: uid(),
        nome: item.nome,
        tipo: item.tipo ?? "Equipamento",
        habilidade: item.habilidade ?? "forca",
        dano: item.dano ?? "1d6",
        critico: item.critico ?? "20",
        alcance: item.alcance ?? "Adjacente",
        categoria: item.categoria ?? 0,
        desc: item.desc ?? "",
        melhorias: "",
        maldicoes: "",
        notas: "",
      };

      setFicha((current: any) => ({
        ...current,
        dados: {
          ...current.dados,
          armas: [...current.dados.armas, novaArma],
        },
      }));
    } else {
      const novaHabilidade = {
        id: uid(),
        nome: item.nome,
        dado: item.dado ?? "",
        desc: item.desc ?? "",
        subcat: item.subcat ?? item.categoriaNome ?? "",
        fonte: item.fonte ?? preset.nome,
      };

      setFicha((current: any) => ({
        ...current,
        dados: {
          ...current.dados,
          habilidades: [...current.dados.habilidades, novaHabilidade],
        },
      }));
    }

    setModalOpen(null);
    setSearchTerm("");
    setCompendiumFilter("all");
  };

  useEffect(() => {
    if (!ficha) {
      return;
    }

    const defaultPath = selectedClass?.caminhos?.[0]?.nome ?? "";
    const hasCurrentPath = ficha.dados.trilha && availablePaths.some((option) => option.nome === ficha.dados.trilha);
    if (availablePaths.length > 0 && !hasCurrentPath) {
      setFicha((current: any) => ({
        ...current,
        dados: {
          ...current.dados,
          trilha: defaultPath,
          trilha_custom: "",
        },
      }));
    }
    if (availablePaths.length === 0 && ficha.dados.trilha) {
      setFicha((current: any) => ({
        ...current,
        dados: {
          ...current.dados,
          trilha: "",
          trilha_custom: "",
        },
      }));
    }
  }, [availablePaths, ficha, selectedClass]);

  useEffect(() => {
    if (!ficha) {
      return;
    }

    const progressValue = clamp(Number(ficha.dados.progressao ?? progressMin), progressMin, progressMax);
    const levelUnits = Math.max(1, Math.floor(progressValue / progressStep));
    const classConfig = selectedClass;
    const defenseExtra = Number(ficha.dados.defesa?.outros ?? 0);

    const rollMap = ficha.dados.rolagens_status ?? {};
    const nextVidaMax = hasStatusRolls
      ? Math.max(
          1,
          Number(preset.statusRolls?.find((entry) => entry.key === "vida")?.base ?? 0) +
            Number(rollMap.vida ?? 0) +
            Number(effectiveAttributes[preset.statusRolls?.find((entry) => entry.key === "vida")?.atributo ?? "vigor"] ?? 0),
        )
      : Math.max(
          1,
          Number(classConfig?.vidaBase ?? 10) +
            Math.max(0, levelUnits - 1) * Number(classConfig?.vidaPorNivel ?? 0) +
            effectiveAttributes.vigor * 2,
        );
    const nextPeMax = hasStatusRolls
      ? Math.max(
          0,
          Number(preset.statusRolls?.find((entry) => entry.key === "pe")?.base ?? 0) +
            Number(rollMap.pe ?? 0) +
            Number(effectiveAttributes[preset.statusRolls?.find((entry) => entry.key === "pe")?.atributo ?? "forca"] ?? 0),
        )
      : Math.max(
          0,
          Number(classConfig?.peBase ?? 0) +
            Math.max(0, levelUnits - 1) * Number(classConfig?.pePorNivel ?? 0) +
            effectiveAttributes.presenca,
        );
    const nextSanidadeMax = hasStatusRolls
      ? Math.max(
          0,
          Number(preset.statusRolls?.find((entry) => entry.key === "sanidade")?.base ?? 0) +
            Number(rollMap.sanidade ?? 0) +
            Number(effectiveAttributes[preset.statusRolls?.find((entry) => entry.key === "sanidade")?.atributo ?? "sabedoria"] ?? 0),
        )
      : Math.max(
          0,
          Number(classConfig?.sanidadeBase ?? 10) +
            Math.max(0, levelUnits - 1) * Number(classConfig?.sanidadePorNivel ?? 0) +
            effectiveAttributes.presenca,
        );

    const defesaBase = ficha.sistema_preset === "memorias_postumas" ? effectiveAttributes.destreza : effectiveAttributes.agilidade;
    const nextDefesaPassiva = 10 + defesaBase + Number(classConfig?.defesaBonus ?? 0) + defenseExtra;
    const nextBloqueio = Math.max(0, effectiveAttributes.vigor + Math.floor(Number(classConfig?.defesaBonus ?? 0) / 2));
    const nextEsquiva = Math.max(0, defesaBase + Number(classConfig?.defesaBonus ?? 0));
    const nextDeslocamento = selectedRace?.deslocamento || ficha.dados.deslocamento || "9m";

    setFicha((current: any) => {
      const currentDados = current.dados;
      const currentVida = currentDados.status.vida;
      const currentPe = currentDados.status.pe;
      const currentSanidade = currentDados.status.sanidade;
      const same =
        currentDados.progressao === progressValue &&
        currentDados.nex === progressValue &&
        currentVida.max === nextVidaMax &&
        currentPe.max === nextPeMax &&
        currentSanidade.max === nextSanidadeMax &&
        currentDados.defesa.passiva === nextDefesaPassiva &&
        currentDados.defesa.bloqueio === nextBloqueio &&
        currentDados.defesa.esquiva === nextEsquiva &&
        currentDados.deslocamento === nextDeslocamento;

      if (same) {
        return current;
      }

      return {
        ...current,
        dados: {
          ...currentDados,
          progressao: progressValue,
          nex: progressValue,
          deslocamento: nextDeslocamento,
          status: {
            ...currentDados.status,
            vida: {
              atual: clamp(currentVida.atual, 0, nextVidaMax),
              max: nextVidaMax,
            },
            pe: {
              atual: clamp(currentPe.atual, 0, nextPeMax),
              max: nextPeMax,
            },
            sanidade: {
              atual: clamp(currentSanidade.atual, 0, nextSanidadeMax),
              max: nextSanidadeMax,
            },
          },
          defesa: {
            ...currentDados.defesa,
            passiva: nextDefesaPassiva,
            bloqueio: nextBloqueio,
            esquiva: nextEsquiva,
          },
        },
      };
    });
  }, [effectiveAttributes, ficha, hasStatusRolls, preset.statusRolls, progressMax, progressMin, progressStep, selectedClass, selectedRace]);

  const salvarFicha = async () => {
    if (!id || !ficha) {
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nome_personagem: ficha.nome_personagem,
        avatar_url: ficha.dados.avatar_url || null,
        sistema_preset: ficha.sistema_preset,
        dados: ficha.dados,
      };

      const { error } = await supabase.from("fichas").update(payload).eq("id", id);
      if (error) {
        throw error;
      }
      alert("Ficha sincronizada com a mesa.");
    } catch (error: any) {
      alert(`Falha ao salvar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const deletarFicha = async () => {
    if (!id) {
      return;
    }

    const confirmDelete = window.confirm("Deseja excluir esta ficha permanentemente?");
    if (!confirmDelete) {
      return;
    }

    try {
      const { error } = await supabase.from("fichas").delete().eq("id", id);
      if (error) {
        throw error;
      }
      router.push("/fichas");
    } catch (error: any) {
      alert(`Falha ao excluir: ${error.message}`);
    }
  };

  const rolarStatusBase = (key: "vida" | "sanidade" | "pe") => {
    const rollConfig = (preset.statusRolls ?? []).find((entry) => entry.key === key);
    if (!rollConfig) {
      return;
    }

    const result = rollDiceExpression(rollConfig.formula);
    setFichaValue(`rolagens_status.${key}`, result.total);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) {
      return;
    }

    setUploading(true);
    try {
      const path = `retratos/${id}-${Date.now()}.png`;
      const { error } = await supabase.storage.from("avatares").upload(path, file, { upsert: true });
      if (error) {
        throw error;
      }

      const { data } = supabase.storage.from("avatares").getPublicUrl(path);
      const publicUrl = data.publicUrl;
      setFicha((current: any) => ({
        ...current,
        avatar_url: publicUrl,
        dados: { ...current.dados, avatar_url: publicUrl },
      }));
    } catch (error: any) {
      alert(`Falha no upload: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  if (!id || id === "undefined") {
    return (
      <div className="aq-page flex items-center justify-center">
        <div className="aq-panel px-8 py-10 text-center text-red-400">ID invalido na URL.</div>
      </div>
    );
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
    return (
      <div className="aq-page flex items-center justify-center">
        <div className="aq-panel px-8 py-10 text-center text-red-400">Registro de ficha nao localizado.</div>
      </div>
    );
  }

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
            Voltar ao Omnis
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={deletarFicha}
              className="rounded-full border border-red-500/30 p-3 text-red-300 transition-colors hover:border-red-400 hover:text-red-200"
              title="Excluir ficha"
            >
              <Trash2 size={14} />
            </button>
            <button onClick={salvarFicha} disabled={saving} className="aq-button-primary disabled:opacity-60">
              {saving ? "Sincronizando..." : "Sincronizar"}
            </button>
          </div>
        </div>
      </header>

      <div className="aq-shell mt-8 space-y-8 px-6 md:px-8">
        <IdentityBriefing
          title="Origem da Ficha"
          subtitle="Escolha o sistema, depois feche a identidade base do personagem com raca, origem, classe e caminho. A ficha e a mesa leem esse bloco como o nucleo do personagem, entao tudo daqui precisa estar claro e coerente."
          tags={[
            preset.nome,
            selectedRace ? getChoiceLabel(selectedRace.nome, ficha.dados.raca_custom) : "",
            selectedOrigin ? getChoiceLabel(selectedOrigin.nome, ficha.dados.origem_custom) : "",
            selectedClass ? getChoiceLabel(selectedClass.nome, ficha.dados.classe_custom) : "",
            selectedPath ? getChoiceLabel(selectedPath.nome, ficha.dados.trilha_custom) : "",
          ]}
          details={[
            { label: "Sistema", value: preset.nome },
            { label: "Raca / Linhagem", value: selectedRace ? getChoiceLabel(selectedRace.nome, ficha.dados.raca_custom) : "" },
            { label: "Origem", value: selectedOrigin ? getChoiceLabel(selectedOrigin.nome, ficha.dados.origem_custom) : "" },
            { label: "Classe / Trilha", value: selectedPath ? getChoiceLabel(selectedPath.nome, ficha.dados.trilha_custom) : selectedClass ? getChoiceLabel(selectedClass.nome, ficha.dados.classe_custom) : "" },
          ]}
        />

        <div className="grid gap-8 lg:grid-cols-12">
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="aq-kicker">Idade</div>
                    <input value={ficha.dados.idade ?? ""} onChange={(e) => setFichaValue("idade", e.target.value)} className="aq-input mt-2" />
                  </div>
                  <div>
                    <div className="aq-kicker">Altura</div>
                    <input value={ficha.dados.altura ?? ""} onChange={(e) => setFichaValue("altura", e.target.value)} className="aq-input mt-2" />
                  </div>
                  <div className="sm:col-span-2">
                    <div className="aq-kicker">Gostos / Observacoes</div>
                    <input value={ficha.dados.gostos ?? ""} onChange={(e) => setFichaValue("gostos", e.target.value)} className="aq-input mt-2" />
                  </div>
                  <div>
                    <div className="aq-kicker">Sistema</div>
                    <select
                      value={ficha.sistema_preset}
                      onChange={(e) => handleSystemChange(e.target.value)}
                      className="aq-input mt-2"
                    >
                      {Object.entries(PRESETS).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="aq-kicker">{progressLabel}</div>
                    <input
                      type="number"
                      min={progressMin}
                      max={progressMax}
                      step={progressStep}
                      value={ficha.dados.progressao}
                      onChange={(e) => setFichaValue("progressao", parseInt(e.target.value, 10) || progressMin)}
                      className="aq-input mt-2"
                    />
                  </div>
                  <div>
                    <div className="aq-kicker">Raca / Linhagem</div>
                    <select
                      value={ficha.dados.raca}
                      onChange={(e) => setFichaValue("raca", e.target.value)}
                      className="aq-input mt-2"
                    >
                      {preset.racas.map((option) => (
                        <option key={option.nome} value={option.nome}>
                          {option.nome}
                        </option>
                      ))}
                    </select>
                    {selectedRace?.custom ? (
                      <input
                        value={ficha.dados.raca_custom ?? ""}
                        onChange={(e) => setFichaValue("raca_custom", e.target.value)}
                        placeholder="Defina a raca personalizada"
                        className="aq-input mt-2"
                      />
                    ) : null}
                  </div>
                  <div>
                    <div className="aq-kicker">Origem</div>
                    <select
                      value={ficha.dados.origem}
                      onChange={(e) => setFichaValue("origem", e.target.value)}
                      className="aq-input mt-2"
                    >
                      {preset.origens.map((option) => (
                        <option key={option.nome} value={option.nome}>
                          {option.nome}
                        </option>
                      ))}
                    </select>
                    {selectedOrigin?.custom ? (
                      <input
                        value={ficha.dados.origem_custom ?? ""}
                        onChange={(e) => setFichaValue("origem_custom", e.target.value)}
                        placeholder="Defina a origem personalizada"
                        className="aq-input mt-2"
                      />
                    ) : null}
                  </div>
                  <div className="sm:col-span-2">
                    <div className="aq-kicker">Classe / Trilha</div>
                    <select
                      value={ficha.dados.classe}
                      onChange={(e) => setFichaValue("classe", e.target.value)}
                      className="aq-input mt-2"
                    >
                      {preset.classes.map((option) => (
                        <option key={option.nome} value={option.nome}>
                          {option.nome}
                        </option>
                      ))}
                    </select>
                    {selectedClass?.custom ? (
                      <input
                        value={ficha.dados.classe_custom ?? ""}
                        onChange={(e) => setFichaValue("classe_custom", e.target.value)}
                        placeholder="Defina a classe personalizada"
                        className="aq-input mt-2"
                      />
                    ) : null}
                  </div>
                  {availablePaths.length > 0 ? (
                    <div className="sm:col-span-2">
                      <div className="aq-kicker">{ficha.sistema_preset === "ordem_paranormal" ? "Trilha" : "Caminho / Arquétipo"}</div>
                      <select
                        value={ficha.dados.trilha ?? ""}
                        onChange={(e) => setFichaValue("trilha", e.target.value)}
                        className="aq-input mt-2"
                      >
                        {availablePaths.map((option) => (
                          <option key={option.nome} value={option.nome}>
                            {option.nome}
                          </option>
                        ))}
                      </select>
                      {selectedPath?.custom ? (
                        <input
                          value={ficha.dados.trilha_custom ?? ""}
                          onChange={(e) => setFichaValue("trilha_custom", e.target.value)}
                          placeholder="Defina o caminho personalizado"
                          className="aq-input mt-2"
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="aq-pill aq-pill-muted">{preset.nome}</span>
                    {selectedClass ? <span className="aq-pill">{getChoiceLabel(selectedClass.nome, ficha.dados.classe_custom)}</span> : null}
                    {selectedPath ? <span className="aq-pill">{getChoiceLabel(selectedPath.nome, ficha.dados.trilha_custom)}</span> : null}
                    {selectedOrigin ? <span className="aq-pill aq-pill-muted">{getChoiceLabel(selectedOrigin.nome, ficha.dados.origem_custom)}</span> : null}
                    {selectedRace ? <span className="aq-pill aq-pill-muted">{getChoiceLabel(selectedRace.nome, ficha.dados.raca_custom)}</span> : null}
                  </div>
                  {(selectedOrigin?.poder || selectedRace?.desc || selectedClass?.desc || selectedPath?.desc) ? (
                    <div className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-4 text-sm text-[var(--aq-text)]">
                      {selectedOrigin?.poder ? <p><strong className="text-[var(--aq-title)]">Origem:</strong> {selectedOrigin.poder}</p> : null}
                      {selectedRace?.desc ? <p className="mt-2"><strong className="text-[var(--aq-title)]">Raca:</strong> {selectedRace.desc}</p> : null}
                      {selectedClass?.desc ? <p className="mt-2"><strong className="text-[var(--aq-title)]">Classe:</strong> {selectedClass.desc}</p> : null}
                      {selectedPath?.desc ? <p className="mt-2"><strong className="text-[var(--aq-title)]">Caminho:</strong> {selectedPath.desc}</p> : null}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-4">
                  <ChoiceLibrary
                    title="Racas"
                    description="Abra cada raca para ver bonus, pericias e descricao antes de aplicar na ficha."
                    items={preset.racas}
                    selectedName={ficha.dados.raca}
                    selectedCustom={ficha.dados.raca_custom}
                    onApply={(item) => setFicha((current: any) => ({ ...current, dados: { ...current.dados, raca: item.nome, raca_custom: item.custom ? current.dados.raca_custom : "" } }))}
                  />
                  <ChoiceLibrary
                    title="Origens"
                    description="Veja o que cada origem concede e aplique direto quando decidir."
                    items={preset.origens}
                    selectedName={ficha.dados.origem}
                    selectedCustom={ficha.dados.origem_custom}
                    onApply={(item) => setFicha((current: any) => ({ ...current, dados: { ...current.dados, origem: item.nome, origem_custom: item.custom ? current.dados.origem_custom : "" } }))}
                  />
                  <ChoiceLibrary
                    title="Classes"
                    description="Cada classe mostra a proposta e seus beneficios centrais antes de entrar na ficha."
                    items={preset.classes}
                    selectedName={ficha.dados.classe}
                    selectedCustom={ficha.dados.classe_custom}
                    onApply={(item) => setFicha((current: any) => ({ ...current, dados: { ...current.dados, classe: item.nome, classe_custom: item.custom ? current.dados.classe_custom : "" } }))}
                  />
                  {availablePaths.length > 0 ? (
                    <ChoiceLibrary
                      title={ficha.sistema_preset === "ordem_paranormal" ? "Trilhas" : "Caminhos"}
                      description="Abra os caminhos para comparar e adicionar o que melhor encaixa no personagem."
                      items={availablePaths}
                      selectedName={ficha.dados.trilha}
                      selectedCustom={ficha.dados.trilha_custom}
                      onApply={(item) => setFicha((current: any) => ({ ...current, dados: { ...current.dados, trilha: item.nome, trilha_custom: item.custom ? current.dados.trilha_custom : "" } }))}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="aq-panel flex flex-col items-center p-6">
            <div className={`mb-6 text-center text-2xl font-black tracking-[0.24em] text-[var(--aq-title)] ${cinzel.className}`}>
              ATRIBUTOS
            </div>
            {preset.attributeAssignmentText ? (
              <p className="mb-5 text-center text-sm leading-relaxed text-[var(--aq-text-muted)]">{preset.attributeAssignmentText}</p>
            ) : null}
            <div className={`grid w-full gap-4 ${attributeLayout.length > 5 ? "md:grid-cols-3" : "md:grid-cols-5"}`}>
              {attributeLayout.map((attribute) => {
                const bonus = racialBonuses[attribute.id as keyof AttributeMap] ?? 0;
                return (
                  <div
                    key={attribute.id}
                    className="flex min-h-[120px] flex-col items-center justify-center rounded-3xl border border-[var(--aq-border-strong)] bg-[rgba(5,10,16,0.92)] p-4 text-center shadow-[0_0_24px_rgba(74,217,217,0.08)]"
                  >
                    <input
                      type="number"
                      value={baseAttributes[attribute.id as keyof AttributeMap] ?? 0}
                      onChange={(e) => setFichaValue(`atributos.${attribute.id}`, parseInt(e.target.value, 10) || 0)}
                      className="w-14 bg-transparent text-center text-4xl font-black text-[var(--aq-title)] outline-none"
                    />
                    <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--aq-text-muted)]">
                      {attribute.nome}
                    </span>
                    <div className="flex items-center gap-1 text-sm font-black text-[var(--aq-accent)]">
                      <span>{attribute.label}</span>
                      {bonus ? <span className="text-[10px] text-[var(--aq-title)]">+{bonus}</span> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="aq-panel space-y-5 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="aq-kicker">Deslocamento</div>
                <input value={ficha.dados.deslocamento ?? "9m"} onChange={(e) => setFichaValue("deslocamento", e.target.value)} className="aq-input mt-2" />
              </div>
              <div>
                <div className="aq-kicker">Defesa Extra</div>
                <input
                  type="number"
                  value={ficha.dados.defesa.outros ?? 0}
                  onChange={(e) => setFichaValue("defesa.outros", parseInt(e.target.value, 10) || 0)}
                  className="aq-input mt-2"
                />
              </div>
            </div>

            <StatBar
              label={resourceLabels.vida}
              value={ficha.dados.status.vida.atual}
              max={ficha.dados.status.vida.max}
              fill="linear-gradient(90deg, rgba(239,68,68,0.92), rgba(185,28,28,0.95))"
              onChange={(next) => setFichaValue("status.vida", { ...ficha.dados.status.vida, ...next })}
            />
            <StatBar
              label={resourceLabels.sanidade}
              value={ficha.dados.status.sanidade.atual}
              max={ficha.dados.status.sanidade.max}
              fill="linear-gradient(90deg, rgba(59,130,246,0.92), rgba(74,217,217,0.92))"
              onChange={(next) => setFichaValue("status.sanidade", { ...ficha.dados.status.sanidade, ...next })}
            />
            <StatBar
              label={resourceLabels.pe}
              value={ficha.dados.status.pe.atual}
              max={ficha.dados.status.pe.max}
              fill="linear-gradient(90deg, rgba(74,217,217,0.92), rgba(30,107,107,0.95))"
              onChange={(next) => setFichaValue("status.pe", { ...ficha.dados.status.pe, ...next })}
            />

            {hasStatusRolls ? (
              <div className="grid gap-3 border-t border-[var(--aq-border)] pt-4">
                <div className="aq-kicker">Rolagens Base dos Status</div>
                {(preset.statusRolls ?? []).map((roll) => (
                  <div key={roll.key} className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.6)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-black text-[var(--aq-title)]">{roll.label}</div>
                        <div className="mt-1 text-xs text-[var(--aq-text-muted)]">{`${roll.formula} + ${roll.atributo}`}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="rounded-xl border border-[var(--aq-border)] bg-[rgba(10,15,24,0.86)] px-3 py-2 text-sm font-black text-[var(--aq-title)]">
                          +{effectiveAttributes[roll.atributo] ?? 0}
                        </div>
                        <input
                          type="number"
                          value={ficha.dados.rolagens_status?.[roll.key] ?? 0}
                          onChange={(e) => setFichaValue(`rolagens_status.${roll.key}`, parseInt(e.target.value, 10) || 0)}
                          className="aq-input w-24 text-center"
                        />
                        <button onClick={() => rolarStatusBase(roll.key)} className="aq-button-secondary !px-3 !py-2" title={`Rolar ${roll.formula}`}>
                          <Dice5 size={14} />
                        </button>
                      </div>
                    </div>
                    {roll.hint ? <p className="mt-2 text-xs text-[var(--aq-text-muted)]">{roll.hint}</p> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="space-y-6 lg:col-span-7">
          <div className="aq-panel grid gap-4 p-5 md:grid-cols-[1.2fr_repeat(3,1fr)]">
            <div className="flex items-center gap-4 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.6)] p-4">
              <Shield className="text-[var(--aq-accent)]" />
              <div>
                <div className="aq-kicker">Defesa</div>
                <div className="mt-1 text-3xl font-black text-[var(--aq-title)]">{ficha.dados.defesa.passiva ?? 10}</div>
              </div>
            </div>
            {[
              { label: "Bloqueio", value: ficha.dados.defesa.bloqueio ?? 0 },
              { label: "Esquiva", value: ficha.dados.defesa.esquiva ?? 0 },
              {
                label: "Atributos Efetivos",
                value:
                  ficha.sistema_preset === "memorias_postumas"
                    ? `${effectiveAttributes.destreza}/${effectiveAttributes.sabedoria}/${effectiveAttributes.vigor}`
                    : `${effectiveAttributes.agilidade}/${effectiveAttributes.vigor}`,
              },
            ].map((field) => (
              <div key={field.label} className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.6)] p-4">
                <div className="aq-kicker">{field.label}</div>
                <div className="mt-2 text-xl font-black text-[var(--aq-title)]">{field.value}</div>
              </div>
            ))}
          </div>

          {(preset.loreNotes ?? []).length > 0 ? (
            <div className="aq-panel space-y-4 p-5">
              <div className="aq-kicker">Regras do Sistema</div>
              <div className="grid gap-4 xl:grid-cols-2">
                {(preset.loreNotes ?? []).map((note) => (
                  <article key={note.titulo} className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.62)] p-4">
                    <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[var(--aq-title)]">{note.titulo}</h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--aq-text)]">{note.texto}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {[
              { id: "pericias", label: "Pericias" },
              { id: "habilidades", label: "Habilidades" },
              { id: "armas", label: "Inventario" },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} className={activeTab === tab.id ? "aq-button-primary" : "aq-button-secondary"}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="aq-panel min-h-[560px] p-6">
            {activeTab === "pericias" && (
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-2 px-3 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--aq-text-muted)]">
                  <div className="col-span-5">Pericia</div>
                  <div className="col-span-2 text-center">Atributo</div>
                  <div className="col-span-1 text-center">Total</div>
                  <div className="col-span-2 text-center">Treino</div>
                  <div className="col-span-2 text-center">Outros</div>
                </div>
                <div className="aq-scrollbar max-h-[600px] space-y-2 overflow-y-auto pr-2">
                  {(preset.pericias ?? []).map((pericia) => {
                    const treino = ficha.dados.pericias?.[pericia.nome]?.treino || 0;
                    const outros = ficha.dados.pericias?.[pericia.nome]?.outros || 0;
                    const auto = autoSkillMap[pericia.nome] || 0;
                    const atributo = pericia.atributo;
                    const atributoSecundario = pericia.atributoSecundario;
                    const total =
                      (effectiveAttributes[atributo] || 0) +
                      (atributoSecundario ? effectiveAttributes[atributoSecundario] || 0 : 0) +
                      treino +
                      outros +
                      auto;
                    const trained = treino > 0 || auto > 0;

                    return (
                      <div key={pericia.nome} className="grid grid-cols-12 items-center gap-2 rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.6)] px-3 py-2">
                        <div className={`col-span-5 flex items-center gap-3 text-sm font-bold ${trained ? "text-[var(--aq-accent)]" : "text-[var(--aq-title)]"}`}>
                          <Dices size={14} className={trained ? "text-[var(--aq-accent)]" : "text-[var(--aq-text-subtle)]"} />
                          <div>
                            <div>{pericia.nome}</div>
                            {auto ? <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--aq-text-muted)]">auto +{auto}</div> : null}
                          </div>
                        </div>
                        <div className="col-span-2 text-center text-[11px] uppercase tracking-[0.2em] text-[var(--aq-text-muted)]">
                          {atributoSecundario ? `${atributo.slice(0, 3)} + ${atributoSecundario.slice(0, 3)}` : atributo.slice(0, 3)}
                        </div>
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
                    <h2 className={`text-xl font-black text-[var(--aq-title)] ${cinzel.className}`}>Habilidades e Poderes</h2>
                    <p className="mt-1 text-sm text-[var(--aq-text-muted)]">As habilidades automaticas ficam separadas das habilidades adicionadas manualmente.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={createManualAbility} className="aq-button-secondary">
                      <Plus size={14} />
                      Criar Manual
                    </button>
                    <button onClick={() => setModalOpen("habilidades")} className="aq-button-primary">
                      <Plus size={14} />
                      Biblioteca
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="aq-kicker">Automaticas da Ficha</div>
                  {automaticAbilities.length === 0 ? (
                    <EmptyState message="Nenhuma habilidade automatica para a selecao atual." />
                  ) : (
                    <div className="space-y-3">
                      {automaticAbilities.map((habilidade) => (
                        <article key={habilidade.id} className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.65)] p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-black text-[var(--aq-title)]">{habilidade.nome}</h3>
                            {habilidade.dado ? <span className="aq-pill">{habilidade.dado}</span> : null}
                            {habilidade.subcat ? <span className="aq-pill aq-pill-muted">{habilidade.subcat}</span> : null}
                          </div>
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--aq-text)]">{habilidade.desc}</p>
                        </article>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="aq-kicker">Manuais / Extras</div>
                  {ficha.dados.habilidades.length === 0 ? (
                    <EmptyState message="Nenhuma habilidade manual registrada ainda." />
                  ) : (
                    <div className="aq-scrollbar max-h-[400px] space-y-3 overflow-y-auto pr-2">
                      {ficha.dados.habilidades.map((habilidade: any) => (
                        <article key={habilidade.id} className="rounded-2xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.65)] p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                {habilidade.subcat ? <span className="aq-pill aq-pill-muted">{habilidade.subcat}</span> : null}
                              </div>
                              <input
                                value={habilidade.nome}
                                onChange={(e) => updateItem("habilidades", habilidade.id, { nome: e.target.value })}
                                className="w-full bg-transparent text-base font-black text-[var(--aq-title)] outline-none"
                              />
                              <input
                                value={habilidade.subcat ?? ""}
                                onChange={(e) => updateItem("habilidades", habilidade.id, { subcat: e.target.value })}
                                placeholder="Categoria / trilha / origem"
                                className="aq-input mt-3"
                              />
                              <input
                                value={habilidade.dado ?? ""}
                                onChange={(e) => updateItem("habilidades", habilidade.id, { dado: e.target.value })}
                                placeholder="Custo / dado"
                                className="aq-input mt-3"
                              />
                              <textarea
                                value={habilidade.desc || ""}
                                onChange={(e) => updateItem("habilidades", habilidade.id, { desc: e.target.value })}
                                className="aq-input mt-3 min-h-[100px] resize-y"
                                placeholder="Descreva a habilidade manualmente"
                              />
                            </div>
                            <button
                              onClick={() => removeItem("habilidades", habilidade.id)}
                              className="rounded-full border border-[var(--aq-border)] p-2 text-[var(--aq-text-subtle)] transition-colors hover:border-red-400 hover:text-red-400"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "armas" && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className={`text-xl font-black text-[var(--aq-title)] ${cinzel.className}`}>Inventario Tatico</h2>
                    <p className="mt-1 text-sm text-[var(--aq-text-muted)]">Melhorias e maldicoes entram por menu rapido e continuam editaveis.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={createCustomWeapon} className="aq-button-secondary">
                      <Plus size={14} />
                      Arma Manual
                    </button>
                    <button onClick={() => setModalOpen("armas")} className="aq-button-primary">
                      <Plus size={14} />
                      Biblioteca
                    </button>
                  </div>
                </div>

                {ficha.dados.armas.length === 0 ? (
                  <EmptyState message="Nenhuma arma ou equipamento cadastrado." />
                ) : (
                  <div className="aq-scrollbar max-h-[680px] space-y-4 overflow-y-auto pr-2">
                    {ficha.dados.armas.map((arma: any) => (
                      <article key={arma.id} className="rounded-3xl border border-[var(--aq-border)] bg-[rgba(5,10,16,0.7)] p-5">
                        <div className="mb-5 flex items-start justify-between gap-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                value={arma.nome}
                                onChange={(e) => updateItem("armas", arma.id, { nome: e.target.value })}
                                className={`bg-transparent text-2xl font-black text-[var(--aq-title)] outline-none ${cinzel.className}`}
                              />
                              <span className="aq-pill aq-pill-muted">{arma.tipo || "Equipamento"}</span>
                            </div>
                            <p className="mt-2 text-sm text-[var(--aq-text-muted)]">
                              Ajuste o card e use os atalhos para popular as melhorias no mesmo estilo da ficha.
                            </p>
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
                            { label: "Atributo-chave", key: "habilidade" },
                            { label: "Dano", key: "dano" },
                            { label: "Critico", key: "critico" },
                            { label: "Alcance", key: "alcance" },
                            { label: "Categoria", key: "categoria" },
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

                        <div className="mt-4">
                          <div className="aq-kicker">Descricao</div>
                          <textarea
                            value={arma.desc ?? ""}
                            onChange={(e) => updateItem("armas", arma.id, { desc: e.target.value })}
                            className="aq-input mt-2 min-h-[90px] resize-y"
                          />
                        </div>

                        <div className="mt-4">
                          <WeaponModsEditor
                            melhoriaValue={arma.melhorias ?? ""}
                            maldicaoValue={arma.maldicoes ?? ""}
                            melhoriaOptions={preset.melhoriasCatalogo ?? []}
                            maldicaoOptions={preset.maldicoesCatalogo ?? []}
                            onChange={(field, value) => updateItem("armas", arma.id, { [field]: value })}
                          />
                        </div>

                        <div className="mt-4">
                          <div className="aq-kicker">Notas Gerais</div>
                          <textarea
                            value={arma.notas ?? ""}
                            onChange={(e) => updateItem("armas", arma.id, { notas: e.target.value })}
                            className="aq-input mt-2 min-h-[90px] resize-y"
                          />
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
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,6,11,0.82)] p-6 backdrop-blur-md">
          <div className="aq-panel max-h-[85vh] w-full max-w-4xl overflow-hidden">
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
                  setCompendiumFilter("all");
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
              {modalOpen === "habilidades" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {availableCompendiumFilters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setCompendiumFilter(filter)}
                      className={compendiumFilter === filter ? "aq-button-primary !px-3 !py-2" : "aq-button-secondary !px-3 !py-2"}
                    >
                      {filter === "all" ? "Tudo" : filter}
                    </button>
                  ))}
                </div>
              ) : null}
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
                          {item.subcat ? <span className="aq-pill aq-pill-muted">{item.subcat}</span> : null}
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
