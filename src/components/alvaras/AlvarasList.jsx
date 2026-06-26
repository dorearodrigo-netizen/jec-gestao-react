import { useState } from 'react'
import { Trash2, Edit, Plus } from 'lucide-react'
import { formatarMoeda, formatarData } from '../../services'

export function AlvarasList({ alvaras, execucoes, onEdit, onDelete }) {
  const getExecucao = (numeroProcesso) => {
    return execucoes.find(e => e.numero_processo === numeroProcesso)
  }

  const calcularDiferenca = (alv) => {
    const exec = getExecucao(alv.numero_processo)
    if (!exec) return 0
    const valorDevido = exec.dm_valor || 0
    const valorDepositado = alv.valor || 0
    return valorDevido - valorDepositado
  }

  if (alvaras.length === 0) {
    return (
      <div className="text-center py-20">
        <Plus size={56} className="mx-auto mb-4 text-text3 opacity-30" />
        <p className="text-lg text-text2 mb-2">Nenhum alvará cadastrado</p>
        <p className="text-sm text-text3">Clique em "Nova" para começar</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface border-b border-border">
              <th className="px-6 py-4 text-left text-xs font-semibold text-text2 uppercase">Nº Processo</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-text2 uppercase">Valor Depositado</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-text2 uppercase">Valor Devido (DM)</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-text2 uppercase">Diferença</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-text2 uppercase">Data Depósito</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-text2 uppercase">Banco</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-text2 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody>
            {alvaras.map((alv) => {
              const exec = getExecucao(alv.numero_processo)
              const diferenca = calcularDiferenca(alv)
              const statusCoberto = diferenca <= 0

              return (
                <tr key={alv.id} className="border-b border-border hover:bg-bg/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-text2">{alv.numero_processo}</td>
                  <td className="px-6 py-4 font-semibold text-navy">{formatarMoeda(alv.valor || 0)}</td>
                  <td className="px-6 py-4 font-semibold text-text">
                    {exec ? formatarMoeda(exec.dm_valor || 0) : '—'}
                  </td>
                  <td className={`px-6 py-4 font-semibold ${statusCoberto ? 'text-green-600' : 'text-orange-600'}`}>
                    {exec ? formatarMoeda(diferenca) : '—'}
                    {exec && (
                      <span className="text-xs ml-2">
                        {statusCoberto ? '✓ Coberto' : '⚠ Faltam'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-text2">{formatarData(alv.data_deposito)}</td>
                  <td className="px-6 py-4 text-text2">{alv.banco || '—'}</td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    <button
                      onClick={() => onEdit(alv.id)}
                      className="btn btn-sm btn-gold"
                      title="Editar alvará"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(alv.id)}
                      className="btn btn-sm btn-red"
                      title="Excluir alvará"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
