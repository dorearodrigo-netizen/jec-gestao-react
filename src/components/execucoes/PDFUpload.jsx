import { Upload, FileText, Trash2, Loader } from 'lucide-react'
import { useState } from 'react'
import { extractFromPDF, extractFromMultiplePDFs } from '../../services/pdfExtractService'

export function PDFUpload({ pdfs, onChange, onDadosExtraidos }) {
  const [dragActive, setDragActive] = useState(false)
  const [extraindo, setExtraindo] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = async (e, tipo) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      if (file.type === 'application/pdf') {
        const reader = new FileReader()
        reader.onload = async (event) => {
          onChange({
            ...pdfs,
            [tipo]: {
              nome: file.name,
              dados: event.target.result
            }
          })

          // Se for sentença, tenta extrair dados
          if (tipo === 'sentenca' && onDadosExtraidos) {
            try {
              setExtraindo(true)
              const dados = await extractFromPDF(file)
              onDadosExtraidos(dados)
            } catch (error) {
              console.error('Erro ao extrair dados:', error)
              alert('Erro ao extrair dados do PDF: ' + error.message)
            } finally {
              setExtraindo(false)
            }
          }
        }
        reader.readAsDataURL(file)
      } else {
        alert('Por favor, selecione um arquivo PDF')
      }
    }
  }

  const handleFileSelect = async (e, tipo) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader()
      reader.onload = async (event) => {
        onChange({
          ...pdfs,
          [tipo]: {
            nome: file.name,
            dados: event.target.result
          }
        })

        // Se for sentença ou acórdão, tenta extrair dados
        if ((tipo === 'sentenca' || tipo === 'acordao') && onDadosExtraidos) {
          try {
            setExtraindo(true)
            const dados = await extractFromPDF(file)

            // Se tiver um acórdão, tenta extrair de ambos
            if (tipo === 'acordao' && pdfs.sentenca) {
              // Reconstrói o File do sentença do Data URL
              const response = await fetch(pdfs.sentenca.dados)
              const blob = await response.blob()
              const filesSentencaAcordao = [
                new File([blob], 'sentenca.pdf', { type: 'application/pdf' }),
                file
              ]
              const dadosComReformas = await extractFromMultiplePDFs(filesSentencaAcordao)
              onDadosExtraidos(dadosComReformas)
            } else {
              onDadosExtraidos(dados)
            }
          } catch (error) {
            console.error('Erro ao extrair dados:', error)
            alert('Erro ao extrair dados do PDF: ' + error.message)
          } finally {
            setExtraindo(false)
          }
        }
      }
      reader.readAsDataURL(file)
    } else {
      alert('Por favor, selecione um arquivo PDF')
    }
  }

  const removePDF = (tipo) => {
    const newPdfs = { ...pdfs }
    delete newPdfs[tipo]
    onChange(newPdfs)
  }

  const tiposPDF = [
    { id: 'inicial', label: 'Inicial', emoji: '📄' },
    { id: 'sentenca', label: 'Sentença', emoji: '⚖️' },
    { id: 'acordao', label: 'Acórdão', emoji: '📋' }
  ]

  return (
    <div>
      <h4 className="font-semibold text-sm text-text2 uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="text-gold">📎</span> Documentos (PDFs)
      </h4>

      <div className="grid grid-cols-3 gap-4">
        {tiposPDF.map(tipo => (
          <div
            key={tipo.id}
            onDragEnter={(e) => handleDrag(e)}
            onDragLeave={(e) => handleDrag(e)}
            onDragOver={(e) => handleDrag(e)}
            onDrop={(e) => handleDrop(e, tipo.id)}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragActive ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/50'
            }`}
          >
            {pdfs[tipo.id] ? (
              <div className="space-y-3">
                <div className="text-3xl">{tipo.emoji}</div>
                <p className="text-xs font-semibold text-text2">{tipo.label}</p>
                <div className="bg-green-50 p-2 rounded flex items-center gap-2 text-xs">
                  <FileText size={14} className="text-green-600 flex-shrink-0" />
                  <span className="text-green-700 truncate">{pdfs[tipo.id].nome}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removePDF(tipo.id)}
                  className="btn btn-sm btn-red w-full"
                >
                  <Trash2 size={12} />
                  Remover
                </button>
              </div>
            ) : extraindo && tipo.id === 'sentenca' ? (
              <div className="space-y-2">
                <div className="text-3xl">{tipo.emoji}</div>
                <p className="text-xs font-semibold text-text2">{tipo.label}</p>
                <div className="flex items-center justify-center gap-2 text-xs text-blue-600">
                  <Loader size={14} className="animate-spin" />
                  <span>Extraindo dados...</span>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer space-y-2">
                  <div className="text-3xl">{tipo.emoji}</div>
                  <p className="text-xs font-semibold text-text2">{tipo.label}</p>
                  <div className="flex items-center justify-center gap-2 text-xs text-text3">
                    <Upload size={14} />
                    <span>Clique ou arraste</span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => handleFileSelect(e, tipo.id)}
                    className="hidden"
                    disabled={extraindo}
                  />
                </label>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
