import { Check, AlertCircle, Edit2, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { formatarMoeda, formatarData } from '../../services'
import { DateCitationModal } from './DateCitationModal'
import { DanoMaterialModal } from './DanoMaterialModal'

export function PDFExtractor({ dadosExtraidos, onConfirm, onEdit }) {
  const [modo, setModo] = useState('review') // 'review', 'edit', 'datas', 'dano_material'
  const [dados, setDados] = useState(dadosExtraidos)
  const [mostrarModalDatas, setMostrarModalDatas] = useState(false)
  const [mostrarModalDanoMaterial, setMostrarModalDanoMaterial] = useState(false)

  const handleChange = (campo, valor) => {
    setDados(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  const handleConfirmDatas = (datas) => {
    setDados(prev => ({
      ...prev,
      ...datas
    }))
    setMostrarModalDatas(false)
    setMostrarModalDanoMaterial(true) // Mostra próxima modal
  }

  const handleConfirmDanoMaterial = (danoMaterial) => {
    setDados(prev => ({
      ...prev,
      ...danoMaterial
    }))
    setMostrarModalDanoMaterial(false)
    onConfirm(dados) // Finaliza com os dados completos
  }

  const handleConfirm = () => {
    // Verifica se faltam datas
    if (!dados.dm_inicio_juros || !dados.data_transito) {
      setMostrarModalDatas(true)
    } else if (dados.dmat_valor === undefined) {
      setMostrarModalDanoMaterial(true)
    } else {
      onConfirm(dados)
    }
  }

  const camposFaltando = [
    !dados.numero_processo && 'Número do processo',
    !dados.exequente && 'Exequente',
    !dados.executado && 'Executado',
    !dados.dm_valor && 'Valor condenado'
  ].filter(Boolean)

  if (mostrarModalDatas) {
    return <DateCitationModal onConfirm={handleConfirmDatas} onCancel={() => setMostrarModalDatas(false)} />
  }

  if (mostrarModalDanoMaterial) {
    return <DanoMaterialModal onConfirm={handleConfirmDanoMaterial} onCancel={() => setMostrarModalDanoMaterial(false)} />
  }

  if (modo === 'review') {
    return (
      <div className="card p-6 space-y-4 bg-blue-50 border border-blue-200">
        <div className="space-y-3 mb-4">
          {/* Indicador de Acórdão */}
          {dados.tipo_documento === 'acordao' && (
            <div className="bg-purple-50 border border-purple-200 p-3 rounded flex gap-2 text-sm">
              <AlertTriangle size={16} className="text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-purple-900">📋 Acórdão Detectado</p>
                <p className="text-purple-800 text-xs mt-1">Estes são dados do acórdão (recurso). {dados.houve_reforma && '⚠️ A sentença foi REFORMADA!'}</p>
              </div>
            </div>
          )}

          {/* Reformas */}
          {dados.houve_reforma && dados.reformas && dados.reformas.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 p-3 rounded">
              <p className="font-semibold text-orange-900 text-sm mb-2">🔄 Reformas Detectadas:</p>
              {dados.reformas.map((reforma, idx) => (
                <p key={idx} className="text-orange-800 text-xs mb-1">
                  • {reforma.descricao}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text2">📄 Dados Extraídos</h3>
          <button
            type="button"
            onClick={() => setModo('edit')}
            className="btn btn-sm"
          >
            <Edit2 size={14} />
            Editar
          </button>
        </div>

        {camposFaltando.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded flex gap-2 text-sm">
            <AlertCircle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900 mb-1">Campos faltando:</p>
              <p className="text-yellow-800">{camposFaltando.join(', ')}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Processo */}
          <div>
            <p className="text-xs text-text3 uppercase mb-1 font-semibold">Processo</p>
            <p className="text-sm font-mono text-text">{dados.numero_processo || '—'}</p>
          </div>

          {/* Exequente */}
          <div>
            <p className="text-xs text-text3 uppercase mb-1 font-semibold">Exequente</p>
            <p className="text-sm text-text">{dados.exequente || '—'}</p>
          </div>

          {/* Executado */}
          <div>
            <p className="text-xs text-text3 uppercase mb-1 font-semibold">Executado</p>
            <p className="text-sm text-text">{dados.executado || '—'}</p>
          </div>

          {/* Vara */}
          <div>
            <p className="text-xs text-text3 uppercase mb-1 font-semibold">Vara</p>
            <p className="text-sm text-text">{dados.vara || '—'}</p>
          </div>

          {/* Relator */}
          <div className="col-span-2">
            <p className="text-xs text-text3 uppercase mb-1 font-semibold">Relator</p>
            <p className="text-sm text-text">{dados.relator || '—'}</p>
          </div>

          {/* Data Trânsito */}
          <div>
            <p className="text-xs text-text3 uppercase mb-1 font-semibold">Data Trânsito</p>
            <p className="text-sm text-text">{formatarData(dados.data_transito) || '—'}</p>
          </div>

          {/* Valor DM */}
          <div>
            <p className="text-xs text-text3 uppercase mb-1 font-semibold">Dano Moral</p>
            <p className="text-sm font-bold text-navy">{dados.dm_valor ? formatarMoeda(dados.dm_valor) : '—'}</p>
          </div>

          {/* Valor Dano Material */}
          {dados.dmat_valor > 0 && (
            <div className="col-span-2">
              <p className="text-xs text-text3 uppercase mb-1 font-semibold">Dano Material</p>
              <p className="text-sm font-bold text-navy">{formatarMoeda(dados.dmat_valor)}</p>
              {dados.dmat_descricao && (
                <p className="text-xs text-text3 mt-1">{dados.dmat_descricao}</p>
              )}
            </div>
          )}

          {/* Índices */}
          <div>
            <p className="text-xs text-text3 uppercase mb-1 font-semibold">Índice Correção</p>
            <p className="text-sm text-text">{dados.dm_correcao || '—'}</p>
          </div>

          <div>
            <p className="text-xs text-text3 uppercase mb-1 font-semibold">Índice Juros</p>
            <p className="text-sm text-text">{dados.dm_juros || '—'}</p>
          </div>

          {/* Obrigação de Fazer */}
          {dados.ob_possui && (
            <div className="col-span-2">
              <p className="text-xs text-text3 uppercase mb-1 font-semibold">Obrigação de Fazer</p>
              <p className="text-sm text-text">{dados.ob_descricao || '—'}</p>
              {dados.ob_prazo && (
                <p className="text-xs text-text3 mt-1">Prazo: {dados.ob_prazo} dias</p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-blue-200">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={camposFaltando.length > 0}
            className="btn btn-primary flex-1 disabled:opacity-50"
          >
            <Check size={16} />
            Confirmar Dados
          </button>
        </div>
      </div>
    )
  }

  // Modo edição
  return (
    <div className="card p-6 space-y-4 bg-blue-50 border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text2">✏️ Editar Dados Extraídos</h3>
        <button
          type="button"
          onClick={() => setModo('review')}
          className="btn btn-sm"
        >
          Voltar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Processo */}
        <div className="col-span-2">
          <label className="label text-xs">Nº Processo</label>
          <input
            type="text"
            value={dados.numero_processo || ''}
            onChange={(e) => handleChange('numero_processo', e.target.value)}
            placeholder="0000000-00.0000.8.05.0001"
            className="input"
          />
        </div>

        {/* Exequente */}
        <div className="col-span-2">
          <label className="label text-xs">Exequente</label>
          <input
            type="text"
            value={dados.exequente || ''}
            onChange={(e) => handleChange('exequente', e.target.value)}
            className="input"
          />
        </div>

        {/* Executado */}
        <div className="col-span-2">
          <label className="label text-xs">Executado</label>
          <input
            type="text"
            value={dados.executado || ''}
            onChange={(e) => handleChange('executado', e.target.value)}
            className="input"
          />
        </div>

        {/* Vara */}
        <div className="col-span-2">
          <label className="label text-xs">Vara</label>
          <input
            type="text"
            value={dados.vara || ''}
            onChange={(e) => handleChange('vara', e.target.value)}
            className="input"
          />
        </div>

        {/* Relator */}
        <div className="col-span-2">
          <label className="label text-xs">Relator</label>
          <input
            type="text"
            value={dados.relator || ''}
            onChange={(e) => handleChange('relator', e.target.value)}
            className="input"
          />
        </div>

        {/* Data Trânsito */}
        <div>
          <label className="label text-xs">Data Trânsito em Julgado</label>
          <input
            type="date"
            value={dados.data_transito || ''}
            onChange={(e) => handleChange('data_transito', e.target.value)}
            className="input"
          />
        </div>

        {/* Valor DM */}
        <div>
          <label className="label text-xs">Dano Moral (R$)</label>
          <input
            type="number"
            value={dados.dm_valor || ''}
            onChange={(e) => handleChange('dm_valor', parseFloat(e.target.value) || '')}
            step="0.01"
            className="input"
          />
        </div>

        {/* Valor Dano Material */}
        <div>
          <label className="label text-xs">Dano Material (R$)</label>
          <input
            type="number"
            value={dados.dmat_valor || ''}
            onChange={(e) => handleChange('dmat_valor', parseFloat(e.target.value) || '')}
            step="0.01"
            className="input"
          />
        </div>

        {/* Descrição DM */}
        <div className="col-span-2">
          <label className="label text-xs">Descrição Dano Material</label>
          <input
            type="text"
            value={dados.dmat_descricao || ''}
            onChange={(e) => handleChange('dmat_descricao', e.target.value)}
            className="input"
          />
        </div>

        {/* Índices */}
        <div>
          <label className="label text-xs">Índice Correção</label>
          <select
            value={dados.dm_correcao || 'IPCA'}
            onChange={(e) => handleChange('dm_correcao', e.target.value)}
            className="input"
          >
            <option value="IPCA">IPCA</option>
            <option value="INPC">INPC</option>
            <option value="IGP-M">IGP-M</option>
          </select>
        </div>

        <div>
          <label className="label text-xs">Índice Juros</label>
          <select
            value={dados.dm_juros || 'Selic deduzido IPCA'}
            onChange={(e) => handleChange('dm_juros', e.target.value)}
            className="input"
          >
            <option value="Selic deduzido IPCA">Selic deduzido IPCA</option>
            <option value="SELIC">SELIC</option>
            <option value="1% a.m.">1% a.m.</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-blue-200">
        <button
          type="button"
          onClick={() => setModo('review')}
          className="btn flex-1"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="btn btn-primary flex-1"
        >
          <Check size={16} />
          Confirmar
        </button>
      </div>
    </div>
  )
}
