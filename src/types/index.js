/**
 * @typedef {Object} Execucao
 * @property {string} id
 * @property {string} p - Número do processo
 * @property {string} v - Vara/Juízo
 * @property {string} r - Relator/Turma Recursal
 * @property {string} e - Exequente
 * @property {string} x - Executado
 * @property {string} pt - Patrono do executado
 * @property {string} tj - Data do trânsito em julgado
 * @property {string} st - Status
 * @property {number} dm - Valor dano moral
 * @property {string} arb - Data do arbitramento
 * @property {string} corrIdx - Índice de correção
 * @property {string} jurIdx - Índice de juros
 * @property {string} cit - Data da citação
 * @property {string} ic - Início da correção
 * @property {number} dmat - Dano material
 * @property {string} dmatd - Descrição dano material
 * @property {string} ob - Tem obrigação de fazer
 * @property {string} od - Descrição obrigação
 * @property {string} pr - Prazo
 * @property {number} ast - Astreinte
 * @property {number} teto - Teto da multa
 * @property {number} pgval - Valor pago
 * @property {string} pgdt - Data do pagamento
 * @property {string} obs - Observações
 * @property {Object} calc - Cálculo atualizado
 */

/**
 * @typedef {Object} Alvara
 * @property {string} id
 * @property {string} p - Número do processo
 * @property {string} e - Exequente
 * @property {string} x - Executado
 * @property {string} exp - Data expedição
 * @property {string} lev - Data levantamento
 * @property {number} bloq - Valor bloqueado
 * @property {number} levv - Valor levantado
 * @property {string} st - Status
 * @property {string} obs - Observações
 */

/**
 * @typedef {Object} CalcResult
 * @property {string} dataBase
 * @property {number} principal
 * @property {number} cm - Correção monetária
 * @property {number} principalCorr
 * @property {number} juros
 * @property {number} dmat
 * @property {number} ast
 * @property {number} total
 * @property {number} fatorCM
 * @property {number} fatorSelic
 * @property {number} fatorIPCA4Juros
 * @property {number} fatorJuros
 * @property {Object} ultimaSelic
 * @property {Object} ultimoIPCA
 */

export const STATUS_EXECUCAO = [
  'Aguardando protocolo',
  'Cumprimento protocolado',
  'Aguardando pagamento (15 dias)',
  'Execução forçada protocolada',
  'SISBAJUD solicitado',
  'Bloqueio efetivado',
  'Pago espontaneamente',
  'Encerrado'
]

export const STATUS_ALVARA = [
  'Aguardando bloqueio SISBAJUD',
  'Bloqueio efetivado',
  'Alvará expedido',
  'Alvará levantado',
  'Levantamento parcial',
  'Encerrado'
]

export const INDICES_CORRECAO = [
  { value: 'IPCA', label: 'IPCA (BCB série 433)' },
  { value: 'INPC', label: 'INPC' },
  { value: 'IGPM', label: 'IGP-M' },
  { value: 'SELIC', label: 'SELIC' }
]

// IMPORTANTE: os 'value' precisam ser idênticos aos rótulos do enum
// `indice_juros` no Supabase (Selic deduzido IPCA | SELIC | 1% a.m. | Outro).
export const INDICES_JUROS = [
  { value: 'Selic deduzido IPCA', label: 'Selic − IPCA (taxa real)' },
  { value: 'SELIC', label: 'SELIC integral' },
  { value: '1% a.m.', label: '1% a.m. (art. 406 CC)' }
]
