import { useState, useEffect } from 'react'
import { STATUS_EXECUCAO, INDICES_CORRECAO, INDICES_JUROS } from '../../types'
import { PDFUpload } from './PDFUpload'
import { PDFExtractor } from './PDFExtractor'
import { calcularExecucao, formatarMoeda } from '../../services'
import { Calculator } from 'lucide-react'

export function ExecucaoForm({ inicial = null, onSave, onCancel }) {
  const [dadosExtraidos, setDadosExtraidos] = useState(null)
  const [form, setForm] = useState(inicial || {
    numero_processo: '',
    vara: '',
    relator: '',
    exequente: '',
    executado: '',
    qualificacao_exequente: '',
    qualificacao_executado: '',
    patrono: '',
    data_transito: '',
    status: 'Aguardando protocolo',
    dm_valor: '',
    dm_correcao: 'IPCA',
    dm_juros: 'Selic deduzido IPCA',
    dm_inicio_juros: '',
    dm_inicio_corr: '',
    dmat_valor: '',
    dmat_correcao: 'INPC',
    dmat_inicio_corr: '',
    dmat_descricao: '',
    ob_possui: false,
    ob_descricao: '',
    ob_prazo: '',
    ob_astreinte: '',
    ob_teto: '',
    ob_cumprida: null
  })

  const [pdfs, setPdfs] = useState({})
  const [calculo, setCalculo] = useState(null)
  const [calculando, setCalculando] = useState(false)
  const [faltamDatas, setFaltamDatas] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleCalcular = async () => {
    // As datas-base da correção e dos juros raramente constam do documento
    // (no PJe/PROJUDI a data costuma ser "registrada no sistema"). Sem elas o
    // cálculo sairia errado (correção R$ 0), então PEDIMOS ao usuário.
    const faltaDmat = Number(form.dmat_valor) > 0 && !form.dmat_inicio_corr
    if (!form.dm_inicio_corr || !form.dm_inicio_juros || faltaDmat) {
      setFaltamDatas(true)
      return
    }
    setFaltamDatas(false)
    try {
      setCalculando(true)
      const resultado = await calcularExecucao(form, new Date())
      setCalculo(resultado)
    } catch (error) {
      alert('Erro ao calcular: ' + error.message)
    } finally {
      setCalculando(false)
    }
  }

  const handleDadosExtraidos = (dados) => {
    setDadosExtraidos(dados)
  }

  // Dados extraídos da inicial (OCR) — qualificação e valor sugerido do dano
  // material. O valor só preenche se o campo estiver vazio (não sobrescreve).
  const handleQualificacao = (dados) => {
    setForm(prev => {
      const { dmat_valor_sugerido, ...resto } = dados
      const novo = { ...prev, ...resto }
      if (dmat_valor_sugerido && !prev.dmat_valor) {
        novo.dmat_valor = String(dmat_valor_sugerido)
      }
      return novo
    })
  }

  const handleConfirmarDadosExtraidos = (dadosConfirmados) => {
    // Preenche o formulário com os dados extraídos
    setForm(prev => ({
      ...prev,
      ...dadosConfirmados
    }))
    setDadosExtraidos(null) // Limpa o estado de extração
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.numero_processo || !form.dm_valor || !form.data_transito) {
      alert('Preencha os campos obrigatórios: processo, valor condenado e data de trânsito')
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
              name="numero_processo"
              value={form.numero_processo}
              onChange={handleChange}
              placeholder="0000000-00.0000.8.05.0001"
              className="input"
            />
          </div>
          <div>
            <label className="label">Vara / Juízo</label>
            <input
              type="text"
              name="vara"
              value={form.vara}
              onChange={handleChange}
              placeholder="18ª VSJE Consumidor – Salvador/BA"
              className="input"
            />
          </div>
          <div>
            <label className="label">Relator / Turma Recursal</label>
            <input
              type="text"
              name="relator"
              value={form.relator}
              onChange={handleChange}
              placeholder="Juiz X – 3ª Turma Recursal"
              className="input"
            />
          </div>
          <div className="col-span-2">
            <label className="label">Exequente</label>
            <input
              type="text"
              name="exequente"
              value={form.exequente}
              onChange={handleChange}
              placeholder="Nome completo do cliente"
              className="input"
            />
          </div>
          <div className="col-span-2">
            <label className="label">Executado (nome + CNPJ/CPF)</label>
            <input
              type="text"
              name="executado"
              value={form.executado}
              onChange={handleChange}
              placeholder="Razão social – CNPJ 00.000.000/0000-00"
              className="input"
            />
          </div>
          <div className="col-span-2">
            <label className="label">Qualificação do exequente (extraída da inicial — revise)</label>
            <textarea
              name="qualificacao_exequente"
              value={form.qualificacao_exequente}
              onChange={handleChange}
              placeholder="brasileiro(a), estado civil, profissão, CPF n.º ..., residente e domiciliado em ..., CEP ..."
              className="input min-h-16"
            />
          </div>
          <div className="col-span-2">
            <label className="label">Qualificação do executado (extraída da inicial — revise)</label>
            <textarea
              name="qualificacao_executado"
              value={form.qualificacao_executado}
              onChange={handleChange}
              placeholder="pessoa jurídica de direito privado, inscrita no CNPJ n.º ..., com sede em ..., CEP ..."
              className="input min-h-16"
            />
          </div>
          <div className="col-span-2">
            <label className="label">Patrono do executado nos autos</label>
            <input
              type="text"
              name="patrono"
              value={form.patrono}
              onChange={handleChange}
              placeholder="Nome – OAB/XX n.º 00.000"
              className="input"
            />
          </div>
          <div>
            <label className="label">Data do trânsito em julgado *</label>
            <input
              type="date"
              name="data_transito"
              value={form.data_transito}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div>
            <label className="label">Status processual</label>
            <select name="status" value={form.status} onChange={handleChange} className="input">
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
              name="dm_valor"
              value={form.dm_valor}
              onChange={handleChange}
              step="0.01"
              placeholder="0,00"
              className="input"
            />
          </div>
          <div>
            <label className="label">Índice de correção</label>
            <select name="dm_correcao" value={form.dm_correcao} onChange={handleChange} className="input">
              {INDICES_CORRECAO.map(i => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Índice de juros moratórios</label>
            <select name="dm_juros" value={form.dm_juros} onChange={handleChange} className="input">
              {INDICES_JUROS.map(i => (
                <option key={i.value} value={i.value}>{i.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Data do início dos juros</label>
            <input
              type="date"
              name="dm_inicio_juros"
              value={form.dm_inicio_juros}
              onChange={handleChange}
              className="input"
            />
          </div>
          <div>
            <label className="label">Data do início da correção monetária</label>
            <input
              type="date"
              name="dm_inicio_corr"
              value={form.dm_inicio_corr}
              onChange={handleChange}
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
              name="dmat_valor"
              value={form.dmat_valor}
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
              name="dmat_descricao"
              value={form.dmat_descricao}
              onChange={handleChange}
              placeholder="Ex: restituição em dobro"
              className="input"
            />
          </div>
          {Number(form.dmat_valor) > 0 && (
            <>
              <div>
                <label className="label">Índice de correção (dano material)</label>
                <select name="dmat_correcao" value={form.dmat_correcao || 'INPC'} onChange={handleChange} className="input">
                  {INDICES_CORRECAO.map(i => (
                    <option key={i.value} value={i.value}>{i.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Início da correção (desembolso)</label>
                <input
                  type="date"
                  name="dmat_inicio_corr"
                  value={form.dmat_inicio_corr || ''}
                  onChange={handleChange}
                  className="input"
                />
                <p className="text-[11px] text-text3 mt-1">Data do desembolso; os juros correm da citação (campo dos juros do dano moral).</p>
              </div>
            </>
          )}
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
            <select name="ob_possui" value={form.ob_possui ? 'S' : 'N'} onChange={(e) => handleChange({target: {name: 'ob_possui', value: e.target.value === 'S'}})} className="input">
              <option value="N">Não</option>
              <option value="S">Sim</option>
            </select>
          </div>
          {form.ob_possui && (
            <>
              <div className="col-span-2">
                <label className="label">Descrição</label>
                <input
                  type="text"
                  name="ob_descricao"
                  value={form.ob_descricao}
                  onChange={handleChange}
                  placeholder="Ex: reativar conta bancária"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Prazo para cumprimento (dias)</label>
                <input
                  type="number"
                  name="ob_prazo"
                  value={form.ob_prazo}
                  onChange={handleChange}
                  placeholder="Ex: 48"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Multa diária — astreinte (R$)</label>
                <input
                  type="number"
                  name="ob_astreinte"
                  value={form.ob_astreinte}
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
                  name="ob_teto"
                  value={form.ob_teto}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0,00"
                  className="input"
                />
              </div>

              {/* Checklist do operador: cumprimento da obrigação de fazer */}
              <div className="col-span-2">
                <label className="label">✅ O réu cumpriu a obrigação de fazer?</label>
                <select
                  name="ob_cumprida"
                  value={form.ob_cumprida === true ? 'S' : form.ob_cumprida === false ? 'N' : ''}
                  onChange={(e) => handleChange({
                    target: {
                      name: 'ob_cumprida',
                      value: e.target.value === 'S' ? true : e.target.value === 'N' ? false : null
                    }
                  })}
                  className="input"
                >
                  <option value="">— Ainda não avaliado —</option>
                  <option value="S">Sim, cumpriu</option>
                  <option value="N">Não cumpriu</option>
                </select>
                {form.ob_cumprida === false && (
                  <p className="text-xs bg-amber-50 border border-amber-300 text-amber-900 rounded p-2 mt-2">
                    ⚠️ A petição de execução cobrará do réu a <strong>apresentação de prova
                    do cumprimento da obrigação de fazer</strong> (CPC), com incidência da
                    multa (astreinte) enquanto não comprovado.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Seção de PDFs */}
      <div className="space-y-4">
        <PDFUpload pdfs={pdfs} onChange={setPdfs} onDadosExtraidos={handleDadosExtraidos} onQualificacao={handleQualificacao} />

        {/* PDFExtractor para revisar dados extraídos */}
        {dadosExtraidos && (
          <PDFExtractor
            dadosExtraidos={dadosExtraidos}
            onConfirm={handleConfirmarDadosExtraidos}
            onEdit={() => {}} // Opcional
          />
        )}
      </div>

      {/* Seção de Cálculo */}
      <div className="card p-6 bg-blue-50 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-sm text-blue-900 uppercase tracking-wider flex items-center gap-2">
            <Calculator size={18} />
            Calcular valor atualizado
          </h4>
          <button
            type="button"
            onClick={handleCalcular}
            disabled={calculando || !form.dm_valor || !form.data_transito}
            className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {calculando ? '⏳ Calculando...' : '📊 Calcular'}
          </button>
        </div>

        {faltamDatas && (
          <div className="bg-amber-50 border border-amber-400 rounded p-4 mb-4 text-sm">
            <p className="text-amber-900 font-semibold flex items-center gap-2 mb-1">
              <span>📅</span> Preciso de duas datas que não constam no documento
            </p>
            <p className="text-amber-800 text-xs mb-3">
              A decisão costuma trazer apenas “data registrada no sistema”. Informe as datas-base
              para o cálculo sair correto (sem elas a correção fica R$ 0,00).
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Início da correção monetária *</label>
                <input
                  type="date"
                  name="dm_inicio_corr"
                  value={form.dm_inicio_corr}
                  onChange={handleChange}
                  className="input"
                />
                <p className="text-[11px] text-amber-700 mt-1">Data da decisão/arbitramento (Súmula 362 do STJ).</p>
              </div>
              <div>
                <label className="label">Início dos juros de mora *</label>
                <input
                  type="date"
                  name="dm_inicio_juros"
                  value={form.dm_inicio_juros}
                  onChange={handleChange}
                  className="input"
                />
                <p className="text-[11px] text-amber-700 mt-1">Em regra, a data da citação (art. 405 do CC).</p>
              </div>
              {Number(form.dmat_valor) > 0 && (
                <div>
                  <label className="label">Início da correção do dano material *</label>
                  <input
                    type="date"
                    name="dmat_inicio_corr"
                    value={form.dmat_inicio_corr || ''}
                    onChange={handleChange}
                    className="input"
                  />
                  <p className="text-[11px] text-amber-700 mt-1">Data do desembolso (correção do dano material).</p>
                </div>
              )}
            </div>
          </div>
        )}

        {calculo && (
          <div className="space-y-3 text-sm">
            {calculo.fonteIndices === 'BCB' ? (
              <div className="flex items-center gap-2 bg-green-50 border border-green-300 text-green-800 rounded p-2 text-xs">
                <span>✅</span>
                <span>Índices oficiais do Banco Central (IPCA e Selic).</span>
              </div>
            ) : (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-400 text-amber-900 rounded p-3 text-xs">
                <span className="text-base leading-none">⚠️</span>
                <span>
                  <strong>Atenção:</strong> não foi possível obter os índices oficiais do BCB.
                  Este cálculo usou <strong>dados de contingência (aproximados)</strong> e
                  <strong> não deve ser usado para protocolo</strong>. Verifique a conexão e recalcule.
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded">
                <p className="text-xs text-text3 uppercase mb-1">Valor Principal</p>
                <p className="text-lg font-bold text-navy">{formatarMoeda(calculo.principal)}</p>
              </div>
              <div className="bg-white p-3 rounded">
                <p className="text-xs text-text3 uppercase mb-1">Correção Monetária</p>
                <p className="text-lg font-bold text-blue-600">+{formatarMoeda(calculo.cm)}</p>
              </div>
              <div className="bg-white p-3 rounded">
                <p className="text-xs text-text3 uppercase mb-1">Principal Corrigido</p>
                <p className="text-lg font-bold text-navy">{formatarMoeda(calculo.principalCorr)}</p>
              </div>
              <div className="bg-white p-3 rounded">
                <p className="text-xs text-text3 uppercase mb-1">Juros Moratórios</p>
                <p className="text-lg font-bold text-orange-600">+{formatarMoeda(calculo.juros)}</p>
              </div>
              {calculo.dmat > 0 && (
                <div className="bg-white p-3 rounded">
                  <p className="text-xs text-text3 uppercase mb-1">Dano Material (corrigido + juros)</p>
                  <p className="text-lg font-bold text-text">
                    +{formatarMoeda((calculo.dmatCorr || calculo.dmat) + (calculo.jurosDmat || 0))}
                  </p>
                  <p className="text-[11px] text-text3 mt-1">
                    singelo {formatarMoeda(calculo.dmat)} · correção +{formatarMoeda(calculo.cmDmat || 0)} · juros +{formatarMoeda(calculo.jurosDmat || 0)}
                  </p>
                </div>
              )}
              {calculo.ast > 0 && (
                <div className="bg-white p-3 rounded">
                  <p className="text-xs text-text3 uppercase mb-1">Astreinte</p>
                  <p className="text-lg font-bold text-text">+{formatarMoeda(calculo.ast)}</p>
                </div>
              )}
              <div className="bg-green-50 p-3 rounded border-2 border-green-500 col-span-2">
                <p className="text-xs text-green-700 uppercase font-semibold mb-1">Total Atualizado</p>
                <p className="text-2xl font-bold text-green-700">{formatarMoeda(calculo.total)}</p>
              </div>
            </div>
            <p className="text-xs text-blue-800 mt-3">
              Atualizado em {calculo.dataBase} | Fator Correção: {calculo.fatorCM} | Fator Juros: {calculo.fatorJuros}
            </p>
          </div>
        )}
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
