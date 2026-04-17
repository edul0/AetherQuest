export const ORDEM_PARANORMAL = {
  origens: [
    { nome: "Acadêmico", poder: "Saber é Poder: Pode gastar 2 PE para receber +5 num teste de Intelecto.", proficiencias: ["Ciências", "Investigação"] },
    { nome: "Agente de Saúde", poder: "Técnica Médica: Sempre que cura um personagem, adiciona +1d10.", proficiencias: ["Medicina", "Percepção"] },
    { nome: "Atleta", poder: "110%: Gastando 2 PE, recebe +1d6 em testes de Força ou Agilidade.", proficiencias: ["Atletismo", "Luta"] },
    { nome: "Militar", poder: "Para o Propósito: Você ganha proficiência com Armas de Fogo e +2 em Tática.", proficiencias: ["Pontaria", "Tática"] }
  ],
  classes: ["Combatente", "Especialista", "Ocultista"],
  categorias_hab: [
    { id: 'comum', nome: 'Habilidades & Origem' },
    { id: 'paranormal', nome: 'Poderes Paranormais' },
    { id: 'rituais', nome: 'Rituais' },
    { id: 'armas', nome: 'Arsenal' }
  ],
  // --- O COMPÊNDIO DE AUTO-PREENCHIMENTO ---
  comum: [
    { nome: "Ataque Especial", dado: "2 PE", desc: "Recebe +5 no teste de ataque ou na rolagem de dano." },
    { nome: "Perito", dado: "2 PE", desc: "Adiciona +1d6 num teste de perícia que seja treinado." },
    { nome: "Escolhido pelo Outro Lado", dado: "-", desc: "Permite aprender e conjurar rituais." }
  ],
  paranormal: [
    { nome: "Sangue de Ferro (Sangue)", dado: "-", desc: "Você recebe +3 PV máximos e +1 PV por NEX." },
    { nome: "Visão do Oculto (Conhecimento)", dado: "1 PE", desc: "Enxerga no escuro e vê auras mágicas e itens amaldiçoados." },
    { nome: "Potencial Aprimorado (Energia)", dado: "-", desc: "Recebe +1 PE máximo por NEX." }
  ],
  rituais: [
    { nome: "Decadência", dado: "1 PE", desc: "Causa 2d8+2 de dano de Morte (Fortitude reduz à metade)." },
    { nome: "Cicatrização", dado: "1 PE", desc: "O alvo recupera 3d8+3 PV. Envelhece o alvo em 1 ano." },
    { nome: "Amaldiçoar Arma", dado: "1 PE", desc: "A arma alvo causa +1d6 de dano do elemento escolhido." },
    { nome: "Eletrocussão", dado: "1 PE", desc: "Dispara um arco de energia causando 2d6 de dano de Energia." }
  ],
  armas: [
    { nome: "Katana", tipo: "Corpo a Corpo", habilidade: "Luta", dano: "1d10", critico: "19 / x2", alcance: "Adjacente", categoria: 1, desc: "Arma tática, ágil e letal." },
    { nome: "Revólver", tipo: "Fogo de Mão", habilidade: "Pontaria", dano: "2d6", critico: "19 / x3", alcance: "Curto", categoria: 1, desc: "Clássico revólver .38." },
    { nome: "Fuzil de Assalto", tipo: "Fogo Pesada", habilidade: "Pontaria", dano: "2d10", critico: "19 / x3", alcance: "Médio", categoria: 2, desc: "Arma militar de alto calibre." }
  ]
};
