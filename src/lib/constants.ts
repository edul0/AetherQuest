import { DND5E } from "./data/dnd";
import { ORDEM_PARANORMAL } from "./data/ordem";
import { ChoiceOption, SystemPreset } from "./types";

const ORDEM_CLASSES: ChoiceOption[] = [
  {
    nome: "Combatente",
    grupo: "Base",
    vidaBase: 20,
    vidaPorNivel: 4,
    peBase: 2,
    pePorNivel: 1,
    sanidadeBase: 16,
    sanidadePorNivel: 3,
    defesaBonus: 1,
    proficiencias: ["Fortitude", "Luta"],
    caminhos: [
      { nome: "Aniquilador", desc: "Especialista em armas pesadas e impacto bruto.", proficiencias: ["Pontaria"] },
      { nome: "Guerreiro", desc: "Linha de frente agressiva e adaptavel.", proficiencias: ["Luta"] },
      { nome: "Operacoes Especiais", desc: "Pressao tatica e mobilidade ofensiva.", proficiencias: ["Reflexos", "Tatica"] },
      { nome: "Tropa de Choque", desc: "Absorve dano e protege a linha aliada.", proficiencias: ["Fortitude"] },
      { nome: "Personalizada", custom: true, desc: "Defina manualmente uma trilha de combatente." },
    ],
  },
  {
    nome: "Especialista",
    grupo: "Base",
    vidaBase: 16,
    vidaPorNivel: 3,
    peBase: 3,
    pePorNivel: 2,
    sanidadeBase: 18,
    sanidadePorNivel: 4,
    proficiencias: ["Crime", "Investigacao"],
    caminhos: [
      { nome: "Atirador de Elite", desc: "Precisao e controle de campo.", proficiencias: ["Pontaria", "Percepcao"] },
      { nome: "Infiltrador", desc: "Furtividade, invasao e dano oportunista.", proficiencias: ["Crime", "Furtividade"] },
      { nome: "Medico de Campo", desc: "Suporte rapido e estabilizacao em combate.", proficiencias: ["Medicina"] },
      { nome: "Negociador", desc: "Controle social e leitura de cena.", proficiencias: ["Diplomacia", "Intuicao"] },
      { nome: "Tecnico", desc: "Ferramentas, explosivos e improviso.", proficiencias: ["Tecnologia", "Profissao"] },
      { nome: "Personalizada", custom: true, desc: "Defina manualmente uma trilha de especialista." },
    ],
  },
  {
    nome: "Ocultista",
    grupo: "Base",
    vidaBase: 12,
    vidaPorNivel: 2,
    peBase: 5,
    pePorNivel: 3,
    sanidadeBase: 20,
    sanidadePorNivel: 4,
    defesaBonus: 0,
    proficiencias: ["Ocultismo", "Vontade"],
    caminhos: [
      { nome: "Conduite", desc: "Expande alcance e fluxo ritualistico.", proficiencias: ["Ocultismo"] },
      { nome: "Graduado", desc: "Aprende mais rituais e amplia repertorio.", proficiencias: ["Ocultismo", "Atualidades"] },
      { nome: "Intuitivo", desc: "Sobrevive melhor ao Outro Lado.", proficiencias: ["Vontade", "Percepcao"] },
      { nome: "Lamina Paranormal", desc: "Mistura ritual e combate direto.", proficiencias: ["Luta", "Ocultismo"] },
      { nome: "Personalizada", custom: true, desc: "Defina manualmente uma trilha de ocultista." },
    ],
  },
  {
    nome: "Personalizada",
    custom: true,
    desc: "Defina manualmente uma classe ou trilha.",
  },
];

const ORDEM_RACES: ChoiceOption[] = [
  {
    nome: "Marcado",
    desc: "Humano tocado pelo Outro Lado.",
    deslocamento: "9m",
  },
  {
    nome: "Sobrevivente",
    desc: "Versao flexivel para campanhas autorais.",
    atributos: { vigor: 1, presenca: 1 },
    deslocamento: "9m",
  },
  {
    nome: "Personalizada",
    custom: true,
    desc: "Defina manualmente uma linhagem ou condicao especial.",
  },
];

const ORDEM_MELHORIAS = [
  "Calibre grosso",
  "Cruel",
  "Certeira",
  "Tatica",
  "Reforcada",
  "Silenciada",
];

const ORDEM_MALDICOES = [
  "Sangrenta",
  "Energetica",
  "Sombria",
  "Ritualistica",
  "Repulsora",
  "Lancinante",
];

export const PRESETS: Record<string, SystemPreset> = {
  ordem_paranormal: {
    ...(ORDEM_PARANORMAL as any),
    nome: "Ordem Paranormal",
    racas: ORDEM_RACES,
    classes: ORDEM_CLASSES,
    melhoriasCatalogo: ORDEM_MELHORIAS,
    maldicoesCatalogo: ORDEM_MALDICOES,
    resourceLabels: {
      vida: "Vida",
      pe: "PE",
      sanidade: "Sanidade",
    },
    progressLabel: "NEX",
    progressMin: 5,
    progressMax: 99,
    progressStep: 5,
    proficienciaTreino: 5,
  } as SystemPreset,
  dnd5e: DND5E as SystemPreset,
  memorias_postumas: {
    nome: "Memorias Postumas",
    origens: [{ nome: "Sobrevivente", poder: "Instinto", proficiencias: ["Vontade"] }],
    classes: [
      {
        nome: "Vanguarda",
        vidaBase: 16,
        vidaPorNivel: 4,
        peBase: 3,
        pePorNivel: 1,
        sanidadeBase: 12,
        sanidadePorNivel: 2,
        caminhos: [{ nome: "Executor" }, { nome: "Guardiao" }, { nome: "Personalizada", custom: true }],
      },
      {
        nome: "Suporte",
        vidaBase: 12,
        vidaPorNivel: 3,
        peBase: 4,
        pePorNivel: 2,
        sanidadeBase: 14,
        sanidadePorNivel: 2,
        caminhos: [{ nome: "Analista" }, { nome: "Catalisador" }, { nome: "Personalizada", custom: true }],
      },
      { nome: "Personalizada", custom: true },
    ],
    racas: [{ nome: "Humano" }, { nome: "Personalizada", custom: true }],
    categorias_hab: [{ id: "comum", nome: "Habilidades Base" }],
    armas: [],
    resourceLabels: {
      vida: "Vida",
      pe: "Foco",
      sanidade: "Stress",
    },
    progressLabel: "Nivel",
    progressMin: 1,
    progressMax: 20,
    progressStep: 1,
    proficienciaTreino: 2,
  } as SystemPreset,
};
