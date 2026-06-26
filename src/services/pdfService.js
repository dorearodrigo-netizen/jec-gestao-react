import { jsPDF } from 'jspdf'
import { formatarMoeda, formatarData } from './calculoService'

const TIMBRADO_HEADER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
const TIMBRADO_FOOTER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
import { API_URL as SERVER_URL } from '../config'

/**
 * Gera petição DOCX usando o modelo no servidor
 */
export async function gerarPeticaoDOCX(execucao, calculo, tipo = 'cumprimento') {
  try {
    const response = await fetch(`${SERVER_URL}/gerar-peticao`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        execucao,
        calculo,
        tipo
      })
    })

    if (!response.ok) {
      const erro = await response.json()
      throw new Error(erro.mensagem || 'Erro ao gerar petição')
    }

    const resultado = await response.json()

    if (resultado.sucesso) {
      // Fazer download automático
      window.location.href = `${SERVER_URL}${resultado.url}`
      return resultado
    } else {
      throw new Error(resultado.erro)
    }
  } catch (error) {
    console.error('Erro ao gerar petição:', error)
    throw error
  }
}

/**
 * Gera a Petição de Cumprimento de Sentença (forçada) — rascunho estruturado
 * em DOCX, montado no servidor a partir dos dados da execução e do cálculo.
 */
export async function gerarPeticaoForcadaDOCX(execucao, calculo) {
  const response = await fetch(`${SERVER_URL}/gerar-peticao-forcada`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ execucao, calculo })
  })

  const resultado = await response.json()
  if (!response.ok || !resultado.sucesso) {
    throw new Error(resultado.mensagem || resultado.erro || 'Erro ao gerar petição forçada')
  }

  window.location.href = `${SERVER_URL}${resultado.url}` // download automático
  return resultado
}

