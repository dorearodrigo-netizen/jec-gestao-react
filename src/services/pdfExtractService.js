/**
 * Extração de dados de PDFs judiciais.
 *
 * A extração de texto roda no SERVIDOR (Node + pdf-parse), não no navegador:
 * - evita o worker do pdf.js e dependências de CDN (fonte dos erros anteriores);
 * - pdf-parse é uma lib madura e estável em Node;
 * - o parsing do texto fica centralizado em `pdfTextParser.js` (testável).
 */

import { API_URL as SERVER_URL } from '../config'

/** Conta quantos campos relevantes vieram preenchidos. */
function camposPreenchidos(dados) {
  const campos = ['numero_processo', 'exequente', 'executado', 'vara', 'patrono', 'dm_valor']
  return campos.filter((c) => dados?.[c] !== '' && dados?.[c] != null).length
}

/** Envia um PDF ao servidor e retorna os dados estruturados extraídos. */
export async function extractFromPDF(file) {
  const response = await fetch(`${SERVER_URL}/extract-pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/pdf' },
    body: file
  })

  const dados = await response.json()

  if (!response.ok) {
    throw new Error(dados?.mensagem || dados?.erro || `Erro HTTP ${response.status}`)
  }

  if (!dados.numero_processo && camposPreenchidos(dados) === 0) {
    throw new Error(
      'Não foi possível ler texto deste PDF. Ele pode ser digitalizado (imagem) ' +
      'e exigir OCR. Preencha os campos manualmente ou use o PDF da sentença.'
    )
  }

  return dados
}

/**
 * Extrai de múltiplos PDFs (sentença + acórdão) e mescla, preferindo o
 * documento mais completo. Detecta reformas quando há acórdão.
 */
export async function extractFromMultiplePDFs(files) {
  const resultados = []
  for (const file of files) {
    try {
      resultados.push(await extractFromPDF(file))
    } catch (err) {
      console.warn('PDF ignorado na extração múltipla:', err.message)
    }
  }

  if (resultados.length === 0) {
    throw new Error('Nenhum dos PDFs continha texto legível.')
  }

  const sentenca = resultados.find((r) => r.tipo_documento === 'sentenca')
  const acordao = resultados.find((r) => r.tipo_documento === 'acordao')

  // Base = documento mais completo (acórdão prevalece por ser mais recente).
  const base = acordao || resultados.reduce((a, b) =>
    camposPreenchidos(b) > camposPreenchidos(a) ? b : a
  )

  if (acordao && sentenca) {
    base.reformas = detectarReformas(sentenca, acordao)
    base.houve_reforma = base.reformas.length > 0
  }

  return base
}

/** Compara sentença e acórdão para sinalizar reformas relevantes. */
function detectarReformas(sentenca, acordao) {
  const reformas = []

  if (sentenca.dm_valor && !acordao.dm_valor) {
    reformas.push({
      tipo: 'dano_moral_removido',
      descricao: `Dano moral de R$ ${sentenca.dm_valor} foi removido pelo acórdão`
    })
  } else if (sentenca.dm_valor && acordao.dm_valor && sentenca.dm_valor !== acordao.dm_valor) {
    reformas.push({
      tipo: 'dano_moral_alterado',
      descricao: `Dano moral alterado de R$ ${sentenca.dm_valor} para R$ ${acordao.dm_valor}`
    })
  }

  return reformas
}
