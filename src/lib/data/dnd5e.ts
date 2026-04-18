export const DND5E = {
  origens: [
    { nome: "Acolito", desc: "Você serviu um templo e aprendeu ritos, doutrinas e a linguagem dos fiéis.", poder: "Abrigo entre comunidades religiosas e respeito institucional.", proficiencias: ["Religiao", "Intuicao"] },
    { nome: "Artesao da Guilda", desc: "Você veio de uma oficina, guilda ou tradição de ofício reconhecida.", poder: "Contatos comerciais e acesso a oficinas, encomendas e redes de trabalho.", proficiencias: ["Investigacao", "Persuasao"] },
    { nome: "Criminoso", desc: "Você sobreviveu entre golpes, contrabando, espionagem ou furtos profissionais.", poder: "Rede do submundo para contatos discretos e rotas ilegais.", proficiencias: ["Furtividade", "Enganacao"] },
    { nome: "Ermitao", desc: "Você passou anos isolado, buscando compreensão espiritual, natural ou arcana.", poder: "Revelação pessoal e foco em cura, introspecção e sobrevivência.", proficiencias: ["Medicina", "Sobrevivencia"] },
    { nome: "Heroi do Povo", desc: "Você veio das massas e se tornou símbolo de coragem entre gente comum.", poder: "Hospitalidade rústica e apoio espontâneo do povo.", proficiencias: ["Adestramento", "Sobrevivencia"] },
    { nome: "Nobre", desc: "Você cresceu entre brasões, salões, intrigas e o peso da reputação.", poder: "Prestigio social, etiqueta e facil acesso a cortes e contatos influentes.", proficiencias: ["Historia", "Persuasao"] },
    { nome: "Sabio", desc: "Você viveu entre livros, teoria, arquivos e debates acadêmicos.", poder: "Acesso a bibliotecas, pesquisa e referencia intelectual.", proficiencias: ["Arcanismo", "Historia"] },
    { nome: "Soldado", desc: "Você serviu em milícias, exércitos ou companhias marcadas por disciplina e guerra.", poder: "Hierarquia militar, leitura tática de campo e respeito entre veteranos.", proficiencias: ["Atletismo", "Intimidacao"] }
  ],
  classes: [
    { nome: "Barbaro", desc: "Um guerreiro feroz que entra em furia e confia na força bruta para dominar o campo de batalha.", vidaBase: 16, vidaPorNivel: 9, recursoBase: 2, recursoPorNivel: 1, sanidadeBase: 8, sanidadePorNivel: 1, defesaBonus: 0, bloqueioBonus: 2, esquivaBonus: 0, habilidades: ["Furia", "Defesa sem Armadura"], proficiencias: ["Atletismo", "Sobrevivencia"] },
    { nome: "Bardo", desc: "Um artista e conjurador versátil que inspira aliados e usa magia moldada por performance e presença.", vidaBase: 10, vidaPorNivel: 6, recursoBase: 6, recursoPorNivel: 3, sanidadeBase: 12, sanidadePorNivel: 2, defesaBonus: 0, bloqueioBonus: 0, esquivaBonus: 1, habilidades: ["Inspiracao Bardica", "Magia"], proficiencias: ["Atuacao", "Persuasao"] },
    { nome: "Clerigo", desc: "Um agente da fé que usa magia divina, proteção e dever sagrado para sustentar o grupo.", vidaBase: 11, vidaPorNivel: 7, recursoBase: 5, recursoPorNivel: 3, sanidadeBase: 12, sanidadePorNivel: 2, defesaBonus: 1, bloqueioBonus: 1, esquivaBonus: 0, habilidades: ["Canalizar Divindade", "Magia"], proficiencias: ["Religiao", "Intuicao"] },
    { nome: "Druida", desc: "Um guardião da natureza capaz de conjurar forças naturais e assumir formas selvagens.", vidaBase: 11, vidaPorNivel: 7, recursoBase: 5, recursoPorNivel: 3, sanidadeBase: 12, sanidadePorNivel: 2, defesaBonus: 0, bloqueioBonus: 0, esquivaBonus: 1, habilidades: ["Forma Selvagem", "Magia"], proficiencias: ["Natureza", "Sobrevivencia"] },
    { nome: "Feiticeiro", desc: "Um conjurador cuja magia vem de uma herança, dom ou ruptura sobrenatural.", vidaBase: 8, vidaPorNivel: 5, recursoBase: 7, recursoPorNivel: 4, sanidadeBase: 11, sanidadePorNivel: 2, defesaBonus: 0, bloqueioBonus: 0, esquivaBonus: 1, habilidades: ["Magia Inata", "Metamagia"], proficiencias: ["Arcanismo", "Persuasao"] },
    { nome: "Guerreiro", desc: "Especialista em combate marcial, estilos de luta e uso consistente de armas e armaduras.", vidaBase: 14, vidaPorNivel: 8, recursoBase: 3, recursoPorNivel: 1, sanidadeBase: 9, sanidadePorNivel: 1, defesaBonus: 1, bloqueioBonus: 2, esquivaBonus: 0, habilidades: ["Surto de Acao", "Estilo de Luta"], proficiencias: ["Atletismo", "Intimidacao"] },
    { nome: "Ladino", desc: "Um especialista em furtividade, precisão, movimentação e resolução de problemas com astúcia.", vidaBase: 10, vidaPorNivel: 6, recursoBase: 4, recursoPorNivel: 2, sanidadeBase: 10, sanidadePorNivel: 1, defesaBonus: 0, bloqueioBonus: 0, esquivaBonus: 2, habilidades: ["Ataque Furtivo", "Acao Ardilosa"], proficiencias: ["Furtividade", "Prestidigitacao"] },
    { nome: "Mago", desc: "Um estudioso da magia que depende de grimório, preparo e disciplina arcana.", vidaBase: 8, vidaPorNivel: 5, recursoBase: 8, recursoPorNivel: 4, sanidadeBase: 12, sanidadePorNivel: 2, defesaBonus: 0, bloqueioBonus: 0, esquivaBonus: 0, habilidades: ["Grimorio", "Recuperacao Arcana"], proficiencias: ["Arcanismo", "Investigacao"] },
    { nome: "Monge", desc: "Um artista marcial disciplinado que luta com mobilidade, foco e defesa corporal.", vidaBase: 11, vidaPorNivel: 7, recursoBase: 5, recursoPorNivel: 2, sanidadeBase: 10, sanidadePorNivel: 1, defesaBonus: 1, bloqueioBonus: 0, esquivaBonus: 2, habilidades: ["Ki", "Defesa sem Armadura"], proficiencias: ["Acrobacia", "Atletismo"] },
    { nome: "Paladino", desc: "Um campeão sagrado que mistura presença, juramento, defesa e punição divina.", vidaBase: 13, vidaPorNivel: 8, recursoBase: 4, recursoPorNivel: 2, sanidadeBase: 11, sanidadePorNivel: 2, defesaBonus: 1, bloqueioBonus: 2, esquivaBonus: 0, habilidades: ["Imposicao das Maos", "Punicao Divina"], proficiencias: ["Persuasao", "Religiao"] },
    { nome: "Patrulheiro", desc: "Um combatente de fronteira que usa rastreio, precisão e magia leve para caçar ameaças.", vidaBase: 12, vidaPorNivel: 7, recursoBase: 4, recursoPorNivel: 2, sanidadeBase: 10, sanidadePorNivel: 1, defesaBonus: 0, bloqueioBonus: 1, esquivaBonus: 1, habilidades: ["Inimigo Favorito", "Explorador Nato"], proficiencias: ["Natureza", "Sobrevivencia"] },
    { nome: "Bruxo", desc: "Um conjurador que extrai poder de pactos e entidades extraplanares.", vidaBase: 9, vidaPorNivel: 6, recursoBase: 7, recursoPorNivel: 3, sanidadeBase: 11, sanidadePorNivel: 2, defesaBonus: 0, bloqueioBonus: 0, esquivaBonus: 1, habilidades: ["Pacto Mistico", "Invocacoes"], proficiencias: ["Arcanismo", "Enganacao"] }
  ],
  racas: [
    { nome: "Humano", desc: "Adaptável e amplo, com facilidade para aprender caminhos muito diferentes.", poder: "Versatilidade total.", proficiencias: ["Persuasao"], atributos: { forca: 1, agilidade: 1, vigor: 1, intelecto: 1, presenca: 1 }, deslocamento: "9m" },
    { nome: "Anao", desc: "Povo resistente, tradicional e conhecido por tenacidade e disciplina.", poder: "Resistencia e treinamento marcial.", proficiencias: ["Fortitude"], atributos: { vigor: 2, forca: 1 }, deslocamento: "7,5m" },
    { nome: "Elfo", desc: "Ágil, perceptivo e próximo da magia e da graça natural.", poder: "Sentidos aguçados e leveza.", proficiencias: ["Percepcao"], atributos: { agilidade: 2, intelecto: 1 }, deslocamento: "9m" },
    { nome: "Halfling", desc: "Pequeno, discreto e surpreendentemente corajoso sob pressão.", poder: "Sorte natural e furtividade.", proficiencias: ["Furtividade"], atributos: { agilidade: 2, presenca: 1 }, deslocamento: "7,5m" },
    { nome: "Draconato", desc: "Orgulhoso, imponente e marcado por herança dracônica.", poder: "Presenca imponente e folego draconico.", proficiencias: ["Intimidacao"], atributos: { forca: 2, presenca: 1 }, deslocamento: "9m" },
    { nome: "Gnomo", desc: "Curioso, criativo e dotado de mente viva para segredos e engenhocas.", poder: "Raciocinio rapido e engenhosidade.", proficiencias: ["Arcanismo"], atributos: { intelecto: 2, agilidade: 1 }, deslocamento: "7,5m" },
    { nome: "Meio-Elfo", desc: "Diplomático, híbrido e talentoso em transitar entre mundos distintos.", poder: "Carisma nato e adaptabilidade.", proficiencias: ["Persuasao", "Intuicao"], atributos: { presenca: 2, agilidade: 1, intelecto: 1 }, deslocamento: "9m" },
    { nome: "Meio-Orc", desc: "Intenso, robusto e feito para suportar pressão e revidar com força.", poder: "Furia brutal e resistencia fisica.", proficiencias: ["Intimidacao"], atributos: { forca: 2, vigor: 1 }, deslocamento: "9m" },
    { nome: "Tiefling", desc: "Marcado por herança extraplanar e talento para presença e magia.", poder: "Heranca infernal e magia sombria.", proficiencias: ["Enganacao"], atributos: { presenca: 2, intelecto: 1 }, deslocamento: "9m" }
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
    { id: 1, nome: "Espada Longa", tipo: "Marcial", habilidade: "Forca", dano: "1d8", critico: "20", alcance: "Adjacente", categoria: 1, propriedades: ["Versatil (1d10)"], categoriaRegras: "Marcial corpo a corpo", desc: "Arma versatil de uma ou duas maos." },
    { id: 2, nome: "Adaga", tipo: "Simples", habilidade: "Agilidade", dano: "1d4", critico: "19-20", alcance: "Curto", categoria: 0, propriedades: ["Finesse", "Arremesso (20/60)"], categoriaRegras: "Simples corpo a corpo", desc: "Leve, arremessavel e facil de ocultar." },
    { id: 3, nome: "Arco Longo", tipo: "Marcial", habilidade: "Agilidade", dano: "1d8", critico: "20", alcance: "Longo", categoria: 1, propriedades: ["Municao (150/600)", "Duas maos"], categoriaRegras: "Marcial a distancia", desc: "Excelente para combate a distancia." },
    { id: 4, nome: "Machado de Batalha", tipo: "Marcial", habilidade: "Forca", dano: "1d8", critico: "20", alcance: "Adjacente", categoria: 1, propriedades: ["Versatil (1d10)"], categoriaRegras: "Marcial corpo a corpo", desc: "Arma pesada e eficiente." },
    { id: 5, nome: "Cajado Arcano", tipo: "Foco", habilidade: "Intelecto", dano: "1d6", critico: "20", alcance: "Adjacente", categoria: 1, propriedades: ["Versatil (1d8)"], categoriaRegras: "Simples corpo a corpo", desc: "Tambem serve como foco de conjuracao." }
  ],
  propriedades_arma: [
    "Finesse",
    "Leve",
    "Pesada",
    "Alcance",
    "Arremesso",
    "Municao",
    "Carregamento",
    "Duas maos",
    "Versatil",
    "Especial"
  ],
  encantamentos_arma: [
    "+1 magica",
    "+2 magica",
    "+3 magica",
    "Flamejante",
    "Congelante",
    "Trovão",
    "Radiante",
    "Sombria"
  ]
};
