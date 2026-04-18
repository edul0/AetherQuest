export const DND5E = {
  origens: [
    { nome: "Acolito", poder: "Conhecimento religioso e abrigo em templos aliados.", proficiencias: ["Religiao", "Intuicao"] },
    { nome: "Artesao da Guilda", poder: "Contatos comerciais e acesso a oficinas de guilda.", proficiencias: ["Investigacao", "Persuasao"] },
    { nome: "Criminoso", poder: "Rede do submundo e conhecimento de rotas ilegais.", proficiencias: ["Furtividade", "Enganacao"] },
    { nome: "Ermitao", poder: "Descoberta pessoal e foco em sobrevivencia.", proficiencias: ["Medicina", "Sobrevivencia"] },
    { nome: "Heroi do Povo", poder: "Boa vontade entre trabalhadores comuns e camponeses.", proficiencias: ["Adestramento", "Sobrevivencia"] },
    { nome: "Nobre", poder: "Prestigio social e facil acesso a cortes e saloes.", proficiencias: ["Historia", "Persuasao"] },
    { nome: "Sabio", poder: "Acesso a bibliotecas e referencia academica.", proficiencias: ["Arcanismo", "Historia"] },
    { nome: "Soldado", poder: "Hierarquia militar, tatica e comando basico.", proficiencias: ["Atletismo", "Intimidacao"] }
  ],
  classes: [
    { nome: "Barbaro", vidaBase: 16, vidaPorNivel: 9, recursoBase: 2, recursoPorNivel: 1, sanidadeBase: 8, sanidadePorNivel: 1, defesaBonus: 0, bloqueioBonus: 2, esquivaBonus: 0, habilidades: ["Furia", "Defesa sem Armadura"], proficiencias: ["Atletismo", "Sobrevivencia"] },
    { nome: "Bardo", vidaBase: 10, vidaPorNivel: 6, recursoBase: 6, recursoPorNivel: 3, sanidadeBase: 12, sanidadePorNivel: 2, defesaBonus: 0, bloqueioBonus: 0, esquivaBonus: 1, habilidades: ["Inspiracao Bardica", "Magia"], proficiencias: ["Atuacao", "Persuasao"] },
    { nome: "Clerigo", vidaBase: 11, vidaPorNivel: 7, recursoBase: 5, recursoPorNivel: 3, sanidadeBase: 12, sanidadePorNivel: 2, defesaBonus: 1, bloqueioBonus: 1, esquivaBonus: 0, habilidades: ["Canalizar Divindade", "Magia"], proficiencias: ["Religiao", "Intuicao"] },
    { nome: "Druida", vidaBase: 11, vidaPorNivel: 7, recursoBase: 5, recursoPorNivel: 3, sanidadeBase: 12, sanidadePorNivel: 2, defesaBonus: 0, bloqueioBonus: 0, esquivaBonus: 1, habilidades: ["Forma Selvagem", "Magia"], proficiencias: ["Natureza", "Sobrevivencia"] },
    { nome: "Feiticeiro", vidaBase: 8, vidaPorNivel: 5, recursoBase: 7, recursoPorNivel: 4, sanidadeBase: 11, sanidadePorNivel: 2, defesaBonus: 0, bloqueioBonus: 0, esquivaBonus: 1, habilidades: ["Magia Inata", "Metamagia"], proficiencias: ["Arcanismo", "Persuasao"] },
    { nome: "Guerreiro", vidaBase: 14, vidaPorNivel: 8, recursoBase: 3, recursoPorNivel: 1, sanidadeBase: 9, sanidadePorNivel: 1, defesaBonus: 1, bloqueioBonus: 2, esquivaBonus: 0, habilidades: ["Surto de Acao", "Estilo de Luta"], proficiencias: ["Atletismo", "Intimidacao"] },
    { nome: "Ladino", vidaBase: 10, vidaPorNivel: 6, recursoBase: 4, recursoPorNivel: 2, sanidadeBase: 10, sanidadePorNivel: 1, defesaBonus: 0, bloqueioBonus: 0, esquivaBonus: 2, habilidades: ["Ataque Furtivo", "Acao Ardilosa"], proficiencias: ["Furtividade", "Prestidigitacao"] },
    { nome: "Mago", vidaBase: 8, vidaPorNivel: 5, recursoBase: 8, recursoPorNivel: 4, sanidadeBase: 12, sanidadePorNivel: 2, defesaBonus: 0, bloqueioBonus: 0, esquivaBonus: 0, habilidades: ["Grimorio", "Recuperacao Arcana"], proficiencias: ["Arcanismo", "Investigacao"] },
    { nome: "Monge", vidaBase: 11, vidaPorNivel: 7, recursoBase: 5, recursoPorNivel: 2, sanidadeBase: 10, sanidadePorNivel: 1, defesaBonus: 1, bloqueioBonus: 0, esquivaBonus: 2, habilidades: ["Ki", "Defesa sem Armadura"], proficiencias: ["Acrobacia", "Atletismo"] },
    { nome: "Paladino", vidaBase: 13, vidaPorNivel: 8, recursoBase: 4, recursoPorNivel: 2, sanidadeBase: 11, sanidadePorNivel: 2, defesaBonus: 1, bloqueioBonus: 2, esquivaBonus: 0, habilidades: ["Imposicao das Maos", "Punicao Divina"], proficiencias: ["Persuasao", "Religiao"] },
    { nome: "Patrulheiro", vidaBase: 12, vidaPorNivel: 7, recursoBase: 4, recursoPorNivel: 2, sanidadeBase: 10, sanidadePorNivel: 1, defesaBonus: 0, bloqueioBonus: 1, esquivaBonus: 1, habilidades: ["Inimigo Favorito", "Explorador Nato"], proficiencias: ["Natureza", "Sobrevivencia"] },
    { nome: "Bruxo", vidaBase: 9, vidaPorNivel: 6, recursoBase: 7, recursoPorNivel: 3, sanidadeBase: 11, sanidadePorNivel: 2, defesaBonus: 0, bloqueioBonus: 0, esquivaBonus: 1, habilidades: ["Pacto Mistico", "Invocacoes"], proficiencias: ["Arcanismo", "Enganacao"] }
  ],
  racas: [
    { nome: "Humano", poder: "Versatilidade total.", proficiencias: ["Persuasao"], atributos: { forca: 1, agilidade: 1, vigor: 1, intelecto: 1, presenca: 1 }, deslocamento: "9m" },
    { nome: "Anao", poder: "Resistencia e treinamento marcial.", proficiencias: ["Fortitude"], atributos: { vigor: 2, forca: 1 }, deslocamento: "7,5m" },
    { nome: "Elfo", poder: "Sentidos aguçados e leveza.", proficiencias: ["Percepcao"], atributos: { agilidade: 2, intelecto: 1 }, deslocamento: "9m" },
    { nome: "Halfling", poder: "Sorte natural e furtividade.", proficiencias: ["Furtividade"], atributos: { agilidade: 2, presenca: 1 }, deslocamento: "7,5m" },
    { nome: "Draconato", poder: "Presenca imponente e folego draconico.", proficiencias: ["Intimidacao"], atributos: { forca: 2, presenca: 1 }, deslocamento: "9m" },
    { nome: "Gnomo", poder: "Raciocinio rapido e engenhosidade.", proficiencias: ["Arcanismo"], atributos: { intelecto: 2, agilidade: 1 }, deslocamento: "7,5m" },
    { nome: "Meio-Elfo", poder: "Carisma nato e adaptabilidade.", proficiencias: ["Persuasao", "Intuicao"], atributos: { presenca: 2, agilidade: 1, intelecto: 1 }, deslocamento: "9m" },
    { nome: "Meio-Orc", poder: "Furia brutal e resistencia fisica.", proficiencias: ["Intimidacao"], atributos: { forca: 2, vigor: 1 }, deslocamento: "9m" },
    { nome: "Tiefling", poder: "Heranca infernal e magia sombria.", proficiencias: ["Enganacao"], atributos: { presenca: 2, intelecto: 1 }, deslocamento: "9m" }
  ],
  categorias_hab: [
    { id: "comum", nome: "Caracteristicas de Classe" },
    { id: "magias", nome: "Magias & Recursos" },
    { id: "armas", nome: "Arsenal" }
  ],
  pericias: [
    { nome: "Acrobacia", atributo: "agilidade" },
    { nome: "Adestramento", atributo: "presenca" },
    { nome: "Arcanismo", atributo: "intelecto" },
    { nome: "Atletismo", atributo: "forca" },
    { nome: "Atuacao", atributo: "presenca" },
    { nome: "Enganacao", atributo: "presenca" },
    { nome: "Fortitude", atributo: "vigor" },
    { nome: "Furtividade", atributo: "agilidade" },
    { nome: "Historia", atributo: "intelecto" },
    { nome: "Intimidacao", atributo: "presenca" },
    { nome: "Intuicao", atributo: "presenca" },
    { nome: "Investigacao", atributo: "intelecto" },
    { nome: "Medicina", atributo: "intelecto" },
    { nome: "Natureza", atributo: "intelecto" },
    { nome: "Percepcao", atributo: "presenca" },
    { nome: "Persuasao", atributo: "presenca" },
    { nome: "Prestidigitacao", atributo: "agilidade" },
    { nome: "Religiao", atributo: "intelecto" },
    { nome: "Sobrevivencia", atributo: "intelecto" }
  ],
  comum: [
    { nome: "Ataque Basico", dado: "-", desc: "Acao basica de ataque corpo a corpo ou a distancia.", subcat: "Geral", fonte: "D&D 5e" },
    { nome: "Acao Bonus", dado: "-", desc: "Habilidade especial que pode ser usada junto da acao padrao.", subcat: "Geral", fonte: "D&D 5e" },
    { nome: "Descanso Curto", dado: "-", desc: "Permite recuperar recursos temporarios e se reorganizar.", subcat: "Geral", fonte: "D&D 5e" }
  ],
  magias: [
    { nome: "Misseis Magicos", dado: "1 espaco", desc: "Cria dardos de energia que atingem automaticamente.", subcat: "Arcano", fonte: "D&D 5e" },
    { nome: "Cura pelas Maos", dado: "1 espaco", desc: "Restaura pontos de vida com toque divino.", subcat: "Divino", fonte: "D&D 5e" },
    { nome: "Escudo", dado: "Reacao", desc: "Recebe +5 de defesa ate o proximo turno.", subcat: "Arcano", fonte: "D&D 5e" }
  ],
  armas: [
    { id: 1, nome: "Espada Longa", tipo: "Marcial", habilidade: "Forca", dano: "1d8", critico: "20", alcance: "Adjacente", categoria: 1, desc: "Arma versatil de uma ou duas maos." },
    { id: 2, nome: "Adaga", tipo: "Simples", habilidade: "Agilidade", dano: "1d4", critico: "19-20", alcance: "Curto", categoria: 0, desc: "Leve, arremessavel e facil de ocultar." },
    { id: 3, nome: "Arco Longo", tipo: "Marcial", habilidade: "Agilidade", dano: "1d8", critico: "20", alcance: "Longo", categoria: 1, desc: "Excelente para combate a distancia." },
    { id: 4, nome: "Machado de Batalha", tipo: "Marcial", habilidade: "Forca", dano: "1d8", critico: "20", alcance: "Adjacente", categoria: 1, desc: "Arma pesada e eficiente." },
    { id: 5, nome: "Cajado Arcano", tipo: "Foco", habilidade: "Intelecto", dano: "1d6", critico: "20", alcance: "Adjacente", categoria: 1, desc: "Tambem serve como foco de conjuracao." }
  ]
};
