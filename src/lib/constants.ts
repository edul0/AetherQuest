
import { Swords, Ghost, Flame, Sparkles, Zap } from 'lucide-react';

export const PRESETS = {
  ordem_paranormal: {
    origens: ["Acadêmico", "Agente de Saúde", "Amnésico", "Atleta", "Criminoso", "Cultista Arrependido", "Desgarrado", "Engenheiro", "Executivo", "Investigador", "Lutador", "Militar", "Operário", "Religioso", "TI", "Trabalhador Rural", "Trambiqueiro", "Universitário"],
    classes: ["Combatente", "Especialista", "Ocultista"],
    categorias_hab: [
      { id: 'comum', nome: 'Habilidades', icon: Swords },
      { id: 'paranormal', nome: 'Poderes Paranormais', icon: Ghost },
      { id: 'rituais', nome: 'Rituais', icon: Flame }
    ]
  },
  dnd5e: {
    origens: ["Acólito", "Artesão da Guilda", "Charlatão", "Criminoso", "Eremita", "Forasteiro", "Herói do Povo", "Marinheiro", "Nobre", "Órfão", "Sábio", "Soldado"],
    classes: ["Bárbaro", "Bardo", "Bruxo", "Clérigo", "Druida", "Feiticeiro", "Guerreiro", "Ladino", "Mago", "Monge", "Paladino", "Patrulheiro"],
    categorias_hab: [
      { id: 'comum', nome: 'Características e Talentos', icon: Swords },
      { id: 'magias', nome: 'Magias', icon: Sparkles }
    ]
  },
  memorias_postumas: {
    origens: ["Sobrevivente", "Cientista", "Militar das Sombras", "Ocultista Renegado"],
    classes: ["Vanguarda", "Suporte Tático", "Assalto Paranormal"],
    categorias_hab: [
      { id: 'comum', nome: 'Habilidades Base', icon: Swords },
      { id: 'especial', nome: 'Poderes de Classe', icon: Zap }
    ]
  }
};
