/**
 * Gerador da Petição de Cumprimento de Sentença (modalidade forçada).
 *
 * Produz um .docx EDITÁVEL (docx-js) a partir dos dados da execução e do
 * cálculo atualizado. É um RASCUNHO para revisão do advogado — campos que não
 * temos como extrair (CPF, endereços, data de intimação) ficam como [colchetes].
 *
 * Fundamentos: arts. 513, 523 e §§ do CPC (multa 10% + honorários 10%, penhora),
 * art. 854 (SISBAJUD), arts. 499/536-538 (obrigação de fazer), Súmula 362 STJ.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import JSZip from 'jszip'
import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  Header, Footer
} from 'docx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Fonte padrão de toda a peça (corpo, títulos e planilha).
const FONTE = 'Times New Roman'
const TAM = 24 // 12pt (docx usa meios-pontos)

/**
 * Injeta o corpo da petição (gerado pelo docx-js) dentro do modelo de timbrado
 * do escritório (models/TIMBRADO.docx), preservando os banners de cabeçalho e
 * rodapé. Se o timbrado não existir, devolve o documento sem timbrado.
 */
async function mesclarComTimbrado(bufferPeticao) {
  const timbradoPath = path.join(__dirname, 'models', 'TIMBRADO.docx')
  if (!fs.existsSync(timbradoPath)) return bufferPeticao

  const meu = await JSZip.loadAsync(bufferPeticao)
  const meuDoc = await meu.file('word/document.xml').async('string')
  const ini = meuDoc.indexOf('<w:body>') + '<w:body>'.length
  const fim = meuDoc.indexOf('<w:sectPr')
  const conteudo = meuDoc.slice(ini, fim) // parágrafos + tabelas, sem o sectPr

  const timb = await JSZip.loadAsync(fs.readFileSync(timbradoPath))
  let timbDoc = await timb.file('word/document.xml').async('string')
  const tIni = timbDoc.indexOf('<w:body>') + '<w:body>'.length
  const tFim = timbDoc.indexOf('<w:sectPr')
  // Mantém o sectPr do timbrado (página + referências de cabeçalho/rodapé).
  timbDoc = timbDoc.slice(0, tIni) + conteudo + timbDoc.slice(tFim)
  timb.file('word/document.xml', timbDoc)

  // Padroniza a fonte padrão do modelo para Times New Roman 12.
  let styles = await timb.file('word/styles.xml').async('string')
  styles = styles.replace(
    /<w:rPrDefault>\s*<w:rPr>[\s\S]*?<\/w:rPr>\s*<\/w:rPrDefault>/,
    '<w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="pt-BR"/></w:rPr></w:rPrDefault>'
  )
  timb.file('word/styles.xml', styles)

  return timb.generateAsync({ type: 'nodebuffer' })
}

const BRL = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(Number(v) || 0)

