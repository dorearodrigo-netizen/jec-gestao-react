import { formatarData } from '../../services'
import { Clock, AlertCircle } from 'lucide-react'

export function Prazos({ execucoes }) {
  const hoje = new Date()

  const calcularDiasRestantes = (data) => {
    if (!data) return null
    const dataExec = new Date(data)
    const diffTime = dataExec - hoje
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatus = (diasRestantes) => {
    if (diasRestantes === null) return 'sem-data'
    if (diasRestantes < 0) return 'vencido'
    if (diasRestantes <= 7) return 'critico'
    if (diasRestantes <= 30) return 'atencao'
    return 'normal'
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'vencido': return '⚠️ Vencido'
      case 'critico': return '🔴 Crítico (≤7 dias)'
      case 'atencao': return '🟡 Atenção (≤30 dias)'
      case 'normal': return '🟢 Normal'
      default: return '⚪ Sem data'
    }
  }

  const prazosProcessuais = execucoes
    .map(exec => ({
      id: exec.id,
      numero_processo: exec.numero_processo,
      exequente: exec.exequente,
      executado: exec.executado,
      status: exec.status,
      data_transito: exec.data_transito,
      diasRestantes: calcularDiasRestantes(exec.data_transito),
    }))
    .filter(p => p.data_transito)
    .sort((a, b) => {
      const statusOrder = { vencido: 0, critico: 1, atencao: 2, normal: 3, 'sem-data': 4 }
      const statusA = getStatus(a.diasRestantes)
      const statusB = getStatus(b.diasRestantes)
      return statusOrder[statusA] - statusOrder[statusB]
    })

  if (prazosProcessuais.length === 0) {
    return (
      <div className="text-center py-20">
        <Clock size={56} className="mx-auto mb-4 text-text3 opacity-30" />
        <p className="text-lg text-text2 mb-2">Nenhum prazo cadastrado</p>
        <p className="text-sm text-text3">Adicione datas de trânsito nas execuções</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumo de Prazos */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4 bg-red-50 border-l-4 border-red-600">
          <p className="text-xs text-red-700 uppercase font-semibold mb-1">Vencidos</p>
          <p className="text-2xl font-bold text-red-600">
            {prazosProcessuais.filter(p => getStatus(p.diasRestantes) === 'vencido').length}
          </p>
        </div>
        <div className="card p-4 bg-orange-50 border-l-4 border-orange-600">
          <p className="text-xs text-orange-700 uppercase font-semibold mb-1">Críticos</p>
          <p className="text-2xl font-bold text-orange-600">
            {prazosProcessuais.filter(p => getStatus(p.diasRestantes) === 'critico').length}
          </p>
        </div>
        <div className="card p-4 bg-yellow-50 border-l-4 border-yellow-600">
          <p className="text-xs text-yellow-700 uppercase font-semibold mb-1">Em Atenção</p>
          <p className="text-2xl font-bold text-yellow-600">
            {prazosProcessuais.filter(p => getStatus(p.diasRestantes) === 'atencao').length}
          </p>
        </div>
        <div className="card p-4 bg-green-50 border-l-4 border-green-600">
          <p className="text-xs text-green-700 uppercase font-semibold mb-1">Normais</p>
          <p className="text-2xl font-bold text-green-600">
            {prazosProcessuais.filter(p => getStatus(p.diasRestantes) === 'normal').length}
          </p>
        </div>
      </div>

      {/* Tabela de Prazos */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="px-6 py-4 text-left text-xs font-semibold text-text2 uppercase">Nº Processo</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text2 uppercase">Exequente</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text2 uppercase">Data Trânsito</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-text2 uppercase">Dias Restantes</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text2 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-text2 uppercase">Processo</th>
              </tr>
            </thead>
            <tbody>
              {prazosProcessuais.map(prazo => {
                const status = getStatus(prazo.diasRestantes)
                const rowColor = {
                  vencido: 'bg-red-50',
                  critico: 'bg-orange-50',
                  atencao: 'bg-yellow-50',
                  normal: 'bg-green-50',
                  'sem-data': 'hover:bg-bg/50'
                }

                return (
                  <tr key={prazo.id} className={`border-b border-border ${rowColor[status]} transition-colors`}>
                    <td className="px-6 py-4 font-mono text-xs text-text2">{prazo.numero_processo}</td>
                    <td className="px-6 py-4 text-text2 max-w-xs truncate">{prazo.exequente}</td>
                    <td className="px-6 py-4 text-text2">{formatarData(prazo.data_transito)}</td>
                    <td className="px-6 py-4 text-center font-bold">
                      <span className={`${
                        status === 'vencido' ? 'text-red-600' :
                        status === 'critico' ? 'text-orange-600' :
                        status === 'atencao' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {prazo.diasRestantes !== null ? `${prazo.diasRestantes} dias` : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{getStatusLabel(status)}</td>
                    <td className="px-6 py-4">
                      <span className="badge px-2 py-1 text-xs bg-blue-100 text-blue-900">
                        {prazo.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
