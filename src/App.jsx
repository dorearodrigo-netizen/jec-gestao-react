import { useState } from 'react'
import { Sidebar, Topbar, Modal } from './components/layout'
import { ExecucaoForm, ExecutacoesList } from './components/execucoes'
import { AlvarasList } from './components/alvaras'
import { Dashboard } from './components/dashboard'
import { Prazos } from './components/prazos'
import { Metric } from './components/common'
import { useExecucoes, useAlvaras, useNotification } from './hooks'
import { calcularExecucao, gerarPeticaoDOCX, gerarPeticaoForcadaDOCX, exportarJSON, formatarMoeda } from './services'
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

      // O cálculo é um "extra": só roda se houver as datas-base necessárias
      // (correção e juros). Sem elas, salvamos sem cálculo para não gravar
      // um total incorreto — o usuário calcula depois informando as datas.
      let calc = null
      if (data.dm_valor && data.dm_inicio_corr && data.dm_inicio_juros) {
        try {
          calc = await calcularExecucao(data, new Date())
        } catch (calcErr) {
          console.warn('Cálculo não realizado no salvamento:', calcErr.message)
          notify('Execução salva, mas o cálculo falhou — refaça em "Calcular".', 'error')
        }
      }

      if (editingId) {
        await updateExec(editingId, { ...data, calc })
        notify('Execução atualizada com sucesso')
      } else {
        await addExec({ ...data, calc })
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

      // Recalcula com índices oficiais quando houver as datas-base; senão,
      // usa o último cálculo salvo (juscalc_valor) como total.
      let calc = null
      if (exec.dm_valor) {
        try {
          calc = await calcularExecucao(exec, new Date())
        } catch (e) {
          console.warn('Cálculo não refeito para a voluntária:', e.message)
        }
      }
      if (!calc && Number(exec.juscalc_valor) > 0) {
        calc = { total: Number(exec.juscalc_valor), dataBase: exec.juscalc_data || new Date().toISOString().slice(0, 10) }
      }

      await gerarPeticaoDOCX(exec, calc, 'cumprimento')
      notify('Petição de cumprimento gerada (com planilha)')
    } catch (error) {
      console.error(error)
      notify('Erro ao gerar PDF: ' + error.message, 'error')
    }
  }

  const handleGerarForcado = async (id) => {
    try {
      const exec = getExecById(id)
      if (!exec) {
        notify('Execução não encontrada', 'error')
        return
      }

      // Recalcula com valores atualizados quando houver as datas-base; senão,
      // usa o último cálculo salvo (juscalc_valor) como total.
      let calc = null
      if (exec.dm_valor) {
        try {
          calc = await calcularExecucao(exec, new Date())
        } catch (e) {
          console.warn('Cálculo não refeito para a forçada:', e.message)
        }
      }
      if (!calc && Number(exec.juscalc_valor) > 0) {
        calc = { total: Number(exec.juscalc_valor), dataBase: exec.juscalc_data || new Date().toISOString().slice(0, 10) }
      }

      await gerarPeticaoForcadaDOCX(exec, calc)
      notify('Petição de cumprimento forçado gerada (rascunho para revisão)')
    } catch (error) {
      console.error(error)
      notify('Erro ao gerar petição forçada: ' + error.message, 'error')
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
      value: execucoes.filter(e => e.status === 'Pago espontaneamente').length,
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
                onGerarForcado={handleGerarForcado}
              />
            </div>
          )}

          {activeTab === 'alvaras' && (
            <div>
              {/* Métricas */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {metrics.map((m, i) => (
                  <Metric key={i} {...m} />
                ))}
              </div>

              {/* Lista de Alvarás */}
              <AlvarasList
                alvaras={alvaras}
                execucoes={execucoes}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            </div>
          )}

          {activeTab === 'dashboard' && (
            <Dashboard execucoes={execucoes} alvaras={alvaras} />
          )}

          {activeTab === 'prazos' && (
            <Prazos execucoes={execucoes} />
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
