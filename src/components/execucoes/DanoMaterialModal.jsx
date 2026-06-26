import { AlertCircle, DollarSign } from 'lucide-react'
import { useState } from 'react'

export function DanoMaterialModal({ onConfirm, onCancel }) {
  const [temDanoMaterial, setTemDanoMaterial] = useState(null)
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [erro, setErro] = useState('')

  const handleConfirm = () => {
    setErro('')

    if (temDanoMaterial === null) {
      setErro('Você deve selecionar uma opção')
      return
    }

    if (temDanoMaterial && !valor) {
      setErro('Informe o valor do dano material')
      return
    }

    onConfirm({
      dmat_valor: temDanoMaterial ? parseFloat(valor) : 0,
      dmat_descricao: temDanoMaterial ? descricao : ''
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="card p-8 max-w-md w-full mx-4 space-y-6">
        <div className="flex items-center gap-3">
          <AlertCircle size={24} className="text-orange-600" />
          <h2 className="text-lg font-bold text-text">Dano Material (Obrigatório)</h2>
        </div>

        <p className="text-sm text-text3">
          Houve condenação em dano material neste caso?
        </p>

        {/* Opção 1: Não houve */}
        <button
          onClick={() => {
            setTemDanoMaterial(false)
            setErro('')
          }}
          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
            temDanoMaterial === false
              ? 'border-blue-600 bg-blue-50'
              : 'border-border hover:border-blue-400'
          }`}
        >
          <div className="font-semibold text-text">
            ✓ Não houve condenação em dano material
          </div>
          <p className="text-xs text-text3 mt-1">
            A sentença/acórdão não condenou em dano material
          </p>
        </button>

        {/* Opção 2: Houve */}
        <button
          onClick={() => {
            setTemDanoMaterial(true)
            setErro('')
          }}
          className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
            temDanoMaterial === true
              ? 'border-blue-600 bg-blue-50'
              : 'border-border hover:border-blue-400'
          }`}
        >
          <div className="font-semibold text-text">
            💰 Houve condenação em dano material
          </div>
          <p className="text-xs text-text3 mt-1">
            A sentença/acórdão condenou em dano material (especificar abaixo)
          </p>
        </button>

        {/* Campos condicionais */}
        {temDanoMaterial === true && (
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <label className="label">Valor do Dano Material (R$) *</label>
              <input
                type="number"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                step="0.01"
                className="input"
              />
            </div>

            <div>
              <label className="label">Descrição (ex: restituição em dobro)</label>
              <input
                type="text"
                placeholder="Descrição do dano material"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="input"
              />
            </div>
          </div>
        )}

        {/* Erro */}
        {erro && (
          <div className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-700">
            {erro}
          </div>
        )}

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
