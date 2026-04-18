export interface Skill {
  id: number;
  nome: string;
  dado?: string;
  desc: string;
  cat: string;
  subcat?: string;
  fonte?: string;
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
  [key: string]: any;
}

// --- VTT TYPES ---

/**
 * Representa um token no mapa VTT.
 * `ficha_id` é nullable: token burro (sem ficha) vs token vinculado (com ficha).
 * A sincronização HP é feita pela ficha, nunca armazenada localmente no token.
 */
export interface Token {
  id: string;
  cena_id: string;
  ficha_id: string | null;
  nome: string;
  x: number;
  y: number;
  cor: string;
}

/**
 * Snapshot da ficha relevante para o VTT.
 * Extraído de `fichas.dados` para renderização de HP bars e TokenPanel.
 */
export interface FichaVTTSnapshot {
  id: string;
  nome_personagem: string;
  sistema_preset: string;
  avatar_url?: string;
  dados: {
    status?: {
      vida?: { atual: number; max: number };
      sanidade?: { atual: number; max: number };
      estamina?: { atual: number; max: number };
    };
    [key: string]: any;
  };
}
