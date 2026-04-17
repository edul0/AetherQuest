export interface Skill {
  id: number;
  nome: string;
  dado?: string;
  desc: string;
  cat: string;export interface Skill {
  id: number;
  nome: string;
  dado?: string;
  desc: string;
  cat: string;
  subcat?: string; // Ex: 'Aniquilador', 'Guerreiro'
  fonte?: string;  // Ex: 'Livro Base', 'Arquivos Confidenciais'
}

export interface Weapon {
  id: number;
  nome: string;
  tipo: string;
  habilidade: string;
  dano: string;
  critico: string;
  alcance: string;
  categoria: number;
  desc: string;
}

export interface Origin {
  nome: string;
  poder: string;
  proficiencias: string[];
}

export interface SkillDefinition {
  nome: string;
  atributo: string;
  treinada: boolean;
  bonus: number;
}

export interface Category {
  id: string;
  nome: string;
}

export interface SystemPreset {
  origens: Origin[];
  classes: string[];
  categorias_hab: Category[];
  armas: Weapon[];
  [key: string]: any; // Para categorias dinâmicas como 'rituais', 'paranormal', etc.
}

}

export interface Weapon {
  id: number;
  nome: string;
  tipo: string;
  habilidade: string;
  dano: string;
  critico: string;
  alcance: string;
  categoria: number;
  desc: string;
}

export interface Origin {
  nome: string;
  poder: string;
  proficiencias: string[];
}

export interface Category {
  id: string;
  nome: string;
}

export interface SystemPreset {
  origens: Origin[];
  classes: string[];
  categorias_hab: Category[];
  armas: Weapon[];
  [key: string]: any; // Para categorias dinâmicas como 'rituais', 'paranormal', etc.
}
