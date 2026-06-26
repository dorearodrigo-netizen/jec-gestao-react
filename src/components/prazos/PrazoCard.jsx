import { AlertCircle, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { infoPrazo } from '../../services'

export function PrazoCard({ execucao, feriados = [], onGerarForcado }) {
  const prazo = infoPrazo(execucao, feriados)

  // Cores baseadas no status
  const statusColors = {
    incompleto: 'bg-gray-50 border-gray-300',
    pendente: 'bg-blue-50 border-blue-300',
    aguardando_cumprimento: 'bg-yellow-50 border-yellow-300',
    prazo_vencido: 'bg-red-50 border-red-300',
    cumprimento_forcado: 'bg-orange-50 border-orange-300'
  }

  const statusIcons = {
    incompleto: <AlertCircle className="text-gray-600" size={20} />,
    pendente: <Clock className="text-blue-600" size={20} />,
    aguardando_cumprimento: <Clock className="text-yellow-600" size={20} />,
    prazo_vencido: <AlertTriangle className="text-red-600" size={20} />,
    cumprimento_forcado: <CheckCircle className="text-orange-600" size={20} />
  }

  const bgClass = statusColors[prazo.status] || statusColors.pendente
  const icon = statusIcons[prazo.status] || statusIcons.pendente

  return (
    <div className={`border-2 rounded-lg p-4 ${bgClass}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {icon}
          <div>
            <p className="font-semibold text-sm">{execucao.numero_processo}</p>
            <p className="text-xs text-gray-600 mt-1">{execucao.exequente}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-current border-opacity-20">
        <p className="text-sm font-medium">{prazo.mensagem}</p>

        {prazo.dataVencimento && (
          <div className="text-xs text-gray-600 mt-2">
            Vencimento: <strong>{prazo.dataVencimento}</strong>
          </div>
        )}
      </div>

      {prazo.vencido && !execucao.data_peticio_forcada && (
        <button
          onClick={() => onGerarForcado(execucao.id)}
          className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-2 px-3 rounded transition"
        >
          📋 Gerar Petição de Cumprimento Forçado
        </button>
      )}

      {execucao.data_peticio_forcada && (
        <div className="mt-2 text-xs bg-green-100 text-green-800 p-2 rounded">
          ✅ Petição forçada gerada em {execucao.data_peticio_forcada}
        </div>
      )}
    </div>
  )
}
