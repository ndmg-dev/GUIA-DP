/**
 * Conteúdo inicial do FAQ (seção 7 da especificação).
 *
 * ⚠️ Os textos de resposta abaixo são PLACEHOLDERS estruturais e devem ser
 * validados pelo time contábil da Mendonça Galvão antes de ir para produção.
 * Os prazos citados seguem a CLT, mas podem variar conforme convenção coletiva.
 */

export interface FaqSeedItem {
  question: string;
  answer: string;
  category: string;
  orderIndex: number;
}

export const faqSeed: FaqSeedItem[] = [
  {
    orderIndex: 1,
    category: 'Rescisão',
    question: 'Quando termina uma rescisão de contrato de trabalho?',
    answer:
      'O acerto rescisório (pagamento das verbas e entrega das guias) deve ocorrer em até 10 dias corridos contados a partir do término do contrato, tanto no aviso prévio trabalhado quanto no indenizado (art. 477, §6º da CLT). O prazo pode variar conforme a convenção coletiva da categoria — confirme com o contador responsável.',
  },
  {
    orderIndex: 2,
    category: 'Adiantamento',
    question: 'Como funciona o cálculo do adiantamento salarial?',
    answer:
      'O adiantamento (vale) é um percentual do salário pago no meio do mês, tipicamente entre 30% e 40% do salário base, conforme política da empresa ou convenção coletiva. O valor é descontado na folha do fechamento do mês. Não incide desconto de INSS/IRRF sobre o adiantamento em si — esses tributos são apurados no cálculo mensal completo.',
  },
  {
    orderIndex: 3,
    category: 'Admissão',
    question: 'Quais documentos são necessários para a admissão de um funcionário?',
    answer:
      'Em geral: documento de identidade (RG/CNH) e CPF, Carteira de Trabalho (física ou CTPS digital), comprovante de residência, foto, dados bancários, comprovante de escolaridade, certidão de nascimento/casamento e de filhos (para salário-família e IRRF), atestado de saúde ocupacional (ASO admissional) e, quando aplicável, comprovante de reservista e título de eleitor. A lista pode variar conforme a função e a política interna.',
  },
  {
    orderIndex: 4,
    category: '13º Salário',
    question: 'Quais os prazos para pagamento do 13º salário?',
    answer:
      'A primeira parcela (adiantamento) deve ser paga entre 1º de fevereiro e 30 de novembro. A segunda parcela deve ser quitada até 20 de dezembro. Sobre a segunda parcela incidem os descontos de INSS e IRRF. Colaboradores podem solicitar o adiantamento junto com as férias, se requisitado em janeiro.',
  },
  {
    orderIndex: 5,
    category: 'Rescisão',
    question: 'Como funciona o aviso prévio (trabalhado x indenizado)?',
    answer:
      'No aviso prévio trabalhado, o empregado continua trabalhando durante o período (mínimo de 30 dias, acrescido de 3 dias por ano trabalhado, até 90 dias) e pode optar por redução de 2 horas diárias ou faltar 7 dias corridos. No indenizado, a empresa dispensa o cumprimento e paga o valor correspondente, integrando o tempo para fins de férias e 13º. A escolha depende de quem deu causa à rescisão.',
  },
  {
    orderIndex: 6,
    category: 'Encargos',
    question: 'O que é e como calcular o FGTS?',
    answer:
      'O FGTS (Fundo de Garantia do Tempo de Serviço) é um depósito mensal feito pelo empregador em conta vinculada ao trabalhador, no valor de 8% da remuneração bruta (2% para contrato de aprendiz). Não é descontado do salário — é um encargo do empregador. Em demissões sem justa causa, há multa rescisória de 40% sobre o saldo depositado.',
  },
  {
    orderIndex: 7,
    category: 'Férias',
    question: 'O que são as férias proporcionais e como são calculadas?',
    answer:
      'Férias proporcionais correspondem a 1/12 do período de férias por mês trabalhado (frações de 15 dias ou mais contam como mês completo). O valor é o salário do período proporcional acrescido do terço constitucional (1/3). São devidas na rescisão, exceto em pedido de demissão com menos de 12 meses em algumas hipóteses de justa causa.',
  },
  {
    orderIndex: 8,
    category: 'Rescisão',
    question: 'Como solicitar o exame demissional?',
    answer:
      'O exame demissional (ASO demissional) deve ser realizado antes do desligamento, salvo se o último exame ocupacional tiver sido feito há menos de 135 dias (empresas de grau de risco 1 e 2) ou 90 dias (grau 3 e 4). A empresa agenda com a clínica de medicina do trabalho conveniada; o atestado de aptidão/inaptidão é obrigatório para homologar a rescisão.',
  },
  {
    orderIndex: 9,
    category: 'Afastamento',
    question: 'O que fazer em caso de afastamento por atestado médico?',
    answer:
      'Nos primeiros 15 dias de afastamento por doença, o pagamento é responsabilidade da empresa. A partir do 16º dia, o colaborador deve ser encaminhado ao INSS para requerer o auxílio por incapacidade temporária (antigo auxílio-doença). O atestado deve ser entregue ao RH/DP dentro do prazo previsto na política interna, com CID quando autorizado pelo colaborador.',
  },
  {
    orderIndex: 10,
    category: 'Encargos',
    question: 'Quais encargos incidem sobre a folha de pagamento (INSS, IRRF)?',
    answer:
      'Sobre o salário do empregado incidem o desconto de INSS (alíquotas progressivas por faixa, de 7,5% a 14%) e o IRRF (tabela progressiva, com faixa de isenção). Do lado do empregador há a contribuição patronal ao INSS, o FGTS (8%), o RAT e contribuições a terceiros (Sistema S), variando conforme o enquadramento da empresa. Os valores exatos das faixas são atualizados anualmente — confirme a tabela vigente com o contador.',
  },
];
