import { useState, useEffect } from 'react'
import { STATUS_EXECUCAO, INDICES_CORRECAO, INDICES_JUROS } from '../../types'

export function ExecucaoForm({ inicial = null, onSave, onCancel }) {
  const [form, setForm] = useState(inicial || {
    p: '',
    v: '',
    r: '',
    e: '',
    x: '',
    pt: '',
    tj: '',
    st: 'Aguardando protocolo',
    dm: '',
    arb: '',
    corrIdx: 'IPCA',
    jurIdx: 'SELIC-IPCA',
    cit: '',
    ic: '',
    dmat: '',
    dmatd: '',
    ob: 'N',
    od: '',
    pr: '',
    ast: '',
    teto: '',
    pgval: '',
    pgdt: '',
    obs: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.p || !form.dm || !form.arb || !form.cit) {
      alert('Preencha os campos obrigatórios: processo, valor, arbitramento e citação')
      return
    }
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Seção de Identificação */}
      <div>
        <h4 className="font-semibold text-sm text-text2 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="text-gold">📋</span> Identificação do processo
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nº Processo (CNJ) *</label>
            <input
              type="text"
              name="p"
              value={form.p}
              onChange={handleChange}
              placeholder="0000000-00.0000.8.05.0001"
              className="input"
            />
          </div>
          <div>
            <label className="label">Vara / Juízo</label>
            <input
              type="text"
              name="v"
              value={form.v}
              onChange={handleChange}
              placeholder="18ª VSJE Consumidor – Salvador/BA"
              className="input"
            />
          </div>
          <div>
            <label className="label">Relator / Turma Recursal</label>
            <input
              type="text"
              name="r"
              value={form.r}
              onChange={handleChange}
              placeholder="Juiz X – 3ª Turma Recursal"
              className="input"
            />
          </div>
          <div className="col-span-2">
            <label className="label">Exequente</label>
            <input
              type="text"
              name="e"
              value={form.e}
              onChange={handleChange}
              placeholder="Nome completo do cliente"
              className="input"
            />
          </div>
          <div className="col-span-2">
            <label className="label">Executado (nome + CNPJ/CPF)</label>
            <input
              type="text"
              name="x"
              value={form.x}
              onChange={handleChange}
              placeholder="Razão social – CNPJ 00.000.000/0000-00"
              className="input"
            />
          </div>
          <div className="col-span-2">
            <label className="label">Patrono do executado nos autos</label>
            <input
              type="text"
              name="pt"
              value={form.pt}
              onChange={handleChange}
              placeholder="Nome – OAB/XX n.º 00.000"
              className="input"
            />
          </div>
          <div>
            <label className="label">Data do trânsito em julgado</label>
            <input
              type="date"
              name="tj"
              value={form.tj}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div>
            <label className="label">Status processual</label>
            <select name="st" value={form.st} onChange={handleChange} className="input">
              {STATUS_EXECUCAO.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Seção de Danos Morais */}
      <div>
        <h4 className="font-semibold text-sm text-text2 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="text-gold">😢</span> Danos morais
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Valor condenado (R$) *</label>
            <input
              type="number"
              name="dm"
              value={form.dm}
              onChange={handleChange}
              step="0.01"
              placeholder="0,00"
              className="input"
            />
          </div>
          <div>
            <label className="label">Data do arbitramento *</label>
            <input
              type="date"
              name="arb"
              value={form.arb}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div>
            <label className="label">Índice de correção</label>
            <select name="corrIdx" value={form.corrIdx} onChange={handleChange} className="input">
              {INDICES_CORRECAO.map(i => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Índice de juros moratórios</label>
            <select name="jurIdx" value={form.jurIdx} onChange={handleChange} className="input">
              {INDICES_JUROS.map(i => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Data da citação (início dos juros) *</label>
            <input
              type="date"
              name="cit"
              value={form.cit}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div>
            <label className="label">Início da correção monetária</label>
            <input
              type="text"
              name="ic"
              value={form.ic}
              onChange={handleChange}
              placeholder="Ex: data do arbitramento (deixe vazio = usa data acima)"
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Seção de Danos Materiais */}
      <div>
        <h4 className="font-semibold text-sm text-text2 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="text-gold">📄</span> Danos materiais (se houver)
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Valor condenado (R$)</label>
            <input
              type="number"
              name="dmat"
              value={form.dmat}
              onChange={handleChange}
              step="0.01"
              placeholder="Deixe vazio se não houver"
              className="input"
            />
          </div>
          <div>
            <label className="label">Descrição resumida</label>
            <input
              type="text"
              name="dmatd"
              value={form.dmatd}
              onChange={handleChange}
              placeholder="Ex: restituição em dobro"
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Seção de Obrigação de Fazer */}
      <div>
        <h4 className="font-semibold text-sm text-text2 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="text-gold">⚖️</span> Obrigação de fazer (se houver)
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Possui obrigação de fazer?</label>
            <select name="ob" value={form.ob} onChange={handleChange} className="input">
              <option value="N">Não</option>
              <option value="S">Sim</option>
            </select>
          </div>
          {form.ob === 'S' && (
            <>
              <div className="col-span-2">
                <label className="label">Descrição</label>
                <input
                  type="text"
                  name="od"
                  value={form.od}
                  onChange={handleChange}
                  placeholder="Ex: reativar conta bancária"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Prazo para cumprimento</label>
                <input
                  type="text"
                  name="pr"
                  value={form.pr}
                  onChange={handleChange}
                  placeholder="Ex: 48h do TJ"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Multa diária — astreinte (R$)</label>
                <input
                  type="number"
                  name="ast"
                  value={form.ast}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0,00"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Teto da multa (R$)</label>
                <input
                  type="number"
                  name="teto"
                  value={form.teto}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0,00"
                  className="input"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Seção de Pagamento */}
      <div>
        <h4 className="font-semibold text-sm text-text2 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="text-gold">💰</span> Pagamento recebido (se houver)
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Valor pago pelo réu (R$)</label>
            <input
              type="number"
              name="pgval"
              value={form.pgval}
              onChange={handleChange}
              step="0.01"
              placeholder="0,00"
              className="input"
            />
          </div>
          <div>
            <label className="label">Data do pagamento</label>
            <input
              type="date"
              name="pgdt"
              value={form.pgdt}
              onChange={handleChange}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Observações */}
      <div>
        <label className="label">Observações / Pendências</label>
        <textarea
          name="obs"
          value={form.obs}
          onChange={handleChange}
          placeholder="Informações adicionais, alertas, pendências..."
          className="input min-h-24"
        />
      </div>

      {/* Ações */}
      <div className="flex justify-end gap-3 pt-6 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="btn"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
        >
          💾 Salvar execução
        </button>
      </div>
    </form>
  )
}
