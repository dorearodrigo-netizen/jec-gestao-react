import { API_URL as SERVER_URL } from '../config'

// Dados mock de IPCA (últimos meses) - em produção substituir pela API real do IBGE
const IPCA_MOCK = [
  { data: '2024-01-01', valor: 0.53 },
  { data: '2024-02-01', valor: 0.76 },
  { data: '2024-03-01', valor: 0.29 },
  { data: '2024-04-01', valor: 0.61 },
  { data: '2024-05-01', valor: 0.46 },
  { data: '2024-06-01', valor: 0.32 },
  { data: '2024-07-01', valor: 0.36 },
  { data: '2024-08-01', valor: 0.30 },
  { data: '2024-09-01', valor: 0.44 },
  { data: '2024-10-01', valor: 0.37 },
  { data: '2024-11-01', valor: 0.41 },
  { data: '2024-12-01', valor: 0.42 },
  { data: '2025-01-01', valor: 0.79 },
  { data: '2025-02-01', valor: 0.49 },
  { data: '2025-03-01', valor: 0.38 },
  { data: '2025-04-01', valor: 0.55 },
  { data: '2025-05-01', valor: 0.36 },
  { data: '2025-06-01', valor: 0.53 },
  { data: '2026-01-01', valor: 0.61 },
  { data: '2026-02-01', valor: 0.54 },
  { data: '2026-03-01', valor: 0.42 },
  { data: '2026-04-01', valor: 0.38 },
  { data: '2026-05-01', valor: 0.47 }
]

// Dados mock de SELIC (últimos meses) - em produção substituir pela API real do BACEN
const SELIC_MOCK = [
  { data: '2024-01-01', valor: 0.98 },
  { data: '2024-02-01', valor: 1.09 },
  { data: '2024-03-01', valor: 1.15 },
  { data: '2024-04-01', valor: 1.06 },
  { data: '2024-05-01', valor: 1.05 },
  { data: '2024-06-01', valor: 1.08 },
  { data: '2024-07-01', valor: 1.03 },
  { data: '2024-08-01', valor: 1.07 },
  { data: '2024-09-01', valor: 1.05 },
  { data: '2024-10-01', valor: 1.12 },
  { data: '2024-11-01', valor: 1.08 },
  { data: '2024-12-01', valor: 1.15 },
  { data: '2025-01-01', valor: 1.20 },
  { data: '2025-02-01', valor: 1.15 },
  { data: '2025-03-01', valor: 1.08 },
  { data: '2025-04-01', valor: 1.10 },
  { data: '2025-05-01', valor: 1.05 },
  { data: '2025-06-01', valor: 1.12 },
  { data: '2026-01-01', valor: 1.10 },
  { data: '2026-02-01', valor: 1.08 },
  { data: '2026-03-01', valor: 1.06 },
  { data: '2026-04-01', valor: 1.09 },
  { data: '2026-05-01', valor: 1.11 }
]

function filterByPeriod(dados, dataInicio, dataFim) {
  const inicio = new Date(dataInicio)
  const fim = new Date(dataFim)

  let resultado = dados.filter(item => {
    const date = new Date(item.data)
    return date >= inicio && date <= fim
  })

  // Se não encontrou no período, usa o índice mais recente anterior
  if (resultado.length === 0) {
    resultado = dados
      .filter(item => {
        const date = new Date(item.data)
        return date <= fim
      })
      .sort((a, b) => new Date(b.data) - new Date(a.data))
      .slice(0, 1)
  }

  return resultado
}


/**
 * Busca uma série de índice no servidor (que consulta a API oficial do BCB).
 * Em caso de qualquer falha, cai para os dados mock locais — assim o cálculo
 * nunca quebra por indisponibilidade de rede, mas prioriza o dado oficial.
 *
 * Retorna { dados, fonte } onde fonte = 'BCB' (oficial) ou 'mock' (fallback),
 * para que a interface possa avisar quando o cálculo NÃO usou dado oficial.
 */
async function buscarIndice(serie, dataInicio, dataFim, mock) {
  try {
    const url = `${SERVER_URL}/indices?serie=${serie}` +
      `&inicio=${encodeURIComponent(dataInicio)}&fim=${encodeURIComponent(dataFim)}`
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`status ${resp.status}`)

    const json = await resp.json()
    if (!json.dados?.length) throw new Error('série vazia')
    return { dados: json.dados, fonte: 'BCB' }
  } catch (error) {
    console.warn(`Índice ${serie}: usando fallback mock (${error.message})`)
    return { dados: filterByPeriod(mock, dataInicio, dataFim), fonte: 'mock' }
  }
}

export async function fetchIPCA(dataInicio, dataFim) {
  return buscarIndice('ipca', dataInicio, dataFim, IPCA_MOCK)
}

export async function fetchSelic(dataInicio, dataFim) {
  return buscarIndice('selic', dataInicio, dataFim, SELIC_MOCK)
}

/** Mapeia o nome do índice de correção para a série SGS do BCB. */
function serieCorrecao(indice = 'IPCA') {
  if (/INPC/i.test(indice)) return 'inpc'
  if (/SELIC/i.test(indice)) return 'selic'
  return 'ipca' // IPCA, IGP-M (sem série dedicada → aproxima por IPCA), Outro
}

/** Busca a série de correção conforme o índice configurado (IPCA, INPC, ...). */
export async function fetchCorrecao(indice, dataInicio, dataFim) {
  return buscarIndice(serieCorrecao(indice), dataInicio, dataFim, IPCA_MOCK)
}
