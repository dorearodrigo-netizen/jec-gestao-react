import { useState, useEffect } from 'react'
import { Sidebar, Topbar, Modal } from './components/layout'
import { ExecucaoForm, ExecutacoesList } from './components/execucoes'
import { Metric } from './components/common'
import { useExecucoes, useAlvaras, useNotification } from './hooks'
import { calcularExecucao, gerarPDFPeticao, exportarJSON, formatarMoeda } from './services'
import { FileText, Award, TrendingUp, Calendar } from 'lucide-react'

function App() {
  const [activeTab, setActiveTab] = useState('execucoes')
  const [showExecModal, setShowExecModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)

  const { execucoes, add: addExec, update: updateExec, remove: removeExec, getById: getExecById } = useExecucoes()
  const { alvaras } = useAlvaras()
  const { notify } = useNotification()

  const handleSaveExec = async (data) => {
    try {
      setLoading(true)

      // Calcular valores se houver arbitramento e citação
      let calc = null
      if (data.arb && data.cit) {
        calc = await calcularExecucao(data, new Date())
      }

      if (editingId) {
        updateExec(editingId, { ...data, calc })
        notify('Execução atualizada com sucesso')
      } else {
        addExec({ ...data, calc })
        notify('Execução cadastrada com sucesso')
      }

      setShowExecModal(false)
      setEditingId(null)
    } catch (error) {
      console.error(error)
      notify('Erro ao salvar: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEditExec = (id) => {
    setEditingId(id)
    setShowExecModal(true)
  }

  const handleDeleteExec = (id) => {
    if (confirm('Tem certeza que deseja excluir esta execução?')) {
      removeExec(id)
      notify('Execução excluída')
    }
  }

  const handleGeneratePDF = async (id) => {
    try {
      const exec = getExecById(id)
      if (!exec) {
        notify('Execução não encontrada', 'error')
        return
      }

      let calc = exec.calc
      if (!calc && exec.arb && exec.cit) {
        calc = await calcularExecucao(exec, new Date())
      }

      gerarPDFPeticao(exec, calc, 'cumprimento')
      notify('PDF gerado com sucesso')
    } catch (error) {
      console.error(error)
      notify('Erro ao gerar PDF: ' + error.message, 'error')
    }
  }

  const handleExportData = () => {
    try {
      exportarJSON(execucoes, alvaras)
      notify('Dados exportados com sucesso')
    } catch (error) {
      notify('Erro ao exportar: ' + error.message, 'error')
    }
  }

  const handleImportData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result)
          if (data.execucoes && data.alvaras) {
            alert('Importação implementada — verifique com o desenvolvedor')
          }
        } catch (error) {
          notify('Erro ao ler arquivo: ' + error.message, 'error')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const metrics = [
    {
      label: 'Total de execuções',
      value: execucoes.length,
      icon: FileText,
      color: 'blue'
    },
    {
      label: 'Alvarás cadastrados',
      value: alvaras.length,
      icon: Award,
      color: 'green'
    },
    {
      label: 'Valor total exequendo',
      value: formatarMoeda(execucoes.reduce((s, e) => s + (e.calc?.total || 0), 0)),
      icon: TrendingUp,
      color: 'gold'
    },
    {
      label: 'Pago espontaneamente',
      value: execucoes.filter(e => e.st === 'Pago espontaneamente').length,
      icon: Calendar,
      color: 'amber'
    }
  ]

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onExport={handleExportData}
        onImport={handleImportData}
      />

      {/* Main Content */}
      <div className="ml-60 flex-1 flex flex-col min-h-screen">
        {/* Topbar */}
        <Topbar
          title={activeTab === 'execucoes' ? 'Execuções' : activeTab === 'alvaras' ? 'Alvarás' : activeTab === 'dashboard' ? 'Dashboard' : 'Prazos'}
          subtitle={activeTab === 'execucoes' ? 'Gestão de cumprimentos de sentença — JEC/BA' : 'Visualização e análise de dados'}
          count={activeTab === 'execucoes' ? execucoes.length : alvaras.length}
          onNewClick={activeTab === 'execucoes' ? () => setShowExecModal(true) : null}
        />

        {/* Content */}
        <div className="flex-1 pt-24 pb-8 px-8">
          {activeTab === 'execucoes' && (
            <div>
              {/* Métricas */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {metrics.map((m, i) => (
                  <Metric key={i} {...m} />
                ))}
              </div>

              {/* Lista de Execuções */}
              <ExecutacoesList
                execucoes={execucoes}
                onEdit={handleEditExec}
                onDelete={handleDeleteExec}
                onGeneratePDF={handleGeneratePDF}
              />
            </div>
          )}

          {activeTab === 'alvaras' && (
            <div className="text-center py-20">
              <Award size={56} className="mx-auto mb-4 text-text3 opacity-30" />
              <p className="text-lg text-text2 mb-2">Alvarás — em desenvolvimento</p>
              <p className="text-sm text-text3">Este módulo será implementado em breve</p>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="text-center py-20">
              <TrendingUp size={56} className="mx-auto mb-4 text-text3 opacity-30" />
              <p className="text-lg text-text2 mb-2">Dashboard — em desenvolvimento</p>
              <p className="text-sm text-text3">Gráficos e análises em breve</p>
            </div>
          )}

          {activeTab === 'prazos' && (
            <div className="text-center py-20">
              <Calendar size={56} className="mx-auto mb-4 text-text3 opacity-30" />
              <p className="text-lg text-text2 mb-2">Prazos — em desenvolvimento</p>
              <p className="text-sm text-text3">Controle de prazos processuais em breve</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Execução */}
      <Modal
        isOpen={showExecModal}
        title={editingId ? 'Editar execução' : 'Nova execução'}
        onClose={() => {
          setShowExecModal(false)
          setEditingId(null)
        }}
        wide
        footer={null}
      >
        <ExecucaoForm
          inicial={editingId ? getExecById(editingId) : null}
          onSave={handleSaveExec}
          onCancel={() => {
            setShowExecModal(false)
            setEditingId(null)
          }}
        />
      </Modal>

      {/* Notificação */}
      <div id="notif" className="fixed bottom-6 right-6 bg-navy text-white rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2 shadow-2xl -translate-y-32 opacity-0 pointer-events-none transition-all duration-300">
        <span>✓</span>
        <span id="notif-msg">Operação realizada</span>
      </div>
    </div>
  )
}

export default App
