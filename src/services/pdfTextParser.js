/**
 * Parser de texto de documentos judiciais (PJe / TJBA).
 *
 * Funções puras (sem dependências de DOM ou Node) — podem rodar tanto no
 * servidor (após extração com pdf-parse) quanto em testes unitários.
 *
 * Filosofia: extrair apenas o que é CONFIÁVEL. Campos ambíguos (valores de
 * condenação em sentenças parcialmente procedentes, datas de trânsito ausentes)
 * são deixados vazios para revisão humana, em vez de inventar dados.
 */

const MESES = {
  janeiro: '01', fevereiro: '02', março: '03', marco: '03', abril: '04',
  maio: '05', junho: '06', julho: '07', agosto: '08', setembro: '09',
  outubro: '10', novembro: '11', dezembro: '12'
}

function colapsar(texto) {
  return texto.replace(/\s+/g, ' ').trim()
}

function parseProcessNumber(texto) {
  const m = texto.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/)
  return m ? m[0] : ''
}

/**
 * Extrai as partes cobrindo os layouts comuns do TJBA:
 *   - PJe:      "AUTOR: NOME" / "REU: NOME" (nome na mesma linha)
 *   - PROJUDI:  "AUTORES:\nNOME" / "RÉUS:\nNOME" (nome na linha seguinte)
 *   - Acórdão:  "Recorrente(s): NOME" / "Recorrido(s): NOME"
 * Mapeia recorrente→exequente e recorrido→executado (revisável pelo usuário).
 */
const ROTULOS_EXEQUENTE = 'AUTOR(?:A|ES|AS)?|EXEQUENTE(?:\\(S\\)|S)?|RECORRENTE(?:\\(S\\)|S)?|REQUERENTE(?:\\(S\\)|S)?|IMPETRANTE|RECLAMANTE'
const ROTULOS_EXECUTADO = 'R[ÉE]US?|EXECUTAD[OA](?:\\(S\\)|S)?|RECORRID[OA](?:\\(S\\)|S)?|REQUERID[OA](?:\\(S\\)|S)?|IMPETRAD[OA]|RECLAMAD[OA]'

