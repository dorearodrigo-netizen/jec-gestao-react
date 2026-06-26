import { useState } from 'react'
import { FileText, Trash2, Edit, Check } from 'lucide-react'
import { formatarMoeda, formatarData } from '../../services'

const STATUS_COLORS = {
  'Aguardando protocolo': 'bg-yellow-100 text-amber',
  'Cumprimento protocolado': 'bg-blue-100 text-blue-900',
  'Aguardando pagamento (15 dias)': 'bg-orange-100 text-amber',
  'Execução forçada protocolada': 'bg-purple-100 text-purple-900',
  'SISBAJUD solicitado': 'bg-red-100 text-red',
  'Bloqueio efetivado': 'bg-teal-100 text-teal',
  'Pago espontaneamente': 'bg-green-100 text-green-900',
  'Encerrado': 'bg-gray-100 text-gray-600'
}

export function ExecutacoesList({ execucoes, onEdit, onDelete, onGeneratePDF, onGerarForcado }) {
  const [expandedId, setExpandedId] = useState(null)

  if (execucoes.length === 0) {
    return (
      <div className="text-center py-20">
        <FileText size={56} className="mx-auto mb-4 text-text3 opacity-30" />
        <p className="text-lg text-text2 mb-2">Nenhuma execução cadastrada</p>
        <p className="text-sm text-text3">Clique em "Nova" para começar</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {execucoes.map(exec => (
        <div
          key={exec.id}
          className="card overflow-hidden hover:shadow-lg transition-shadow"
        >
          {/* Header */}
          <div className="p-6 flex items-start justify-between gap-6 bg-surface hover:bg-bg2/30 cursor-pointer transition-colors">
            <div
              className="flex-1 min-w-0"
              onClick={() => setExpandedId(expandedId === exec.id ? null : exec.id)}
            >
              <p className="font-mono text-xs text-text3 mb-2">{exec.numero_processo}</p>
              <h3 className="font-semibold text-base text-navy line-clamp-1">
                {exec.exequente} vs {exec.executado}
              </h3>
              <p className="text-xs text-text3 mt-1">{exec.vara}</p>
            </div>
            <div className="flex-shrink-0">
              <span className={`badge px-3 py-1.5 text-xs font-semibold ${STATUS_COLORS[exec.status] || 'bg-bg2 text-text2'}`}>
                {exec.status}
              </span>
            </div>
          </div>

          {/* Quick Info */}
          <div className="border-t border-border flex flex-wrap">
            <div className="flex-1 min-w-fit p-4 border-r border-border">
              <p className="text-xs text-text3 uppercase tracking-wider mb-1">Valor condenado</p>
              <p className="font-semibold text-base text-navy">{formatarMoeda(exec.dm_valor || 0)}</p>
            </div>
            <div className="flex-1 min-w-fit p-4 border-r border-border">
              <p className="text-xs text-text3 uppercase tracking-wider mb-1">Data de Trânsito</p>
              <p className="font-semibold text-base text-navy">{formatarData(exec.data_transito)}</p>
            </div>
            <div className="flex-1 min-w-fit p-4 border-r border-border">
              <p className="text-xs text-text3 uppercase tracking-wider mb-1">Correção</p>
              <p className="font-semibold text-base text-navy">{exec.dm_correcao}</p>
            </div>
            <div className="flex-1 min-w-fit p-4">
              <p className="text-xs text-text3 uppercase tracking-wider mb-1">Juros</p>
              <p className="text-sm text-text2">{exec.dm_juros}</p>
            </div>
          </div>

          {/* Expanded Content */}
          {expandedId === exec.id && (
            <div className="border-t border-border p-6 bg-bg/50 space-y-4">
              <div className="grid grid-cols-2 gap-6">
                {exec.patrono && (
                  <div>
                    <p className="text-xs text-text3 uppercase tracking-wider mb-2">Patrono</p>
                    <p className="text-sm text-text">{exec.patrono}</p>
                  </div>
                )}
                {exec.relator && (
                  <div>
                    <p className="text-xs text-text3 uppercase tracking-wider mb-2">Relator</p>
                    <p className="text-sm text-text">{exec.relator}</p>
                  </div>
                )}
                {exec.dmat_valor > 0 && (
                  <div>
                    <p className="text-xs text-text3 uppercase tracking-wider mb-2">Danos Materiais</p>
                    <p className="text-sm text-text">{formatarMoeda(exec.dmat_valor)} - {exec.dmat_descricao}</p>
                  </div>
                )}
                {exec.ob_possui && (
                  <div>
                    <p className="text-xs text-text3 uppercase tracking-wider mb-2">Obrigação de Fazer</p>
                    <p className="text-sm text-text">{exec.ob_descricao} ({exec.ob_prazo} dias)</p>
                  </div>
                )}
                {(exec.ob_astreinte > 0 || exec.ob_teto > 0) && (
                  <div className="col-span-2">
                    <p className="text-xs text-text3 uppercase tracking-wider mb-2">Astreinte/Teto</p>
                    <p className="text-sm text-text">{formatarMoeda(exec.ob_astreinte)} por dia (teto: {formatarMoeda(exec.ob_teto)})</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t border-border p-4 bg-bg flex gap-2 flex-wrap">
            <button
              onClick={() => onGeneratePDF(exec.id)}
              className="btn btn-sm"
              title="Gerar petição de cumprimento (voluntário)"
            >
              <FileText size={14} />
              Gerar Petição
            </button>
            {onGerarForcado && (
              <button
                onClick={() => onGerarForcado(exec.id)}
                className="btn btn-sm"
                title="Gerar rascunho de cumprimento de sentença (forçado)"
              >
                <FileText size={14} />
                Cumprimento Forçado
              </button>
            )}
            <button
              onClick={() => onEdit(exec.id)}
              className="btn btn-sm btn-gold"
              title="Editar execução"
            >
              <Edit size={14} />
              Editar
            </button>
            <button
              onClick={() => onDelete(exec.id)}
              className="btn btn-sm btn-red"
              title="Excluir execução"
            >
              <Trash2 size={14} />
              Excluir
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
