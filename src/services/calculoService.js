import { fetchCorrecao, fetchIPCA, fetchSelic } from './bacenService'

/**
 * Atualiza o crédito da execução. Dano moral E dano material recebem, cada um,
 * correção monetária (índice e termo inicial próprios) e juros de mora.
 *  - Dano moral: correção desde o arbitramento (dm_inicio_corr, Súmula 362);
 *    juros desde a citação (dm_inicio_juros).
 *  - Dano material: correção desde o desembolso (dmat_inicio_corr); juros desde
 *    a citação (mesma data dos juros do dano moral).
 */
export async function calcularExecucao(execucao, dataBase) {
  const dtCorrecaoDM = execucao.dm_inicio_corr || execucao.arb || execucao.data_transito
  const dtJuros = execucao.dm_inicio_juros || execucao.cit || execucao.data_transito
  const dtBaseStr = typeof dataBase === 'string' ? dataBase : dataBase.toISOString().split('T')[0]

  if (!dtCorrecaoDM) throw new Error('Data de início da correção (dano moral) não informada')
  if (!dtJuros) throw new Error('Data de início dos juros não informada')

  const principal = Number(execucao.dm_valor || execucao.dm) || 0
  const dmat = Number(execucao.dmat_valor || execucao.dmat) || 0
  const ast = Number(execucao.ob_astreinte || execucao.ast) || 0
  const indiceCorrecao = execucao.dm_correcao || 'IPCA'
  const indiceJuros = execucao.dm_juros || 'SELIC-IPCA'

  // Dano material: correção desde o desembolso; na falta, usa a data dos juros (citação).
  const dtCorrecaoDMat = execucao.dmat_inicio_corr || dtJuros

  const usaSelic = /selic/i.test(indiceJuros)
  const menorData = [dtCorrecaoDM, dtJuros, dtCorrecaoDMat].sort()[0]

  try {
    const [corr, selic, ipca] = await Promise.all([
      fetchCorrecao(indiceCorrecao, menorData, dtBaseStr),
      usaSelic ? fetchSelic(menorData, dtBaseStr) : Promise.resolve({ dados: [], fonte: 'BCB' }),
      usaSelic ? fetchIPCA(menorData, dtBaseStr) : Promise.resolve({ dados: [], fonte: 'BCB' })
    ])

    const corrSerie = corr.dados
    if (!corrSerie.length) throw new Error('Sem dados do índice de correção para o período')

    // Origem 'BCB' só se TODAS as séries efetivamente usadas vieram do BCB.
    const fonteIndices =
      corr.fonte === 'BCB' && (!usaSelic || (selic.fonte === 'BCB' && ipca.fonte === 'BCB'))
        ? 'BCB' : 'mock'

    const fatorCorrecao = (dtIni) => calcFator(corrSerie, dtIni, dtBaseStr, 'linear')
    const fatorJurosDe = (dtIni) => {
      if (indiceJuros === 'SELIC-IPCA' || indiceJuros === 'Selic deduzido IPCA') {
        return calcFator(selic.dados, dtIni, dtBaseStr, 'composto') /
               calcFator(ipca.dados, dtIni, dtBaseStr, 'linear')
      }
      if (indiceJuros === 'SELIC') {
        return calcFator(selic.dados, dtIni, dtBaseStr, 'composto')
      }
      return 1 + 0.01 * monthsDiff(dtIni, dtBaseStr) // 1% a.m. (juros simples)
    }

    // Dano moral
    const fatorCM = fatorCorrecao(dtCorrecaoDM)
    const fatorJuros = fatorJurosDe(dtJuros)
    const cm = principal * (fatorCM - 1)
    const principalCorr = principal + cm
    const juros = principalCorr * (fatorJuros - 1)

    // Dano material (correção + juros próprios)
    const fatorCMDmat = dmat > 0 ? fatorCorrecao(dtCorrecaoDMat) : 1
    const fatorJurosDmat = dmat > 0 ? fatorJurosDe(dtJuros) : 1 // juros desde a citação
    const cmDmat = dmat * (fatorCMDmat - 1)
    const dmatCorr = dmat + cmDmat
    const jurosDmat = dmatCorr * (fatorJurosDmat - 1)

    const r2 = (v) => Math.round(v * 100) / 100
    const total = r2(principalCorr + juros + dmatCorr + jurosDmat + ast)

    return {
      dataBase: dtBaseStr,
      fonteIndices,
      indiceCorrecao,
      indiceJuros,
      principal,
      cm: r2(cm),
      principalCorr: r2(principalCorr),
      juros: r2(juros),
      dmat,
      cmDmat: r2(cmDmat),
      dmatCorr: r2(dmatCorr),
      jurosDmat: r2(jurosDmat),
      ast,
      total,
      fatorCM: fatorCM.toFixed(6),
      fatorCMDmat: fatorCMDmat.toFixed(6),
      fatorJuros: fatorJuros.toFixed(6),
      dtCorrecaoDM,
      dtCorrecaoDMat,
      dtJuros
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
