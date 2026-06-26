import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'
import { formatarMoeda } from '../../services'

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export function Dashboard({ execucoes, alvaras }) {
  // Dados por status
  const statusCounts = {}
  execucoes.forEach(exec => {
    statusCounts[exec.status] = (statusCounts[exec.status] || 0) + 1
  })

  const statusLabels = Object.keys(statusCounts)
  const statusValues = Object.values(statusCounts)

  // Valores totais
  const totalDanosMorais = execucoes.reduce((sum, e) => sum + (e.dm_valor || 0), 0)
  const totalDanosMateriais = execucoes.reduce((sum, e) => sum + (e.dmat_valor || 0), 0)
  const totalAlvaras = alvaras.reduce((sum, a) => sum + (a.valor || 0), 0)

  // Dados de valor por status
  const valorPorStatus = {}
  execucoes.forEach(exec => {
    valorPorStatus[exec.status] = (valorPorStatus[exec.status] || 0) + (exec.dm_valor || 0)
  })

  const valorLabels = Object.keys(valorPorStatus)
  const valorValues = Object.values(valorPorStatus)

  const COLORS = ['#2E75B6', '#00B050', '#FFC000', '#FF6B6B', '#9C27B0', '#FF9800', '#607D8B', '#A5A5A5']

  const pieData = {
    labels: statusLabels,
    datasets: [{
      data: statusValues,
      backgroundColor: COLORS.slice(0, statusLabels.length),
      borderColor: '#fff',
      borderWidth: 2
    }]
  }

  const barData = {
    labels: valorLabels,
    datasets: [{
      label: 'Valor (R$)',
      data: valorValues,
      backgroundColor: '#2E75B6',
      borderColor: '#1a4d7a',
      borderWidth: 1
    }]
  }

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' }
    }
  }

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' }
    },
    scales: {
      y: { beginAtZero: true }
    }
  }

  return (
    <div className="space-y-8">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 gap-6">
        <div className="card p-6">
          <p className="text-xs text-text3 uppercase tracking-wider mb-2">Total Danos Morais</p>
          <p className="text-3xl font-bold text-navy">{formatarMoeda(totalDanosMorais)}</p>
          <p className="text-xs text-text3 mt-2">{execucoes.length} execuções</p>
        </div>
        <div className="card p-6">
          <p className="text-xs text-text3 uppercase tracking-wider mb-2">Total Danos Materiais</p>
          <p className="text-3xl font-bold text-navy">{formatarMoeda(totalDanosMateriais)}</p>
        </div>
        <div className="card p-6">
          <p className="text-xs text-text3 uppercase tracking-wider mb-2">Total em Alvarás</p>
          <p className="text-3xl font-bold text-green-600">{formatarMoeda(totalAlvaras)}</p>
          <p className="text-xs text-text3 mt-2">{alvaras.length} alvarás</p>
        </div>
        <div className="card p-6">
          <p className="text-xs text-text3 uppercase tracking-wider mb-2">Pendente</p>
          <p className="text-3xl font-bold text-orange-600">{formatarMoeda(totalDanosMorais - totalAlvaras)}</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-6">
        {/* Gráfico de Status */}
        <div className="card p-6">
          <h3 className="font-semibold text-text mb-4">Distribuição por Status</h3>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>

        {/* Gráfico de Valores */}
        <div className="card p-6">
          <h3 className="font-semibold text-text mb-4">Valor por Status</h3>
          <div style={{ height: '300px' }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Tabela de Execuções Recentes */}
      <div className="card p-6">
        <h3 className="font-semibold text-text mb-4">Execuções Recentes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text2">Processo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text2">Exequente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text2">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text2">Valor</th>
              </tr>
            </thead>
            <tbody>
              {execucoes.slice(0, 5).map(exec => (
                <tr key={exec.id} className="border-b border-border hover:bg-bg/50">
                  <td className="px-4 py-3 font-mono text-xs text-text2">{exec.numero_processo}</td>
                  <td className="px-4 py-3 text-text2">{exec.exequente}</td>
                  <td className="px-4 py-3">
                    <span className="badge px-2 py-1 text-xs bg-blue-100 text-blue-900">
                      {exec.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-navy">{formatarMoeda(exec.dm_valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
