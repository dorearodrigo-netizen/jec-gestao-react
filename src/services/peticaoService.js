/**
 * Serviço de geração de petições baseado no modelo DOCX
 * Copia o modelo de cumprimento de sentença e substitui valores dinâmicos
 */

export async function gerarPeticaoCumprimento(execucao, calculo) {
  try {
    // Para desenvolvimento: simulamos a geração
    // Em produção: fazer upload do modelo DOCX para o servidor

    const peticao = {
      vara: execucao.vara || 'VARA DO JEC COMPETENTE — SALVADOR/BA',
      processo: execucao.numero_processo || '0000000-00.0000.8.05.0001',
      exequente: execucao.exequente || 'EXEQUENTE',
      executado: execucao.executado || 'EXECUTADO',

      // Valores monetários
      danoMoral: calculo?.principal || 0,
      danoMoralAtualizado: calculo?.principalCorr || 0,
      juros: calculo?.juros || 0,
      totalExequendo: calculo?.total || 0,

      // Índices
      indiceCorrecao: execucao.dm_correcao || 'IPCA',
      indiceJuros: execucao.dm_juros || 'Selic deduzido IPCA',

      // Datas
      dataTransito: execucao.data_transito || '',
      dataCitacao: execucao.dm_inicio_juros || '',

      // Dano material
      danoMaterial: execucao.dmat_valor || 0,
      descricaoDanoMaterial: execucao.dmat_descricao || '',

      // Gerado em
      dataGeracao: new Date().toLocaleDateString('pt-BR')
    }

    // Simular geração de arquivo
    console.log('Petição de cumprimento gerada com dados:', peticao)

    return {
      sucesso: true,
      mensagem: 'Petição gerada com sucesso!',
      dados: peticao
    }
  } catch (error) {
    console.error('Erro ao gerar petição:', error)
    throw new Error('Erro ao gerar petição: ' + error.message)
  }
}

/**
 * Mapeia dados extraídos para estrutura de petição
 */
export function mapearDadosParaPeticao(execucao, calculo) {
  return {
    // Endereçamento
    vara: (execucao.vara || '').replace(/(,?\s*[-–—]?\s*(turma recursal|câmara recursal|tjba).*)/i, '').trim() || 'VARA DO JEC COMPETENTE — SALVADOR/BA',

    // Identificação
    numeroProcesso: execucao.numero_processo,
    exequente: execucao.exequente,
    executado: execucao.executado,
    relator: execucao.relator,

    // Valores
    principal: calculo?.principal || 0,
    correcao: calculo?.cm || 0,
    juros: calculo?.juros || 0,
    danoMaterial: execucao.dmat_valor || 0,
    astreinte: execucao.ob_astreinte || 0,
    total: calculo?.total || 0,

    // Índices
    indiceCorrecao: execucao.dm_correcao || 'IPCA',
    indiceJuros: execucao.dm_juros || 'Selic deduzido IPCA',

    // Datas
    dataTransito: formatarDataParaBR(execucao.data_transito),
    dataCitacao: formatarDataParaBR(execucao.dm_inicio_juros),

    // Descrições
    descricaoDanoMaterial: execucao.dmat_descricao || '',
    obrigacao: execucao.ob_descricao || '',

    // Data de geração
    dataAtual: new Date().toLocaleDateString('pt-BR'),

    // Advogados (configuráveis)
    advogado1: 'HENRIQUE LEONEL DE SOUSA AZEVEDO',
    oab1: '60.205',
    advogado2: 'RODRIGO DÓREA SILVA',
    oab2: '88.688'
  }
}

/**
 * Formata data de YYYY-MM-DD para DD/MM/YYYY
 */
function formatarDataParaBR(data) {
  if (!data) return ''
  if (typeof data !== 'string') return ''

  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

/**
 * Calcula dias úteis até data futura (para prazo de 15 dias)
 */
export function calcularPrazoUteis(dataInicio, diasUteis = 15) {
  const data = new Date(dataInicio)
  let contagem = 0

  while (contagem < diasUteis) {
    data.setDate(data.getDate() + 1)
    // Pula fins de semana
    if (data.getDay() !== 0 && data.getDay() !== 6) {
      contagem++
    }
  }

  return data.toLocaleDateString('pt-BR')
}

/**
 * Formata valor monetário
 */
export function formatarMoedaBR(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}
