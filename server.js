/**
 * Servidor simples para gerar petições DOCX
 * Copia o modelo e substitui valores dinâmicos
 *
 * Uso: node server.js (roda na porta 3001)
 */

import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PDFParse } from 'pdf-parse'
import { createWorker } from 'tesseract.js'
import { parsePeticaoData } from './src/services/pdfTextParser.js'
import { gerarPeticaoCumprimentoBuffer } from './peticaoForcada.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Worker de OCR reaproveitado entre requisições (criá-lo é caro).
let ocrWorkerPromise = null
function getOcrWorker() {
  if (!ocrWorkerPromise) ocrWorkerPromise = createWorker('por')
  return ocrWorkerPromise
}

/**
 * OCR de um PDF digitalizado: renderiza as primeiras páginas em imagem
 * (onde ficam as partes/processo) e as transcreve com o Tesseract.
 */
async function ocrPdf(buffer, maxPaginas = 3) {
  const parser = new PDFParse({ data: buffer })
  const { total } = await parser.getScreenshot({ pages: [1], scale: 1 })
  const nPaginas = Math.min(total || 1, maxPaginas)
  const paginas = Array.from({ length: nPaginas }, (_, i) => i + 1)

  const shots = await parser.getScreenshot({ pages: paginas, scale: 2 })
  await parser.destroy()

  const worker = await getOcrWorker()
  let texto = ''
  for (const pg of shots.pages || []) {
    const img = Buffer.isBuffer(pg.data) ? pg.data : Buffer.from(pg.data)
    const { data } = await worker.recognize(img)
    texto += data.text + '\n'
  }
  return texto
}

app.use(cors())
app.use(express.json())

// Rota raiz / health check (usada pela hospedagem para verificar o serviço).
app.get('/', (req, res) => {
  res.json({ servico: 'JEC Gestão — backend', status: 'ok' })
})
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

/**
 * Extrai dados estruturados de um PDF judicial.
 * POST /extract-pdf  (corpo = PDF binário)
 *
 * Faz a extração de texto com pdf-parse e o parsing com parsePeticaoData.
 * PDFs digitalizados (sem camada de texto) retornam texto vazio — sinalizamos
 * isso ao cliente em vez de inventar dados.
 */
app.post('/extract-pdf', express.raw({ type: '*/*', limit: '50mb' }), async (req, res) => {
  try {
    if (!req.body || !req.body.length) {
      return res.status(400).json({ erro: 'PDF vazio', mensagem: 'Nenhum arquivo recebido.' })
    }

    const parser = new PDFParse({ data: req.body })
    const { text } = await parser.getText()
    await parser.destroy()

    // Remove os marcadores "-- N of M --" que o pdf-parse insere entre páginas.
    let textoLimpo = (text || '').replace(/--\s*\d+\s*of\s*\d+\s*--/g, ' ')
    let viaOcr = false

    // Sem camada de texto (PDF digitalizado): cai para OCR.
    if (textoLimpo.replace(/\s/g, '').length < 30) {
      console.log('🔎 PDF sem texto — aplicando OCR...')
      textoLimpo = await ocrPdf(req.body)
      viaOcr = true
    }

    if (textoLimpo.replace(/\s/g, '').length < 30) {
      return res.json({
        tipo_documento: 'desconhecido',
        sem_texto: true,
        mensagem: 'Não foi possível ler texto do PDF, mesmo com OCR.'
      })
    }

    const dados = parsePeticaoData(textoLimpo)
    dados.via_ocr = viaOcr
    console.log(`📄 PDF extraído${viaOcr ? ' (OCR)' : ''}: ${dados.numero_processo || '(sem nº)'} — ${dados.tipo_documento}`)
    res.json(dados)
  } catch (error) {
    console.error('Erro ao extrair PDF:', error)
    res.status(500).json({ erro: 'Erro ao ler PDF', mensagem: error.message })
  }
})

/**
 * Gera a Petição de Cumprimento de Sentença (modalidade voluntária) em DOCX,
 * com cálculo atualizado (índices oficiais) e planilha de débito — mesmo
 * gerador estruturado da forçada, parametrizado por tipo.
 * POST /gerar-peticao  { execucao, calculo }
 */
