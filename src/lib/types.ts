export interface Skill {
  id: number;
  nome: string;
  dado?: string;
  desc: string;
  cat?: string;
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

export interface AttributeMap {
  forca: number;
  agilidade: number;
  vigor: number;
  intelecto: number;
  presenca: number;
}

export interface ChoiceOption {
  nome: string;
  desc?: string;
  poder?: string;
  grupo?: string;
  custom?: boolean;
  caminhos?: ChoiceOption[];
  tags?: string[];
  atributos?: Partial<AttributeMap>;
  proficiencias?: string[];
  habilidades?: string[];
  deslocamento?: string;
  defesaBonus?: number;
  vidaBase?: number;
  vidaPorNivel?: number;
  peBase?: number;
  pePorNivel?: number;
  sanidadeBase?: number;
  sanidadePorNivel?: number;
}

export interface Category {
  id: string;
  nome: string;
}

export interface ResourceLabels {
  vida: string;
  pe: string;
  sanidade: string;
}

export interface SystemPreset {
  nome: string;
  origens: ChoiceOption[];
  classes: ChoiceOption[];
  racas: ChoiceOption[];
  categorias_hab: Category[];
  armas: Weapon[];
  melhoriasCatalogo?: string[];
  maldicoesCatalogo?: string[];
  pericias?: Array<{ nome: string; atributo: keyof AttributeMap }>;
  resourceLabels?: ResourceLabels;
  progressLabel?: string;
  progressMin?: number;
  progressMax?: number;
  progressStep?: number;
  proficienciaTreino?: number;
  [key: string]: any;
}

export interface Token {
  id: string;
  cena_id: string;
  ficha_id: string | null;
  nome: string;
  x: number;
  y: number;
  cor: string;
}

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
      pe?: { atual: number; max: number };
    };
    [key: string]: any;
  };
}
