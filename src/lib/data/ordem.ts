/**
 * DICIONÁRIO DE DADOS: ORDEM PARANORMAL
 * Este arquivo contém exclusivamente dados brutos e definições do sistema.
 * Segue o Princípio da Separação de Responsabilidades (SoC).
 */

export const ORDEM_PARANORMAL = {
  origens: [
    { nome: "Acadêmico", poder: "Saber é Poder: Pode gastar 2 PE para receber +5 num teste de Intelecto.", proficiencias: ["Ciências", "Investigação"] },
    { nome: "Agente de Saúde", poder: "Técnica Médica: Sempre que cura um personagem, adiciona +1d10.", proficiencias: ["Medicina", "Percepção"] },
    { nome: "Atleta", poder: "110%: Gastando 2 PE, recebe +1d6 em testes de Força ou Agilidade.", proficiencias: ["Atletismo", "Luta"] },
    { nome: "Chef", poder: "Ingrediente Secreto: Pode preparar uma refeição que concede +2 PV temporários por NEX.", proficiencias: ["Fortitude", "Profissão"] },
    { nome: "Criminoso", poder: "O Crime Compensa: Recebe +2 em testes de Crime e pode usar Intelecto em vez de Agilidade para abrir fechaduras.", proficiencias: ["Crime", "Furtividade"] },
    { nome: "Cultista Arrependido", poder: "Trauma Compartilhado: Recebe +2 em Vontade e resistência a dano mental 2.", proficiencias: ["Ocultismo", "Religião"] },
    { nome: "Desportista", poder: "Sangue Frio: Recebe +2 em testes de Reflexos e Iniciativa.", proficiencias: ["Atletismo", "Reflexos"] },
    { nome: "Ex-Policial", poder: "Patrulha: Recebe +2 em Percepção e Intuição.", proficiencias: ["Investigação", "Percepção"] },
    { nome: "Executivo", poder: "Processo Seletivo: Recebe +2 em Diplomacia e Intuição.", proficiencias: ["Diplomacia", "Profissão"] },
    { nome: "Investigador", poder: "Faro para Pistas: Recebe +2 em Investigação e pode gastar 1 PE para encontrar uma pista óbvia.", proficiencias: ["Investigação", "Percepção"] },
    { nome: "Lutador", poder: "Mão Pesada: Seus ataques desarmados causam 1d6 de dano e você recebe +2 em Luta.", proficiencias: ["Atletismo", "Luta"] },
    { nome: "Magnata", poder: "Recursos Ilimitados: Sua categoria de crédito é aumentada em um nível.", proficiencias: ["Diplomacia", "Intuição"] },
    { nome: "Mercenário", poder: "Posição de Combate: Recebe +2 em Iniciativa e pode sacar uma arma como ação livre.", proficiencias: ["Iniciativa", "Pontaria"] },
    { nome: "Militar", poder: "Para o Propósito: Você ganha proficiência com Armas de Fogo e +2 em Tática.", proficiencias: ["Pontaria", "Tática"] },
    { nome: "Operário", poder: "Ferramenta de Trabalho: Escolha uma arma simples ou ferramenta; você recebe +2 em testes com ela.", proficiencias: ["Fortitude", "Profissão"] },
    { nome: "Religioso", poder: "Acalmar: Pode gastar 2 PE para remover uma condição de medo de um aliado.", proficiencias: ["Religião", "Vontade"] },
    { nome: "Servidor Público", poder: "Espírito de Equipe: Pode gastar 1 PE para dar +2 em um teste de um aliado.", proficiencias: ["Intuição", "Vontade"] },
    { nome: "Teórico da Conspiração", poder: "Eu Já Sabia: Recebe +2 em Investigação e Ocultismo.", proficiencias: ["Investigação", "Ocultismo"] },
    { nome: "TI", poder: "Motor de Busca: Pode usar Intelecto para testes de Tecnologia e recebe +2 na perícia.", proficiencias: ["Investigação", "Tecnologia"] },
    { nome: "Trabalhador Rural", poder: "Duro na Queda: Recebe +2 PV máximos e +2 em Adestramento.", proficiencias: ["Adestramento", "Fortitude"] },
    { nome: "Vítima", poder: "Cicatrizes Psicológicas: Recebe +1 em Vontade e +2 Sanidade máxima.", proficiencias: ["Reflexos", "Vontade"] }
  ],
  classes: ["Combatente", "Especialista", "Ocultista"],
  categorias_hab: [
    { id: 'comum', nome: 'Habilidades & Origem' },
    { id: 'paranormal', nome: 'Poderes Paranormais' },
    { id: 'rituais', nome: 'Rituais' },
    { id: 'armas', nome: 'Arsenal' }
  ],
  
  comum: [
    { nome: "Ataque Especial", dado: "2 PE", desc: "Recebe +5 no teste de ataque ou na rolagem de dano. (Combatente)" },
    { nome: "Perito", dado: "2 PE", desc: "Adiciona +1d6 num teste de perícia que seja treinado. (Especialista)" },
    { nome: "Escolhido pelo Outro Lado", dado: "-", desc: "Permite aprender e conjurar rituais. (Ocultista)" },
    { nome: "Sentido Aguçado", dado: "1 PE", desc: "Recebe +5 em Percepção até o fim da cena." },
    { nome: "Reflexos Defensivos", dado: "-", desc: "Recebe +2 em Defesa e Reflexos." }
  ],

  paranormal: [
    { nome: "Sangue de Ferro (Sangue)", dado: "-", desc: "Você recebe +3 PV máximos e +1 PV por NEX. Afinidade: +2 PV por NEX." },
    { nome: "Visão do Oculto (Conhecimento)", dado: "1 PE", desc: "Enxerga no escuro e vê auras mágicas. Afinidade: Enxerga através de paredes." },
    { nome: "Potencial Aprimorado (Energia)", dado: "-", desc: "Recebe +1 PE máximo por NEX. Afinidade: +2 PE por NEX." },
    { nome: "Escapar da Morte (Morte)", dado: "-", desc: "Uma vez por cena, se cair a 0 PV, fica com 1 PV. Afinidade: Duas vezes por cena." },
    { nome: "Armadura de Sangue (Sangue)", dado: "2 PE", desc: "Recebe +2 na Defesa até o fim da cena. Afinidade: +5 na Defesa." },
    { nome: "Expansão de Conhecimento (Conhecimento)", dado: "-", desc: "Aprende uma habilidade de outra classe ou uma perícia." },
    { nome: "Afortunado (Energia)", dado: "-", desc: "Pode rolar novamente qualquer dado que resulte em 1." }
  ],

  rituais: [
    // 1º Círculo
    { nome: "Decadência", dado: "1 PE", desc: "Causa 2d8+2 de dano de Morte (Fortitude reduz à metade). Discente: 4d8+4. Verdadeiro: 8d8+8." },
    { nome: "Cicatrização", dado: "1 PE", desc: "O alvo recupera 3d8+3 PV. Envelhece o alvo em 1 ano. Discente: 5d8+5. Verdadeiro: Cura total." },
    { nome: "Amaldiçoar Arma", dado: "1 PE", desc: "A arma alvo causa +1d6 de dano do elemento escolhido. Discente: +2d6. Verdadeiro: +4d6." },
    { nome: "Eletrocussão", dado: "1 PE", desc: "Dispara um arco de energia causando 2d6 de dano de Energia. Discente: 4d6 + vulnerável. Verdadeiro: 8d6." },
    { nome: "Armadura de Sangue", dado: "1 PE", desc: "Recebe +5 de Defesa. Discente: +10. Verdadeiro: +15 e resistência a dano." },
    { nome: "Ódio Incontrolável", dado: "2 PE", desc: "Alvo recebe +2 em testes de ataque e dano, mas não pode usar ações defensivas. Discente: +5. Verdadeiro: +10." },
    { nome: "Terceiro Olho", dado: "1 PE", desc: "Enxerga auras e através de camuflagem. Discente: Vê através de objetos. Verdadeiro: Vê o futuro próximo (+5 Defesa)." },
    { nome: "Luz", dado: "1 PE", desc: "Cria uma fonte de luz. Discente: Cega inimigos. Verdadeiro: Luz solar que causa dano a criaturas de Morte." },
    { nome: "Coincidência Forçada", dado: "1 PE", desc: "Recebe +2 em testes de perícia. Discente: +5. Verdadeiro: +10." },
    { nome: "Definhar", dado: "1 PE", desc: "Alvo fica fatigado (-2 em testes). Discente: Exausto. Verdadeiro: Debilitado." },
    
    // 2º Círculo
    { nome: "Velocidade Mortal", dado: "3 PE", desc: "Alvo recebe uma ação padrão extra por rodada. Discente: Duas ações. Verdadeiro: Três ações." },
    { nome: "Eco Espiral", dado: "3 PE", desc: "Acumula dano e explode no fim da cena. Discente: Dano dobrado. Verdadeiro: Dano triplicado." },
    { nome: "Purgatório", dado: "3 PE", desc: "Cria uma área de lentidão e dano de Morte. Discente: Dano aumenta. Verdadeiro: Paralisia." },
    { nome: "Tecer Ilusão", dado: "3 PE", desc: "Cria uma ilusão visual e sonora complexa. Discente: Inclui cheiro e toque. Verdadeiro: Torna-se real." }
  ],

  armas: [
    // Simples
    { nome: "Faca", tipo: "Simples", habilidade: "Luta", dano: "1d4", critico: "19 / x2", alcance: "Curto", categoria: 0, desc: "Pequena e fácil de esconder." },
    { nome: "Bastão", tipo: "Simples", habilidade: "Luta", dano: "1d6", critico: "x2", alcance: "Adjacente", categoria: 0, desc: "Um taco ou porrete." },
    { nome: "Pistola", tipo: "Simples", habilidade: "Pontaria", dano: "1d12", critico: "18 / x2", alcance: "Curto", categoria: 1, desc: "Arma de fogo padrão." },
    
    // Táticas
    { nome: "Katana", tipo: "Tática", habilidade: "Luta", dano: "1d10", critico: "19 / x2", alcance: "Adjacente", categoria: 1, desc: "Arma tática, ágil e letal." },
    { nome: "Acha", tipo: "Tática", habilidade: "Luta", dano: "1d12", critico: "x3", alcance: "Adjacente", categoria: 1, desc: "Machado de batalha pesado." },
    { nome: "Revólver", tipo: "Tática", habilidade: "Pontaria", dano: "2d6", critico: "19 / x3", alcance: "Curto", categoria: 1, desc: "Clássico revólver .38." },
    { nome: "Fuzil de Assalto", tipo: "Tática", habilidade: "Pontaria", dano: "2d10", critico: "19 / x3", alcance: "Médio", categoria: 2, desc: "Arma militar de alto calibre." },
    { nome: "Fuzil de Precisão", tipo: "Tática", habilidade: "Pontaria", dano: "2d10", critico: "18 / x3", alcance: "Longo", categoria: 3, desc: "Sniper de alto impacto." },
    
    // Pesadas
    { nome: "Marreta", tipo: "Pesada", habilidade: "Luta", dano: "3d4", critico: "x2", alcance: "Adjacente", categoria: 2, desc: "Impacto devastador." },
    { nome: "Lança-Chamas", tipo: "Pesada", habilidade: "Pontaria", dano: "6d6", critico: "-", alcance: "Curto (Cone)", categoria: 3, desc: "Dano de fogo em área." }
  ]
};