app.post('/gerar-peticao', async (req, res) => {
  try {
    const { execucao, calculo } = req.body
    if (!execucao) {
      return res.status(400).json({ erro: 'Dados incompletos', mensagem: 'Envie a execução.' })
    }

    const buffer = await gerarPeticaoCumprimentoBuffer(execucao, calculo, 'voluntaria')

    const nomeArquivo = `Cumprimento_${(execucao.numero_processo || 'execucao').replace(/\D/g, '')}_${Date.now()}.docx`
    const dir = path.join(__dirname, 'downloads')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, nomeArquivo), buffer)

    console.log(`📝 Petição de cumprimento (voluntária) gerada: ${nomeArquivo}`)
    res.json({ sucesso: true, arquivo: nomeArquivo, url: `/download/${nomeArquivo}` })
  } catch (error) {
    console.error('Erro ao gerar petição:', error)
    res.status(500).json({ erro: 'Erro ao gerar petição', mensagem: error.message })
  }
})

/**
 * Gera a Petição de Cumprimento de Sentença (modalidade forçada) em DOCX,
 * a partir de um rascunho estruturado (docx-js).
 * POST /gerar-peticao-forcada  { execucao, calculo }
 */
app.post('/gerar-peticao-forcada', async (req, res) => {
  try {
    const { execucao, calculo } = req.body
    if (!execucao) {
      return res.status(400).json({ erro: 'Dados incompletos', mensagem: 'Envie a execução.' })
    }

    const buffer = await gerarPeticaoCumprimentoBuffer(execucao, calculo, 'forcada')

    const nomeArquivo = `Cumprimento_Forcado_${(execucao.numero_processo || 'execucao').replace(/\D/g, '')}_${Date.now()}.docx`
    const dir = path.join(__dirname, 'downloads')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, nomeArquivo), buffer)

    console.log(`📝 Petição forçada gerada: ${nomeArquivo}`)
    res.json({ sucesso: true, arquivo: nomeArquivo, url: `/download/${nomeArquivo}` })
  } catch (error) {
    console.error('Erro ao gerar petição forçada:', error)
    res.status(500).json({ erro: 'Erro ao gerar petição forçada', mensagem: error.message })
  }
})

/**
 * Download do arquivo gerado
 */
app.get('/download/:arquivo', (req, res) => {
  try {
    const arquivo = req.params.arquivo
    const caminho = path.join(__dirname, 'downloads', arquivo)

    if (!fs.existsSync(caminho)) {
      return res.status(404).json({ erro: 'Arquivo não encontrado' })
    }

    res.download(caminho)
  } catch (error) {
    res.status(500).json({ erro: error.message })
  }
})

/**
 * Índices oficiais do Banco Central (API SGS).
 * GET /indices?serie=ipca|selic&inicio=YYYY-MM-DD&fim=YYYY-MM-DD
 *
 * Buscar no servidor evita o bloqueio de CORS do navegador. Resposta em cache
 * (6h) por faixa de datas. Em caso de falha, o cliente cai para o mock local.
 */
const SERIES_BCB = { ipca: 433, inpc: 188, selic: 4390 } // 433 IPCA, 188 INPC, 4390 Selic acumulada no mês
const cacheIndices = new Map()
const CACHE_TTL_MS = 6 * 60 * 60 * 1000

const isoParaBr = (iso) => { const [a, m, d] = iso.split('-'); return `${d}/${m}/${a}` }
const brParaIso = (br) => { const [d, m, a] = br.split('/'); return `${a}-${m}-${d}` }

app.get('/indices', async (req, res) => {
  const { serie, inicio, fim } = req.query
  const codigo = SERIES_BCB[serie]
  if (!codigo) return res.status(400).json({ erro: 'Série inválida (use ipca ou selic).' })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio || '') || !/^\d{4}-\d{2}-\d{2}$/.test(fim || '')) {
    return res.status(400).json({ erro: 'Datas inválidas (use YYYY-MM-DD).' })
  }

  const chave = `${serie}:${inicio}:${fim}`
  const cache = cacheIndices.get(chave)
  if (cache && Date.now() - cache.ts < CACHE_TTL_MS) return res.json(cache.payload)

  try {
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados` +
      `?formato=json&dataInicial=${isoParaBr(inicio)}&dataFinal=${isoParaBr(fim)}`
    const resp = await fetch(url, { signal: AbortSignal.timeout(15000) })
    if (!resp.ok) throw new Error(`BCB respondeu ${resp.status}`)

    const bruto = await resp.json()
    const dados = bruto.map((x) => ({ data: brParaIso(x.data), valor: parseFloat(x.valor) }))
    const payload = { fonte: 'BCB', serie: codigo, dados }
    cacheIndices.set(chave, { ts: Date.now(), payload })
    console.log(`📈 Índice ${serie} (BCB ${codigo}): ${dados.length} pontos`)
    res.json(payload)
  } catch (error) {
    console.error(`Erro ao consultar BCB (${serie}):`, error.message)
    res.status(502).json({ erro: 'Falha ao consultar o Banco Central', mensagem: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Servidor de petições rodando em http://localhost:${PORT}`)
})
