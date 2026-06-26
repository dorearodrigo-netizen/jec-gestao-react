import { Calendar } from 'lucide-react'
import { useState } from 'react'

export function DateCitationModal({ onConfirm, onCancel }) {
  const [dataCitacao, setDataCitacao] = useState('')
  const [dataTransito, setDataTransito] = useState('')
  const [erros, setErros] = useState({})

  const validarData = (data) => {
    // Valida formato DD/MM/AAAA
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/
    if (!regex.test(data)) return false

    const [dia, mes, ano] = data.split('/').map(Number)
    if (mes < 1 || mes > 12) return false
    if (dia < 1 || dia > 31) return false
    if (ano < 2000 || ano > new Date().getFullYear()) return false

    return true
  }

  const handleConfirm = () => {
    const novoErros = {}

    if (!dataCitacao) {
      novoErros.dataCitacao = 'Data de citação é obrigatória'
    } else if (!validarData(dataCitacao)) {
      novoErros.dataCitacao = 'Formato inválido (DD/MM/AAAA)'
    }

    if (!dataTransito) {
      novoErros.dataTransito = 'Data de trânsito em julgado é obrigatória'
    } else if (!validarData(dataTransito)) {
      novoErros.dataTransito = 'Formato inválido (DD/MM/AAAA)'
    }

    if (Object.keys(novoErros).length > 0) {
      setErros(novoErros)
      return
    }

    // Converte DD/MM/AAAA para AAAA-MM-DD
    const converterData = (data) => {
      const [dia, mes, ano] = data.split('/')
      return `${ano}-${mes}-${dia}`
    }

    onConfirm({
      dm_inicio_juros: converterData(dataCitacao),
      data_transito: converterData(dataTransito)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="card p-8 max-w-md w-full mx-4 space-y-6">
        <div className="flex items-center gap-3">
          <Calendar size={24} className="text-blue-600" />
          <h2 className="text-lg font-bold text-text">Datas Processuais Obrigatórias</h2>
        </div>

        <p className="text-sm text-text3">
          Os PDFs não contêm essas datas. Por favor, preencha no formato DD/MM/AAAA:
        </p>

        {/* Data de Citação */}
        <div>
          <label className="label">Data da Citação *</label>
          <input
            type="text"
            placeholder="DD/MM/AAAA"
            value={dataCitacao}
            onChange={(e) => {
              setDataCitacao(e.target.value)
              if (erros.dataCitacao) {
                setErros(prev => ({ ...prev, dataCitacao: '' }))
              }
            }}
            className={`input ${erros.dataCitacao ? 'border-red-500' : ''}`}
          />
          {erros.dataCitacao && (
            <p className="text-xs text-red-600 mt-1">{erros.dataCitacao}</p>
          )}
          <p className="text-xs text-text3 mt-1">Data do recebimento da citação</p>
        </div>

        {/* Data de Trânsito em Julgado */}
        <div>
          <label className="label">Data de Trânsito em Julgado *</label>
          <input
            type="text"
            placeholder="DD/MM/AAAA"
            value={dataTransito}
            onChange={(e) => {
              setDataTransito(e.target.value)
              if (erros.dataTransito) {
                setErros(prev => ({ ...prev, dataTransito: '' }))
              }
            }}
            className={`input ${erros.dataTransito ? 'border-red-500' : ''}`}
          />
          {erros.dataTransito && (
            <p className="text-xs text-red-600 mt-1">{erros.dataTransito}</p>
          )}
          <p className="text-xs text-text3 mt-1">Data quando a sentença/acórdão ficou final</p>
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            className="btn flex-1"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn btn-primary flex-1"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
