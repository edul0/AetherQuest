export interface Skill {
  id: number;
  nome: string;
  dado?: string;
  desc: string;
  cat: string;
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
