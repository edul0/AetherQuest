import { DND5E } from "./data/dnd5e";
import { ORDEM_PARANORMAL } from "./data/ordem";
import { SystemPreset } from "./types";

export const PRESETS: Record<string, SystemPreset> = {
  ordem_paranormal: {
    ...ORDEM_PARANORMAL,
    classes: [
      { nome: "Combatente", desc: "Treinado para tomar a linha de frente, usar armas com precisão e sobreviver ao confronto direto.", vidaBase: 18, recursoBase: 8, sanidadeBase: 10, defesaBonus: 1, bloqueioBonus: 2, esquivaBonus: 0, habilidades: ["Ataque Especial"], proficiencias: ["Luta", "Fortitude"] },
      { nome: "Especialista", desc: "Resolve problemas com técnica, improviso, investigação e eficiência fora ou dentro do combate.", vidaBase: 15, recursoBase: 10, sanidadeBase: 12, defesaBonus: 0, bloqueioBonus: 0, esquivaBonus: 1, habilidades: ["Perito"], proficiencias: ["Investigacao", "Tecnologia"] },
      { nome: "Ocultista", desc: "Canaliza o Outro Lado, manipula rituais e aceita o risco constante do conhecimento paranormal.", vidaBase: 12, recursoBase: 12, sanidadeBase: 14, defesaBonus: 0, bloqueioBonus: 0, esquivaBonus: 0, habilidades: ["Escolhido pelo Outro Lado"], proficiencias: ["Ocultismo", "Vontade"] }
    ],
    racas: [
      { nome: "Humano", desc: "O padrão mais flexível para agentes que dependem de adaptação e leitura de campo.", poder: "Adaptavel e pronto para qualquer missao.", proficiencias: ["Percepcao"], atributos: { presenca: 1 }, deslocamento: "9m" },
      { nome: "Marcado", desc: "Sua ligação com o paranormal afeta presença, mente e sensibilidade ritualística.", poder: "Ligacao com o paranormal e sensibilidade a rituais.", proficiencias: ["Ocultismo"], atributos: { presenca: 1, intelecto: 1 }, deslocamento: "9m" },
      { nome: "Veterano", desc: "Endurecido por operações, guerra ou anos de confrontos com o impossível.", poder: "Treinamento bruto e resistencia de campo.", proficiencias: ["Fortitude"], atributos: { vigor: 1, forca: 1 }, deslocamento: "9m" },
      { nome: "Experimento Paranormal", desc: "Seu corpo foi alterado, adaptado ou marcado por efeitos que o resto do grupo chama de anormais.", poder: "Corpo alterado e dons anormais.", proficiencias: ["Reflexos"], atributos: { agilidade: 1, vigor: 1 }, deslocamento: "10,5m" }
    ],
    modificacoes_arma: [
      "Certeira",
      "Cruel",
      "Discreta",
      "Ergonomica",
      "Perigosa",
      "Precisa",
      "Silenciosa",
      "Tatica"
    ],
    maldicoes_arma: [
      "Antielemento",
      "Cinerea",
      "Energizada",
      "Lancinante",
      "Predadora",
      "Ritualistica",
      "Sanguinaria",
      "Vibrante"
    ]
  } as any,
  dnd5e: DND5E as any,
  memorias_postumas: {
    origens: [{ nome: "Sobrevivente", poder: "Instinto", proficiencias: [] }],
    classes: [{ nome: "Vanguarda" }, { nome: "Suporte" }],
    racas: [{ nome: "Eco" }],
    categorias_hab: [{ id: "comum", nome: "Habilidades Base" }],
    armas: []
  } as any
};
