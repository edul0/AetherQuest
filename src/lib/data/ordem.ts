export const ORDEM_PARANORMAL = {
  origens: [
    { nome: "Acadêmico", poder: "Saber é Poder: Quando faz um teste usando Intelecto, pode gastar 2 PE para receber +5.", proficiencias: ["Ciências", "Investigação"] },
    { nome: "Agente de Saúde", poder: "Técnica Médica: Sempre que cura um personagem, você adiciona +1d10 na cura.", proficiencias: ["Medicina", "Percepção"] },
    { nome: "Atleta", poder: "110%: Gastando 2 PE, você recebe +1d6 em testes de Força ou Agilidade.", proficiencias: ["Atletismo", "Luta"] },
    { nome: "Militar", poder: "Para o Propósito: Você ganha proficiência com Armas de Fogo e +2 em testes de Tática.", proficiencias: ["Pontaria", "Tática"] },
    { nome: "Ocultista Arrependido", poder: "Trauma: Você recebe +1 em testes de Ocultismo e Vontade.", proficiencias: ["Ocultismo", "Religião"] }
  ],
  classes: ["Combatente", "Especialista", "Ocultista"],
  categorias_hab: [
    { id: 'comum', nome: 'Habilidades & Origem' },
    { id: 'paranormal', nome: 'Poderes Paranormais' },
    { id: 'rituais', nome: 'Rituais' },
    { id: 'armas', nome: 'Arsenal' }
  ],
  armas: [
    { nome: "Faca", tipo: "Corpo a Corpo", habilidade: "Luta", dano: "1d4", critico: "19 / x2", alcance: "Curto", categoria: 0, desc: "Uma faca tática de combate aproximado." },
    { nome: "Katana", tipo: "Corpo a Corpo", habilidade: "Luta", dano: "1d10", critico: "19 / x2", alcance: "Adjacente", categoria: 1, desc: "Espada japonesa ágil e letal, usada com as duas mãos." },
    { nome: "Revólver", tipo: "Fogo de Mão", habilidade: "Pontaria", dano: "2d6", critico: "19 / x3", alcance: "Curto", categoria: 1, desc: "Clássico revólver calibre .38. Confiável." },
    { nome: "Fuzil de Assalto", tipo: "Fogo Pesada", habilidade: "Pontaria", dano: "2d10", critico: "19 / x3", alcance: "Médio", categoria: 2, desc: "Arma militar de alto calibre. Exige proficiência." },
    { nome: "Espingarda", tipo: "Fogo Pesada", habilidade: "Pontaria", dano: "4d6", critico: "20 / x3", alcance: "Curto", categoria: 1, desc: "Dispara cartuchos com grande espalhamento." }
  ]
};