export function gerarPDFPeticao(execucao, calculo, tipo = 'cumprimento') {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait'
  })

  const PW = 210
  const ML = 25
  const MR = 25
  const MT = 20
  const LW = PW - ML - MR

  let y = MT

  const font = (sz, bold) => {
    doc.setFontSize(sz)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
  }

  const txt = (t, x, yy, opts) => {
    doc.text(t, x, yy, opts || {})
  }

  const newLine = (h = 4) => {
    y += h
  }

  const block = (t, x, w, h = 4) => {
    const lines = doc.splitTextToSize(t, w)
    doc.text(lines, x, y)
    y += lines.length * h
  }

  // Cabeçalho
  doc.setDrawColor(26, 41, 66)
  doc.setFillColor(26, 41, 66)
  doc.rect(0, 0, PW, 14, 'F')
  font(10, true)
  doc.setTextColor(255, 255, 255)
  txt('HENRIQUE LEONEL & DÓREA — ADVOCACIA', ML, 9)
  font(7, false)
  txt('OAB/BA 60.205 · OAB/BA 88.688 | Salvador/BA', ML, 13)
  doc.setTextColor(0, 0, 0)
  y = 24

  // Endereçamento
  const vara = (execucao.vara || '').replace(/(,?\s*[-–—]?\s*(turma recursal|câmara recursal|tjba).*)/i, '').trim() || 'VARA DO JEC COMPETENTE — SALVADOR/BA'
  font(10, true)
  txt('EXCELENTÍSSIMA SENHORA JUÍZA', ML, y)
  newLine(5)
  txt(vara, ML, y)
  newLine(6)

  // Dados do processo
  font(9, false)
  txt(`Processo: ${execucao.numero_processo}`, ML, y)
  newLine(4)
  txt(`Exequente: ${execucao.exequente}`, ML, y)
  newLine(4)
  txt(`Executado(a): ${execucao.executado}`, ML, y)
  newLine(8)

  // Título
  font(11, true)
  txt(`PETIÇÃO DE ${tipo === 'cumprimento' ? 'CUMPRIMENTO' : 'EXECUÇÃO FORÇADA'} DE SENTENÇA`, ML, y)
  newLine(8)

  // Fundação
  font(9, false)
  block(`Apresenta a parte exequente, por meio de seu procurador infra-assinado, contra o(a) executado(a) ${execucao.executado}, esta petição de ${tipo === 'cumprimento' ? 'cumprimento' : 'execução forçada'} de sentença, com fundamento no art. 523 e seguintes do Código de Processo Civil, pelos fatos e fundamentos que passo a expor:`, ML, LW, 5)
  newLine(3)

  // Seções
  font(10, true)
  txt('I — DO DIREITO', ML, y)
  newLine(6)
  font(9, false)
  block(`Restou reconhecido em sentença que a parte executada tem a obrigação de pagar a quantia devida a título de danos morais. O direito exigível é líquido e certo, sendo devida a correção monetária pelo índice ${execucao.dm_correcao || 'IPCA'}, e juros pelo critério ${execucao.dm_juros || 'SELIC-IPCA'}.`, ML, LW, 5)
  newLine(3)

  // Valores
  font(10, true)
  txt('II — DOS VALORES ATUALIZADOS', ML, y)
  newLine(6)
  font(9, false)
  block(`Com base nos índices oficiais do Banco Central do Brasil, o débito evoluiu da seguinte forma:`, ML, LW, 5)
  newLine(3)

  // Tabela de cálculo
  if (calculo) {
    const rows = [
      ['Principal (dano moral)', formatarMoeda(calculo.principal)],
      ['(+) Correção monetária ' + (execucao.dm_correcao || 'IPCA'), '+' + formatarMoeda(calculo.cm)],
      ['(+) Juros ' + (execucao.dm_juros || 'SELIC-IPCA'), '+' + formatarMoeda(calculo.juros)],
      ['TOTAL EXEQUENDO', formatarMoeda(calculo.total)]
    ]

    let ty = y
    rows.forEach((row, i) => {
      const isTot = i === rows.length - 1
      if (isTot) {
        doc.setFillColor(26, 41, 66)
        doc.setTextColor(255, 255, 255)
      } else if (i % 2 === 0) {
        doc.setFillColor(247, 245, 240)
        doc.setTextColor(0, 0, 0)
      } else {
        doc.setFillColor(255, 255, 255)
        doc.setTextColor(0, 0, 0)
      }
      doc.rect(ML, ty - 3, LW, 7, 'F')
      doc.setFontSize(isTot ? 9 : 8)
      doc.setFont('helvetica', isTot ? 'bold' : 'normal')
      txt(row[0], ML + 2, ty + 1.5)
      txt(row[1], ML + LW - 2, ty + 1.5, { align: 'right' })
      ty += 7
    })
    doc.setTextColor(0, 0, 0)
    y = ty + 4
  }

  // Pedidos
  newLine(3)
  font(10, true)
  txt('III — DO PEDIDO', ML, y)
  newLine(6)
  font(9, false)
  block(`Diante do exposto, requer: a) a intimação do(a) executado(a) para efetuar o pagamento voluntário no prazo legal; b) caso não haja pagamento, a expedição de mandado de penhora e avaliação de bens.`, ML, LW, 5)

  // Espaço para assinatura
  newLine(12)
  doc.line(ML, y, ML + 70, y)
  newLine(4)
  font(8, true)
  txt('Rodrigo Dórea', ML + 8, y)
  txt('Henrique Leonel', ML + 98, y)
  newLine(4)
  font(8, false)
  txt('OAB/BA 88.688', ML + 12, y)
  txt('OAB/BA 60.205', ML + 102, y)

  // Download
  const filename = `PetAo_${(execucao.numero_processo || '').replace(/\D/g, '')}_${new Date().getTime()}.pdf`
  doc.save(filename)

  return filename
}

export function exportarJSON(execucoes, alvaras) {
  const dados = {
    exportDate: new Date().toISOString(),
    execucoes,
    alvaras,
    version: '1.0'
  }

  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `jec-gestao-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
}