// Extensão do Compêndio (Mais Rituais e Itens)
ORDEM_PARANORMAL.rituais.push(
  { nome: "Invadir Mente", dado: "3 PE", desc: "Lê pensamentos superficiais do alvo. Discente: Controla ações simples. Verdadeiro: Controle total." },
  { nome: "Transfusão Vital", dado: "2 PE", desc: "Transfere PV de você para um aliado. Discente: Transfere de um inimigo. Verdadeiro: Transfere de área." },
  { nome: "Manto de Sombras", dado: "3 PE", desc: "Torna-se invisível e recebe camuflagem total. Discente: Dura a cena toda. Verdadeiro: Invisibilidade para todos os sentidos." },
  { nome: "Perturbação", dado: "2 PE", desc: "Alvo fica atordoado. Discente: Alvo ataca aliados. Verdadeiro: Alvo entra em colapso mental." }
);

ORDEM_PARANORMAL.armas.push(
  { nome: "Corrente com Espinhos", tipo: "Tática", habilidade: "Luta", dano: "1d8", critico: "x2", alcance: "Curto", categoria: 1, desc: "Arma flexível e perigosa." },
  { nome: "Escopeta", tipo: "Tática", habilidade: "Pontaria", dano: "4d6", critico: "x3", alcance: "Curto", categoria: 2, desc: "Dano massivo à queima-roupa." },
  { nome: "Arco Composto", tipo: "Tática", habilidade: "Pontaria", dano: "1d10", critico: "x3", alcance: "Médio", categoria: 1, desc: "Silencioso e eficiente." }
);
