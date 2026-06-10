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

export function ExecutacoesList({ execucoes, onEdit, onDelete, onGeneratePDF }) {
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
              <p className="font-mono text-xs text-text3 mb-2">{exec.p}</p>
              <h3 className="font-semibold text-base text-navy line-clamp-1">
                {exec.e} vs {exec.x}
              </h3>
              <p className="text-xs text-text3 mt-1">{exec.v}</p>
            </div>
            <div className="flex-shrink-0">
              <span className={`badge px-3 py-1.5 text-xs font-semibold ${STATUS_COLORS[exec.st] || 'bg-bg2 text-text2'}`}>
                {exec.st}
              </span>
            </div>
          </div>

          {/* Quick Info */}
          <div className="border-t border-border flex flex-wrap">
            <div className="flex-1 min-w-fit p-4 border-r border-border">
              <p className="text-xs text-text3 uppercase tracking-wider mb-1">Valor condenado</p>
              <p className="font-semibold text-base text-navy">{formatarMoeda(exec.dm || 0)}</p>
            </div>
            <div className="flex-1 min-w-fit p-4 border-r border-border">
              <p className="text-xs text-text3 uppercase tracking-wider mb-1">Arbitramento</p>
              <p className="font-semibold text-base text-navy">{formatarData(exec.arb)}</p>
            </div>
            <div className="flex-1 min-w-fit p-4 border-r border-border">
              <p className="text-xs text-text3 uppercase tracking-wider mb-1">Citação</p>
              <p className="font-semibold text-base text-navy">{formatarData(exec.cit)}</p>
            </div>
            <div className="flex-1 min-w-fit p-4">
              <p className="text-xs text-text3 uppercase tracking-wider mb-1">Índices</p>
              <p className="text-sm text-text2">{exec.corrIdx} / {exec.jurIdx}</p>
            </div>
          </div>

          {/* Expanded Content */}
          {expandedId === exec.id && (
            <div className="border-t border-border p-6 bg-bg/50 space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-text3 uppercase tracking-wider mb-2">Exequente</p>
                  <p className="text-sm text-text">{exec.e}</p>
                </div>
                <div>
                  <p className="text-xs text-text3 uppercase tracking-wider mb-2">Executado</p>
                  <p className="text-sm text-text">{exec.x}</p>
                </div>
                {exec.dmat > 0 && (
                  <div>
                    <p className="text-xs text-text3 uppercase tracking-wider mb-2">Danos Materiais</p>
                    <p className="text-sm text-text">{formatarMoeda(exec.dmat)} - {exec.dmatd}</p>
                  </div>
                )}
                {exec.ob === 'S' && (
                  <div>
                    <p className="text-xs text-text3 uppercase tracking-wider mb-2">Obrigação de Fazer</p>
                    <p className="text-sm text-text">{exec.od} ({exec.pr})</p>
                  </div>
                )}
                {exec.pgval > 0 && (
                  <div>
                    <p className="text-xs text-text3 uppercase tracking-wider mb-2">Pagamento Recebido</p>
                    <p className="text-sm text-teal font-semibold">{formatarMoeda(exec.pgval)} em {formatarData(exec.pgdt)}</p>
                  </div>
                )}
                {exec.obs && (
                  <div className="col-span-2">
                    <p className="text-xs text-text3 uppercase tracking-wider mb-2">Observações</p>
                    <p className="text-sm text-text2">{exec.obs}</p>
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
              title="Gerar PDF de petição"
            >
              <FileText size={14} />
              Gerar Petição
            </button>
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
