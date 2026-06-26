/**
 * Serviço de cálculo de prazos processuais
 * Calcula dias úteis considerando finais de semana e feriados
 */

// Feriados nacionais e estaduais (TJBA)
const FERIADOS_FIXOS = [
  { mes: 1, dia: 1 },   // Ano Novo
  { mes: 4, dia: 21 },  // Tiradentes
  { mes: 5, dia: 1 },   // Dia do Trabalho
  { mes: 9, dia: 7 },   // Independência
  { mes: 10, dia: 12 }, // Nossa Senhora Aparecida
  { mes: 11, dia: 2 },  // Finados
  { mes: 11, dia: 20 }, // Consciência Negra
  { mes: 12, dia: 25 }  // Natal
]

/**
 * Verifica se uma data é feriado
 */
function ehFeriado(data, feriados = []) {
  const dia = data.getDate()
  const mes = data.getMonth() + 1

  // Verificar feriados fixos
  const ehFeriadoFixo = FERIADOS_FIXOS.some(f => f.dia === dia && f.mes === mes)
  if (ehFeriadoFixo) return true

  // Verificar feriados customizados
  return feriados.some(f => {
    const feriadoDate = new Date(f)
    return feriadoDate.getDate() === dia && feriadoDate.getMonth() === data.getMonth() && feriadoDate.getFullYear() === data.getFullYear()
  })
}

/**
 * Verifica se é dia útil (segunda a sexta, sem feriados)
 */
function ehDiaUtil(data, feriados = []) {
  const diaSemana = data.getDay()
  const ehFinaldeSemana = diaSemana === 0 || diaSemana === 6
  const ehFeriadoData = ehFeriado(data, feriados)

  return !ehFinaldeSemana && !ehFeriadoData
}

/**
 * Calcula data final após N dias úteis
 * @param {Date|string} dataInicio - Data inicial (Date ou string YYYY-MM-DD)
 * @param {number} diasUteis - Quantidade de dias úteis (padrão: 15)
 * @param {Array} feriados - Array de datas de feriados (YYYY-MM-DD)
 * @returns {Date} Data final
 */
export function calcularPrazo(dataInicio, diasUteis = 15, feriados = []) {
  let data = new Date(dataInicio)
  let contagem = 0

  // Garantir que comecemos em um dia útil
  if (!ehDiaUtil(data, feriados)) {
    data.setDate(data.getDate() + 1)
  }

  // Contar dias úteis
  while (contagem < diasUteis) {
    data.setDate(data.getDate() + 1)

    if (ehDiaUtil(data, feriados)) {
      contagem++
    }
  }

  return data
}

/**
 * Calcula quantos dias úteis faltam até uma data
 * @param {Date|string} dataFinal - Data de vencimento
 * @param {Date|string} dataAtual - Data de referência (padrão: hoje)
 * @param {Array} feriados - Array de datas de feriados
 * @returns {number} Dias úteis restantes (negativo se vencido)
 */
export function diasUteisRestantes(dataFinal, dataAtual = new Date(), feriados = []) {
  let data = new Date(dataAtual)
  const fim = new Date(dataFinal)
  let contagem = 0

  while (data < fim) {
    data.setDate(data.getDate() + 1)

    if (ehDiaUtil(data, feriados)) {
      contagem++
    }
  }

  return contagem
}

/**
 * Verifica se um prazo venceu
 */
export function prazoVencido(dataPrazo, dataAtual = new Date()) {
  return new Date(dataAtual) > new Date(dataPrazo)
}

/**
 * Formata data para string DD/MM/YYYY
 */
export function formatarData(data) {
  if (!data) return ''
  if (typeof data === 'string') {
    const [ano, mes, dia] = data.split('-')
    return `${dia}/${mes}/${ano}`
  }

  const dia = String(data.getDate()).padStart(2, '0')
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const ano = data.getFullYear()

  return `${dia}/${mes}/${ano}`
}

/**
 * Formata data para string YYYY-MM-DD
 */
export function formatarDataISO(data) {
  if (!data) return ''
  if (typeof data === 'string') return data

  const dia = String(data.getDate()).padStart(2, '0')
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const ano = data.getFullYear()

  return `${ano}-${mes}-${dia}`
}

/**
 * Calcula data de vencimento da petição de cumprimento voluntário
 * Adiciona 15 dias úteis ao trânsito em julgado
 */
export function calcularDataVencimentoCumprimento(dataTransito, feriados = []) {
  return calcularPrazo(dataTransito, 15, feriados)
}

/**
 * Status da execução baseado em datas
 */
export function statusExecucao(execucao, dataAtual = new Date(), feriados = []) {
  if (!execucao.data_transito) return 'incompleto'

  const dataVencimento = calcularPrazo(execucao.data_transito, 15, feriados)

  if (prazoVencido(dataVencimento, dataAtual)) {
    if (execucao.data_peticio_forcada) {
      return 'cumprimento_forcado'
    }
    return 'prazo_vencido'
  }

  if (execucao.data_peticio_voluntaria) {
    return 'aguardando_cumprimento'
  }

  return 'pendente'
}

/**
 * Gera informações de prazo para exibição
 */
export function infoPrazo(execucao, feriados = []) {
  if (!execucao.data_transito) {
    return {
      status: 'incompleto',
      mensagem: 'Data de trânsito em julgado não informada'
    }
  }

  const dataVencimento = calcularPrazo(execucao.data_transito, 15, feriados)
  const diasRestantes = diasUteisRestantes(dataVencimento, new Date(), feriados)
  const vencido = prazoVencido(dataVencimento)

  return {
    dataVencimento: formatarData(dataVencimento),
    diasRestantes,
    vencido,
    status: statusExecucao(execucao, new Date(), feriados),
    mensagem: vencido
      ? `Prazo vencido há ${Math.abs(diasRestantes)} dias úteis`
      : `${diasRestantes} dias úteis para cumprimento`
  }
}
