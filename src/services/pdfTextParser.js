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

/**
 * Valor do dano material — busca um valor monetário PRÓXIMO a termos típicos de
 * dano material (pagamentos indevidos, restituição em dobro, repetição do
 * indébito, danos materiais, ressarcimento). Útil sobretudo na inicial, onde o
 * valor consta nos fatos e nos pedidos. Retorna '' se nada confiável for achado.
 */
function parseDanoMaterialValor(texto) {
  const num = (s) => parseFloat(s.replace(/\./g, '').replace(',', '.'))
  const termos = '(?:pagamentos?\\s+indevidos?|valor(?:es)?\\s+pagos?\\s+a\\s+maior|' +
    '(?:repeti[çc][ãa]o|restitui[çc][ãa]o)[\\s\\S]{0,30}?(?:ind[ée]bito|em\\s+dobro)|' +
    'compensa[çc][ãa]o\\s+(?:do\\s+valor|dos\\s+valores)|danos?\\s+materiais?|ressarcimento)'

  let m = texto.match(new RegExp(`${termos}[\\s\\S]{0,80}?R\\$\\s*([\\d.]+,\\d{2})`, 'i'))
  if (m) return num(m[1])
  m = texto.match(new RegExp(`R\\$\\s*([\\d.]+,\\d{2})[\\s\\S]{0,60}?${termos}`, 'i'))
  if (m) return num(m[1])
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

/**
 * Extrai a qualificação descritiva (parte após o nome) do autor e do réu a
 * partir do texto da petição inicial. Retorna o trecho que vai depois do nome,
 * ex.: "brasileiro, ... CPF ..., residente ... CEP ...". A composição final
 * ("{NOME}, {qualificação}") é feita na geração da petição.
 */
function parseQualificacoes(texto) {
  const limpa = (s) => s.replace(/\s+/g, ' ').trim().replace(/[.,;]\s*$/, '')

  // Autor: trecho iniciado pelo qualificador (brasileiro/a, ...) até o CEP.
  const autor = texto.match(
    /,\s*(brasileir[ao],[\s\S]{0,450}?CEP[\s:.ºn]*[\d.\-]+)/i
  )
  // Réu: após "em face de/do/da {NOME}," — captura "pessoa física/jurídica ... CEP".
  const reu = texto.match(
    /em face d[eoa]s?\s+[A-ZÀ-Ü][^,\n]+,\s*(pessoa\s+(?:jur[íi]dica|f[íi]sica)[\s\S]{0,550}?CEP[\s:.ºn]*[\d.\-]+)/i
  )

  return {
    qualificacao_exequente: autor ? limpa(autor[1]) : '',
    qualificacao_executado: reu ? limpa(reu[1]) : ''
  }
}

function detectarTipoDocumento(texto) {
  // Sinais FORTES de petição inicial (peça da parte, endereçada ao juízo).
  const ehInicial = /AO\s+(?:DOUTO\s+)?JU[ÍI]ZO/i.test(texto) &&
    /propor\s+a\s+presente|vem\s+propor|ajuizar?\s+a\s+presente/i.test(texto)

  // Sinais de DISPOSITIVO de decisão (juízo) — evitamos casar com ementa citada.
  const ehDecisao =
    /[ÉE]\s+o\s+relat[óo]rio\.?\s*Decido|Publique-se[.,;\s]*Intim|JULGO\s+(?:PARCIALMENTE\s+)?(?:IM)?PROCEDENTE/i.test(texto)

  // Acórdão: o órgão emissor (Turma Recursal) e a EMENTA aparecem no CABEÇALHO.
  // Numa sentença de 1º grau, "Turma Recursal" só surge no meio (instrução de
  // remessa em caso de recurso) — por isso olhamos apenas o início do documento.
  const cabecalho = texto.slice(0, 700)
  const ehAcordao = /TURMA\s+RECURSAL|RECURSO\s+INOMINADO|\bEMENTA\b/i.test(cabecalho)

  // 1) Inicial vence quando tem os sinais fortes e não é um dispositivo.
  if (ehInicial && !ehDecisao) return 'inicial'

  // 2) Acórdão (2º grau).
  if (ehAcordao) return 'acordao'

  // 3) Sentença (dispositivo ou cabeçalho "SENTENÇA").
  if (ehDecisao || /\bSENTEN[ÇC]A\b/i.test(texto)) return 'sentenca'

  // 4) Inicial (sinais mais fracos).
  if (/perante\s+Vossa\s+Excel[êe]ncia|EXORDIAL|PETI[ÇC][ÃA]O\s+INICIAL/i.test(texto)) return 'inicial'

  return 'desconhecido'
}

/** Monta o objeto de dados extraídos a partir do texto completo do PDF. */
export function parsePeticaoData(texto) {
  const partes = parseParties(texto)
  const tipo = detectarTipoDocumento(texto)
  const quali = parseQualificacoes(texto)

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
    qualificacao_exequente: quali.qualificacao_exequente,
    qualificacao_executado: quali.qualificacao_executado,
    // Valor do dano material só é sugerido a partir da INICIAL (nas decisões o
    // termo "repetição do indébito" costuma vir perto do dano moral → falso+).
    dmat_valor: tipo === 'inicial' ? parseDanoMaterialValor(texto) : '',
    tipo_documento: tipo
  }
}

export {
  parseProcessNumber, parseParties, parseVara, parsePatrono,
  parseRelator, parseDateTransito, parseDanoMoral,
  parseIndiceCorrecao, parseIndiceJuros, detectarTipoDocumento
}
