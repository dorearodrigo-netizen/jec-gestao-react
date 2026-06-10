const BACEN_BASE_URL = 'https://www.bcb.gov.br/api/dados/v1/series'

export async function fetchBCB(serie, dataInicio, dataFim) {
  try {
    const url = `${BACEN_BASE_URL}/${serie}/dados?formato=json`
    const response = await fetch(url)
    const data = await response.json()

    if (!Array.isArray(data)) {
      return []
    }

    return data
      .filter(item => {
        const date = new Date(item.data)
        const inicio = new Date(dataInicio)
        const fim = new Date(dataFim)
        return date >= inicio && date <= fim
      })
      .map(item => ({
        data: item.data,
        valor: parseFloat(item.valor)
      }))
  } catch (error) {
    console.error('Erro ao buscar dados BACEN:', error)
    return []
  }
}

export async function fetchIPCA(dataInicio, dataFim) {
  return fetchBCB(433, dataInicio, dataFim)
}

export async function fetchSelic(dataInicio, dataFim) {
  return fetchBCB(4390, dataInicio, dataFim)
}
