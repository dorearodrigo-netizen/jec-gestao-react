import { fetchIPCA, fetchSelic } from './bacenService'

export async function calcularExecucao(execucao, dataBase) {
  const dtArb = execucao.arb
  const dtCit = execucao.cit
  const dtBaseStr = typeof dataBase === 'string' ? dataBase : dataBase.toISOString().split('T')[0]

  if (!dtArb) throw new Error('Data do arbitramento não informada')
  if (!dtCit) throw new Error('Data da citação não informada')

  try {
    const [ipca, selic] = await Promise.all([
      fetchIPCA(dtArb, dtBaseStr),
      fetchSelic(dtCit, dtBaseStr)
    ])

    if (!ipca.length) throw new Error('Sem dados IPCA para o período')
    if (!selic.length) throw new Error('Sem dados Selic para o período')

    const fatorCM = calcFator(ipca, dtArb, dtBaseStr, 'linear')
    const fatorSelic = calcFator(selic, dtCit, dtBaseStr, 'composto')
    const fatorIPCA4Juros = calcFator(ipca, dtCit, dtBaseStr, 'linear')

    let fatorJuros
    if (execucao.jurIdx === 'SELIC-IPCA') {
      fatorJuros = fatorSelic / fatorIPCA4Juros
    } else if (execucao.jurIdx === 'SELIC') {
      fatorJuros = fatorSelic
    } else {
      const ms = monthsDiff(dtCit, dtBaseStr)
      fatorJuros = 1 + 0.01 * ms
    }

    const principal = Number(execucao.dm) || 0
    const dmat = Number(execucao.dmat) || 0
    const ast = Number(execucao.ast) || 0

    const cm = principal * (fatorCM - 1)
    const principalCorr = principal + cm
    const juros = principalCorr * (fatorJuros - 1)
    const total = principalCorr + juros + dmat + ast

    return {
      dataBase: dtBaseStr,
      principal,
      cm: Math.round(cm * 100) / 100,
      principalCorr: Math.round(principalCorr * 100) / 100,
      juros: Math.round(juros * 100) / 100,
      dmat,
      ast,
      total: Math.round(total * 100) / 100,
      fatorCM: fatorCM.toFixed(6),
      fatorSelic: fatorSelic.toFixed(6),
      fatorIPCA4Juros: fatorIPCA4Juros.toFixed(6),
      fatorJuros: fatorJuros.toFixed(6),
      ultimaSelic: selic[selic.length - 1],
      ultimoIPCA: ipca[ipca.length - 1],
      ipcaSerie: ipca,
      selicSerie: selic
    }
  } catch (error) {
    console.error('Erro ao calcular execução:', error)
    throw error
  }
}

function calcFator(dados, dtInicio, dtFim, tipo) {
  if (!dados.length) return 1

  const inicio = new Date(dtInicio)
  const fim = new Date(dtFim)

  const valoresRelevantes = dados.filter(d => {
    const data = new Date(d.data)
    return data >= inicio && data <= fim
  })

  if (!valoresRelevantes.length) return 1

  if (tipo === 'linear') {
    const somaPercentuais = valoresRelevantes.reduce((s, d) => s + (d.valor || 0), 0)
    return 1 + somaPercentuais / 100
  } else if (tipo === 'composto') {
    return valoresRelevantes.reduce((fator, d) => fator * (1 + (d.valor || 0) / 100), 1)
  }

  return 1
}

function monthsDiff(dtInicio, dtFim) {
  const inicio = new Date(dtInicio)
  const fim = new Date(dtFim)
  return (fim.getFullYear() - inicio.getFullYear()) * 12 + (fim.getMonth() - inicio.getMonth())
}

export function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

export function formatarData(data) {
  if (!data) return '—'
  if (typeof data === 'string') {
    const [ano, mes, dia] = data.split('-')
    return `${dia}/${mes}/${ano}`
  }
  return new Intl.DateTimeFormat('pt-BR').format(new Date(data))
}

export function parseBRL(valor) {
  if (!valor) return 0
  return parseFloat(valor.toString().replace(/\./g, '').replace(',', '.'))
}