function limparNome(nome) {
  // Remove advogado/OAB/observações que venham coladas ao nome.
  return colapsar(nome.replace(/\s*(?:\(.*$|advogad.*$|OAB.*$|registrad.*$|brasileir.*$)/i, ''))
}

function extrairPolo(texto, rotulos, rotulosOpostos) {
  const linhas = texto.split('\n')
  const reLabel = new RegExp(`^\\s*(?:${rotulos})\\s*:[ \\t]*(.*)$`, 'i')
  const reOposto = new RegExp(`^\\s*(?:${rotulosOpostos})\\s*:`, 'i')

  for (let i = 0; i < linhas.length; i++) {
    const m = linhas[i].match(reLabel)
    if (!m) continue

    // Caso 1: nome na mesma linha do rótulo.
    const mesmaLinha = limparNome(m[1])
    if (mesmaLinha.length >= 3) return mesmaLinha

    // Caso 2: nome na próxima linha não-vazia (PROJUDI).
    for (let j = i + 1; j < Math.min(i + 4, linhas.length); j++) {
      const prox = linhas[j].trim()
      if (!prox) continue
      if (reOposto.test(prox) || /^(SENTEN[ÇC]A|EMENTA|ADVOGAD|DOCUMENTOS?)\b/i.test(prox)) break
      const nome = limparNome(prox)
      if (nome.length >= 3) return nome
      break
    }
  }
  return ''
}

function parseParties(texto) {
  return {
    exequente: extrairPolo(texto, ROTULOS_EXEQUENTE, ROTULOS_EXECUTADO),
    executado: extrairPolo(texto, ROTULOS_EXECUTADO, ROTULOS_EXEQUENTE)
  }
}

/** Vara / órgão julgador — cobre PJe ("Órgão julgador:") e PROJUDI (cabeçalho). */
function parseVara(texto) {
  // PJe: rótulo explícito (pode ocupar duas linhas).
  const orgao = texto.match(
    /[ÓO]rg[ãa]o\s+[Jj]ulgador\s*:?\s*([\s\S]{0,180}?)(?=\n\s*(?:[ÚU]ltima|Processo|Valor|Assuntos|AUTOR|Segredo)\b|\n\n)/i
  )
  if (orgao) return colapsar(orgao[1])

  // PROJUDI/1º grau: linha de vara no cabeçalho (ex.: "8ª VSJE DO CONSUMIDOR (VESPERTINO) - PROJUDI").
  const vsje = texto.match(/^[^\n]*\b\d+[ªa]?\s*V(?:SJE|ARA|\b)[^\n]*$/im)
  if (vsje) return colapsar(vsje[0].replace(/\s*-\s*PROJUDI.*$/i, ''))

  // 2º grau: Turma Recursal.
  const turma = texto.match(/((?:PRIMEIRA|SEGUNDA|TERCEIRA|QUARTA|QUINTA|SEXTA|S[ÉE]TIMA|OITAVA|NONA|D[ÉE]CIMA|\d+[ªa]?)\s+TURMA\s+RECURSAL)/i)
  if (turma) return colapsar(turma[1])

  return ''
}

/** Advogado da parte ré (patrono do executado, usado no endereçamento). */
function parsePatrono(texto) {
  const m = texto.match(
    /(?:R[ÉE]U|EXECUTADO|REQUERIDO)\s*:[^\n]*\n\s*Advogado\(s\)\s*:\s*([^\n(]+?)\s*(?:\(OAB|registrado|\n)/i
  )
  return m ? colapsar(m[1]) : ''
}

function parseRelator(texto) {
  const m = texto.match(/Relator(?:\(a\))?\s*:?\s*(?:Des(?:embargador)?\.?\s*)?([A-ZÀ-Ü][A-ZÀ-Üa-zà-ü\s.]+?)(?=\n|$)/)
  return m ? colapsar(m[1]) : ''
}

function dataISO(dia, mes, ano) {
  return `${ano}-${mes}-${String(dia).padStart(2, '0')}`
}

/** Data de trânsito em julgado, se explicitamente mencionada. */
function parseDateTransito(texto) {
  let m = texto.match(/tr[âa]nsito\s+em\s+julgado[^\d]{0,40}(\d{1,2})\/(\d{1,2})\/(\d{4})/i)
  if (m) return dataISO(m[1], m[2].padStart(2, '0'), m[3])

  m = texto.match(/tr[âa]nsito\s+em\s+julgado[^\d]{0,40}(\d{1,2})\s+de\s+([a-zç]+)\s+de\s+(\d{4})/i)
  if (m && MESES[m[2].toLowerCase()]) return dataISO(m[1], MESES[m[2].toLowerCase()], m[3])

  return ''
}

/**
 * Valor de danos morais — extraído apenas quando há condenação efetiva.
 * Se o pedido foi julgado improcedente / rejeitado, retorna vazio.
 */
function parseDanoMoral(texto) {
  const lower = texto.toLowerCase()

  // Se danos morais foram negados, não há valor a executar.
  if (/(improcedente|rejeito|nego|afasto)[^.]{0,80}danos?\s+mora/i.test(texto) ||
      /danos?\s+mora[^.]{0,80}(improcedente|rejeitad|indevid)/i.test(lower)) {
    return ''
  }

  // Condenação explícita: "condeno ... R$ X ... danos morais" ou "arbitro ... em R$ X"
  const m = texto.match(
    /(?:condeno|arbitr[oa]|fixo)[^.]{0,120}?danos?\s+mora[^.]{0,120}?R\$\s*([\d.]+,\d{2})/i
  ) || texto.match(
    /danos?\s+mora[^.]{0,120}?(?:no valor de|em|de)\s*R\$\s*([\d.]+,\d{2})/i
  )

  if (m) return parseFloat(m[1].replace(/\./g, '').replace(',', '.'))
  return ''
}

function parseIndiceCorrecao(texto) {
  if (/IPCA-?E?/i.test(texto)) return 'IPCA'
  if (/INPC/i.test(texto)) return 'INPC'
  if (/IGP-?M/i.test(texto)) return 'IGP-M'
  return 'IPCA'
}

function parseIndiceJuros(texto) {
  if (/selic\s+deduzid|selic\s*-\s*ipca/i.test(texto)) return 'Selic deduzido IPCA'
  // 1% ao mês: "1% ao mês", "1% a.m.", "um por cento ao mês" ou citação ao art. 405 CC.
  if (/\b1\s*%\s*a(?:o|\.)?\s*m[êe]?s?\b|um por cento ao m[êe]s|art(?:igo)?\.?\s*405/i.test(texto)) return '1% a.m.'
  if (/\bselic\b/i.test(texto)) return 'SELIC'
  return 'Selic deduzido IPCA'
}

function detectarTipoDocumento(texto) {
  // 1) Acórdão (2º grau).
  if (/RECURSO\s+INOMINADO|TURMA\s+RECURSAL|AC[ÓO]RD[ÃA]O/i.test(texto)) return 'acordao'

  // 2) Decisão (sentença): sinais que SÓ aparecem em decisão do juízo —
  //    "JULGO (parcialmente) procedente/improcedente", "É o relatório", "Decido".
  //    Usamos "JULGO" (1ª pessoa do juiz), não "julgar" (pedido da inicial).
  if (/JULGO\s+(PARCIALMENTE\s+)?(IM)?PROCEDENTE|[ÉE]\s+o\s+relat[óo]rio|\bDecido\b|DISPOSITIVO/i.test(texto)) {
    return 'sentenca'
  }

  // 3) Petição inicial: peça da parte endereçada ao juízo (valores são PEDIDOS).
  if (/perante\s+Vossa\s+Excel[êe]ncia|propor\s+a\s+presente|AO\s+JU[ÍI]ZO|EXORDIAL|PETI[ÇC][ÃA]O\s+INICIAL/i.test(texto)) {
    return 'inicial'
  }

  if (/SENTEN[ÇC]A/i.test(texto)) return 'sentenca'
  return 'desconhecido'
}

/** Monta o objeto de dados extraídos a partir do texto completo do PDF. */
export function parsePeticaoData(texto) {
  const partes = parseParties(texto)
  const tipo = detectarTipoDocumento(texto)

  // Valor de condenação só faz sentido em sentença/acórdão. Numa inicial os
  // valores são PEDIDOS (ainda não concedidos), então não os preenchemos.
  const ehDecisao = tipo === 'sentenca' || tipo === 'acordao'

  return {
    numero_processo: parseProcessNumber(texto),
    exequente: partes.exequente,
    executado: partes.executado,
    vara: parseVara(texto),
    patrono: parsePatrono(texto),
    relator: parseRelator(texto),
    data_transito: parseDateTransito(texto),
    dm_valor: ehDecisao ? parseDanoMoral(texto) : '',
    dm_correcao: parseIndiceCorrecao(texto),
    dm_juros: parseIndiceJuros(texto),
    tipo_documento: tipo
  }
}

export {
  parseProcessNumber, parseParties, parseVara, parsePatrono,
  parseRelator, parseDateTransito, parseDanoMoral,
  parseIndiceCorrecao, parseIndiceJuros, detectarTipoDocumento
}
