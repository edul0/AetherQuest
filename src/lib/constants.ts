import { ORDEM_PARANORMAL } from './data/ordem';
// Futuramente, você cria import { DND5E } from './data/dnd'; e joga aqui.

export const PRESETS = {
  ordem_paranormal: ORDEM_PARANORMAL,
  dnd5e: {
    origens: [{ nome: "Herói do Povo", poder: "Acolhimento Rústico", proficiencias: ["Sobrevivência"] }],
    classes: ["Bárbaro", "Guerreiro", "Mago"],
    categorias_hab: [ { id: 'comum', nome: 'Características' }, { id: 'magias', nome: 'Magias' }, { id: 'armas', nome: 'Inventário' } ],
    armas: [ { nome: "Espada Longa", tipo: "Marcial", habilidade: "Força", dano: "1d8", critico: "20", alcance: "1,5m", categoria: 0, desc: "Espada de lâmina reta." } ]
  },
  memorias_postumas: {
    origens: [{ nome: "Sobrevivente", poder: "Instinto", proficiencias: [] }],
    classes: ["Vanguarda", "Suporte"],
    categorias_hab: [ { id: 'comum', nome: 'Habilidades Base' } ],
    armas: []
  }
};