const dataBR = (iso) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return '[data]'
  const [a, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${a}`
}

// Parágrafo de corpo: justificado, recuo de 1ª linha, espaçamento 1,5.
const par = (children, opts = {}) =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 360, after: 200 },
    indent: { firstLine: 708 }, // ~1,25 cm
    ...opts,
    children: Array.isArray(children) ? children : [new TextRun(children)]
  })

const titulo = (texto) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 240 },
    children: [new TextRun({ text: texto, bold: true })]
  })

const secao = (texto) =>
  new Paragraph({
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text: texto, bold: true })]
  })

// ---- Planilha de atualização (tabela) ----
const PLAN_COL = [6371, 2700] // soma = 9071 DXA (largura útil A4 com as margens)
const _borda = { style: BorderStyle.SINGLE, size: 1, color: 'BFBFBF' }
const _bordas = { top: _borda, bottom: _borda, left: _borda, right: _borda }

const celula = (texto, { bold = false, valor = false, shade } = {}) =>
  new TableCell({
    borders: _bordas,
    width: { size: valor ? PLAN_COL[1] : PLAN_COL[0], type: WidthType.DXA },
    shading: shade ? { fill: shade, type: ShadingType.CLEAR } : undefined,
    margins: { top: 60, bottom: 60, left: 110, right: 110 },
    children: [new Paragraph({
      alignment: valor ? AlignmentType.RIGHT : AlignmentType.LEFT,
      children: [new TextRun({ text: texto, bold })]
    })]
  })

const linhaPlanilha = (desc, valor, opts = {}) =>
  new TableRow({
    children: [
      celula(desc, { bold: opts.bold, shade: opts.shade }),
      celula(valor, { bold: opts.bold, valor: true, shade: opts.shade })
    ]
  })

export async function gerarPeticaoCumprimentoBuffer(execucao = {}, calculo = null, tipo = 'forcada') {
  const isVol = tipo === 'voluntaria'
  const {
    numero_processo, vara, exequente, executado,
    dm_valor, dmat_valor, dmat_descricao, dmat_correcao, dmat_inicio_corr,
    dm_correcao, dm_juros, dm_inicio_corr, dm_inicio_juros,
    qualificacao_exequente, qualificacao_executado,
    ob_possui, ob_descricao, ob_prazo, ob_astreinte, ob_teto, ob_cumprida
  } = execucao

  // Memória de cálculo.
  const principal = Number(dm_valor) || 0
  const dmat = calculo?.dmat ?? (Number(dmat_valor) || 0)
  const cmDmat = calculo?.cmDmat ?? 0
  const dmatCorr = calculo?.dmatCorr ?? dmat
  const jurosDmat = calculo?.jurosDmat ?? 0
  const astVencida = calculo?.ast ?? 0
  const cm = calculo?.cm ?? 0
  const juros = calculo?.juros ?? 0
  const totalAtualizado = calculo?.total ?? (principal + dmat + astVencida)
  const round2 = (v) => Math.round(v * 100) / 100
  const multa = round2(totalAtualizado * 0.10)       // art. 523, §1º
  const honorarios = round2(totalAtualizado * 0.10)   // art. 523, §1º
  const totalGeral = round2(totalAtualizado + multa + honorarios)
  const dataBase = calculo?.dataBase ? dataBR(calculo.dataBase) : dataBR(new Date().toISOString())
  const fonteOficial = calculo?.fonteIndices === 'BCB'

  const corpo = []

  // Qualificações (extraídas da inicial); fallback para placeholder.
  const qualAutor = qualificacao_exequente
    ? `, ${qualificacao_exequente},`
    : ', já qualificado(a) nos autos em epígrafe [inserir qualificação completa],'
  const qualReu = qualificacao_executado
    ? `, ${qualificacao_executado},`
    : ', pessoa [física/jurídica] já qualificada nos autos [inserir CNPJ/CPF e endereço],'

  // Endereçamento
  corpo.push(new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 320 },
    children: [new TextRun({ text: `AO DOUTO JUÍZO DA ${vara || '[VARA]'}`, bold: true })]
  }))
  corpo.push(new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 320 },
    children: [new TextRun({ text: `Processo n.º ${numero_processo || '[Nº DO PROCESSO]'}`, bold: true })]
  }))

  // Preâmbulo / qualificação
  corpo.push(par([
    new TextRun({ text: (exequente || '[EXEQUENTE]').toUpperCase(), bold: true }),
    new TextRun(`${qualAutor} por seus advogados que esta subscrevem, com instrumento de ` +
      'mandato já encartado aos autos, vem, respeitosamente, à presença de Vossa Excelência, ' +
      'com fundamento nos arts. 513, 523 e seguintes do Código de Processo Civil, promover o presente')
  ]))
  corpo.push(titulo('CUMPRIMENTO DE SENTENÇA'))
  corpo.push(par([
    new TextRun('em face de '),
    new TextRun({ text: (executado || '[EXECUTADO]').toUpperCase(), bold: true }),
    new TextRun(`${qualReu} pelas razões de fato e de direito a seguir expostas.`)
  ]))

  // I – Da decisão exequenda
  corpo.push(secao('I – DA DECISÃO EXEQUENDA E DO TRÂNSITO EM JULGADO'))
  corpo.push(par(
    `Transitada em julgado a decisão proferida nos autos, restou o(a) executado(a) condenado(a) ` +
    `ao pagamento de indenização por danos morais no valor de ${BRL(principal)}, acrescido de ` +
    `correção monetária pelo ${dm_correcao || 'IPCA'} desde a data do arbitramento (Súmula 362 do STJ) ` +
    `e de juros de mora (${dm_juros || 'Selic deduzido IPCA'}) desde a citação (art. 405 do CC c/c art. 240 do CPC).`
  ))
  if (dmat > 0) {
    corpo.push(par(
      `Houve, ainda, condenação ao ressarcimento de danos materiais no valor de ${BRL(dmat)}` +
      `${dmat_descricao ? ` (${dmat_descricao})` : ''}, igualmente integrante do crédito exequendo.`
    ))
  }
  if (ob_possui) {
    corpo.push(par(
      `A decisão impôs, ainda, obrigação de fazer consistente em ${ob_descricao || '[descrever a obrigação]'}` +
      `${ob_prazo ? `, no prazo de ${ob_prazo} dia(s)` : ''}` +
      `${ob_astreinte ? `, sob pena de multa diária (astreinte) de ${BRL(ob_astreinte)}` : ''}` +
      `${ob_teto ? `, limitada a ${BRL(ob_teto)}` : ''}.`
    ))
  }

  // II – Da ausência de pagamento voluntário
  corpo.push(secao('II – DA INTIMAÇÃO PARA PAGAMENTO E DAS CONSEQUÊNCIAS DO INADIMPLEMENTO'))
  corpo.push(par(
    'Requer-se a intimação do(a) executado(a), na pessoa de seu advogado constituído nos autos ' +
    '(art. 513, §2º, I, do CPC), para que, no prazo de 15 (quinze) dias úteis, efetue o pagamento ' +
    'do débito atualizado adiante demonstrado.'
  ))
  corpo.push(par(
    'Decorrido o prazo legal sem o pagamento voluntário, o débito será acrescido de multa de 10% ' +
    '(dez por cento) e de honorários advocatícios de 10% (dez por cento), nos termos do art. 523, §1º, ' +
    'do CPC, prosseguindo-se com os atos de expropriação. [Caso a intimação já tenha ocorrido e o prazo ' +
    'transcorrido in albis, os referidos acréscimos já incidem, requerendo-se desde logo a penhora.]'
  ))

  // III – Do débito atualizado (com planilha)
  const principalCorr = calculo?.principalCorr ?? (principal + cm)
  const periodoCorr = dm_inicio_corr ? ` (${dataBR(dm_inicio_corr)} a ${dataBase})` : ''
  const periodoJuros = dm_inicio_juros ? ` (${dataBR(dm_inicio_juros)} a ${dataBase})` : ''
  const fatorCorr = calculo?.fatorCM ? `, fator ${calculo.fatorCM}` : ''
  const fatorJur = calculo?.fatorJuros ? `, fator ${calculo.fatorJuros}` : ''
  const semDetalhe = !calculo || (cm === 0 && juros === 0 && totalAtualizado > principal)

  corpo.push(secao('III – DO DÉBITO ATUALIZADO — PLANILHA DE CÁLCULO'))
  corpo.push(par(
    `O crédito exequendo foi atualizado conforme os parâmetros da decisão exequenda, ` +
    `apurando-se o débito na forma da planilha abaixo, com data-base em ${dataBase}:`
  ))

  const linhas = [
    new TableRow({
      tableHeader: true,
      children: [
        celula('Discriminação', { bold: true, shade: 'D9E2F3' }),
        celula('Valor (R$)', { bold: true, valor: true, shade: 'D9E2F3' })
      ]
    }),
    linhaPlanilha('Principal (danos morais)', BRL(principal)),
    linhaPlanilha(`Correção monetária — ${dm_correcao || 'IPCA'}${periodoCorr}${fatorCorr}`, `+ ${BRL(cm)}`),
    linhaPlanilha('Principal corrigido', BRL(principalCorr)),
    linhaPlanilha(`Juros de mora — ${dm_juros || 'Selic deduzido IPCA'}${periodoJuros}${fatorJur}`, `+ ${BRL(juros)}`)
  ]
  if (dmat > 0) {
    const periodoCorrDmat = dmat_inicio_corr ? ` (${dataBR(dmat_inicio_corr)} a ${dataBase})` : ''
    const fatorCorrDmat = calculo?.fatorCMDmat ? `, fator ${calculo.fatorCMDmat}` : ''
    linhas.push(
      linhaPlanilha(`Danos materiais${dmat_descricao ? ` (${dmat_descricao.trim()})` : ''}`, `+ ${BRL(dmat)}`),
      linhaPlanilha(`Correção monetária — ${dmat_correcao || dm_correcao || 'INPC'}${periodoCorrDmat}${fatorCorrDmat}`, `+ ${BRL(cmDmat)}`),
      linhaPlanilha('Dano material corrigido', BRL(dmatCorr)),
      linhaPlanilha(`Juros de mora — ${dm_juros || 'Selic deduzido IPCA'}${periodoJuros}`, `+ ${BRL(jurosDmat)}`)
    )
  }
  if (astVencida > 0) {
    linhas.push(linhaPlanilha('Multa diária (astreinte) já vencida', `+ ${BRL(astVencida)}`))
  }
  linhas.push(
    linhaPlanilha(`Subtotal atualizado até ${dataBase}`, BRL(totalAtualizado), { bold: true, shade: 'F2F2F2' }),
    linhaPlanilha('Multa de 10% (art. 523, §1º, do CPC)', `+ ${BRL(multa)}`),
    linhaPlanilha('Honorários de 10% (art. 523, §1º, do CPC)', `+ ${BRL(honorarios)}`),
    linhaPlanilha('TOTAL GERAL', BRL(totalGeral), { bold: true, shade: 'D9E2F3' })
  )

  corpo.push(new Table({
    width: { size: 9071, type: WidthType.DXA },
    columnWidths: PLAN_COL,
    rows: linhas
  }))

  corpo.push(par(
    fonteOficial
      ? `Os índices de atualização são os oficiais do Banco Central do Brasil ` +
        `(correção pelo ${dm_correcao || 'IPCA'} e juros ${dm_juros || 'Selic deduzido IPCA'}), ` +
        `apurados até ${dataBase}.`
      : `[ATENÇÃO: revisar — a planilha pode ter utilizado índices de contingência. ` +
        `Recalcular com os índices oficiais do BCB antes do protocolo.]`,
    { spacing: { before: 160, after: 200 } }
  ))
  if (semDetalhe) {
    corpo.push(par(
      '[ATENÇÃO: a planilha não detalhou a correção e os juros. Realize o cálculo na ' +
      'tela (botão “Calcular”, informando as datas de início da correção e dos juros) ' +
      'antes de gerar a petição, para que a memória de cálculo fique completa.]'
    ))
  }

  // IV – Obrigação de fazer (condicional)
  if (ob_possui) {
    corpo.push(secao('IV – DA OBRIGAÇÃO DE FAZER'))
    if (ob_cumprida === false) {
      corpo.push(par(
        `O(a) executado(a) não comprovou nos autos o cumprimento da obrigação de fazer acima descrita. ` +
        `Requer-se, por isso, sua intimação para que apresente prova inequívoca do efetivo cumprimento, ` +
        `no prazo assinalado por este Juízo, sob as penas da lei (arts. 536 e 537 do CPC).`
      ))
      corpo.push(par(
        `Persistindo o descumprimento, requer-se a incidência e a apuração da multa diária (astreinte)` +
        `${ob_astreinte ? ` de ${BRL(ob_astreinte)}` : ''}` +
        `${ob_teto ? `, até o limite de ${BRL(ob_teto)}` : ''}, desde o vencimento do prazo até o efetivo ` +
        `cumprimento, com a incorporação do respectivo valor ao débito exequendo; ou, subsidiariamente, ` +
        `a conversão da obrigação de fazer em perdas e danos, nos termos do art. 499 do CPC.`
      ))
    } else if (ob_cumprida === true) {
      corpo.push(par(
        'Registra-se que a obrigação de fazer foi cumprida, restando, quanto a este ponto, ' +
        'apenas a execução da quantia certa acima demonstrada.'
      ))
    } else {
      corpo.push(par(
        '[Verificar com o operador se a obrigação de fazer foi cumprida pelo executado, para definição ' +
        'do pedido pertinente — cobrança de prova de cumprimento e astreinte, ou conversão em perdas e danos.]'
      ))
    }
  }

  // V – Dos pedidos
  corpo.push(secao('V – DOS PEDIDOS'))
  corpo.push(par('Ante o exposto, requer:'))
  corpo.push(par('a) a intimação do(a) executado(a), na pessoa de seu advogado constituído nos autos ' +
    '(art. 513, §2º, I, do CPC), para pagamento do débito atualizado no prazo de 15 (quinze) dias úteis;',
    { indent: { left: 708 } }))
  corpo.push(par('b) não efetuado o pagamento, a incidência da multa de 10% e dos honorários advocatícios ' +
    'de 10%, nos termos do art. 523, §1º, do CPC, sobre o valor do débito;',
    { indent: { left: 708 } }))
  corpo.push(par(
    (isVol
      ? 'c) caso não efetuado o pagamento no prazo legal, a penhora de ativos financeiros do(a) executado(a) '
      : 'c) a penhora de ativos financeiros do(a) executado(a) ') +
    'por meio do sistema SISBAJUD, nos termos dos arts. 523, §3º, e 854 do CPC, e, sucessivamente, ' +
    'de outros bens, na ordem do art. 835 do CPC;',
    { indent: { left: 708 } }))
  if (ob_possui && ob_cumprida === false) {
    corpo.push(par('d) a intimação do(a) executado(a) para apresentar prova do cumprimento da obrigação de fazer, ' +
      'sob pena de incidência da astreinte até o efetivo cumprimento, ou, subsidiariamente, a conversão da ' +
      'obrigação em perdas e danos (art. 499 do CPC), incorporando-se o valor ao débito;',
      { indent: { left: 708 } }))
  }
  corpo.push(par('Requer, por fim, a procedência integral do presente cumprimento de sentença.',
    { indent: { firstLine: 708 } }))

  // Fecho
  corpo.push(par('Nestes termos,', { indent: { firstLine: 708 }, spacing: { before: 240, after: 0 } }))
  corpo.push(par('Pede deferimento.', { indent: { firstLine: 708 }, spacing: { after: 320 } }))
  corpo.push(new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { after: 360 },
    children: [new TextRun(`Salvador/BA, ${dataBR(new Date().toISOString())}.`)]
  }))
  // Duas assinaturas (Henrique Leonel e Rodrigo Dórea).
  const assinatura = (nome, oab) => [
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { before: 360, after: 0 },
      children: [new TextRun({ text: '____________________________________' })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 0 },
      children: [new TextRun({ text: nome, bold: true })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun(`Advogado — ${oab}`)]
    })
  ]
  corpo.push(...assinatura('HENRIQUE LEONEL DE SOUSA AZEREDO', 'OAB/BA 60.205'))
  corpo.push(...assinatura('RODRIGO DÓREA', 'OAB/BA 88.688'))

  // Timbrado (cabeçalho em todas as páginas).
  const timbrado = new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { after: 0 },
        children: [new TextRun({ text: 'RODRIGO DÓREA & HENRIQUE LEONEL', bold: true, size: 28 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER, spacing: { after: 120 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1F3864', space: 4 } },
        children: [new TextRun({ text: 'Advocacia  ·  OAB/BA 88.688  ·  OAB/BA 60.205', size: 18 })]
      })
    ]
  })

  const rodape = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF', space: 4 } },
        children: [new TextRun({ text: 'Salvador — Bahia', size: 16, color: '666666' })]
      })
    ]
  })

  const doc = new Document({
    styles: { default: { document: { run: { font: FONTE, size: TAM } } } },
    sections: [{
      properties: { page: { margin: { top: 1418, right: 1134, bottom: 1418, left: 1701 } } }, // ~2,5/2/2,5/3 cm
      headers: { default: timbrado },
      footers: { default: rodape },
      children: corpo
    }]
  })

  const buffer = await Packer.toBuffer(doc)
  return mesclarComTimbrado(buffer)
}
