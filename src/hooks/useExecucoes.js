import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

// Inicializar cliente Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase = null

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
} else {
  console.warn('Supabase não configurado — variáveis de ambiente ausentes.')
}

// Colunas reais da tabela `execucoes` (ver schema no Supabase).
const COLUNAS = [
  'numero_processo', 'vara', 'relator', 'exequente', 'executado', 'patrono',
  'data_transito', 'status', 'dm_valor', 'dm_correcao', 'dm_juros',
  'dm_inicio_juros', 'dm_inicio_corr', 'dmat_valor', 'dmat_correcao',
  'dmat_inicio_corr', 'dmat_descricao', 'ob_possui', 'ob_descricao', 'ob_prazo',
  'ob_astreinte', 'ob_teto', 'ob_cumprida', 'juscalc_data', 'juscalc_valor', 'observacoes'
]
const COLUNAS_NUMERICAS = ['dm_valor', 'dmat_valor', 'ob_prazo', 'ob_astreinte', 'ob_teto', 'juscalc_valor']
const COLUNAS_DATA = ['data_transito', 'dm_inicio_juros', 'dm_inicio_corr', 'dmat_inicio_corr', 'juscalc_data']

/**
 * Converte o estado do formulário para uma linha válida da tabela:
 * - `obs` → `observacoes`; objeto `calc` → `juscalc_valor` / `juscalc_data`;
 * - strings vazias em colunas numéricas/data viram null (o Postgres rejeita "");
 * - descarta chaves que não são colunas (ex.: `calc`, `id`).
 */
function prepararParaBanco(dados) {
  const fonte = { ...dados }
  if (fonte.obs !== undefined && fonte.observacoes === undefined) {
    fonte.observacoes = fonte.obs
  }
  if (fonte.calc) {
    fonte.juscalc_valor = fonte.calc.total
    fonte.juscalc_data = fonte.calc.dataBase
  }

  const linha = {}
  for (const col of COLUNAS) {
    if (!(col in fonte)) continue
    let valor = fonte[col]
    if (COLUNAS_NUMERICAS.includes(col)) {
      valor = valor === '' || valor == null ? null : Number(valor)
    } else if (COLUNAS_DATA.includes(col)) {
      valor = valor === '' || valor == null ? null : valor
    }
    linha[col] = valor
  }
  return linha
}

export function useExecucoes() {
  const [execucoes, setExecucoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  // Carregar execuções do Supabase
  const carregar = useCallback(async () => {
    if (!supabase) {
      console.warn('Supabase não configurado. Usando dados locais.')
      setExecucoes([])
      setCarregando(false)
      return
    }

    try {
      setCarregando(true)
      const { data, error } = await supabase
        .from('execucoes')
        .select('*')
        .order('criado_em', { ascending: false })

      if (error) throw error

      setExecucoes(data || [])
      setErro(null)
    } catch (err) {
      console.error('Erro ao carregar execuções:', err)
      setErro(err.message)
      setExecucoes([])
    } finally {
      setCarregando(false)
    }
  }, [])

  // Carregar ao montar
  useEffect(() => {
    carregar()
  }, [carregar])

  // Adicionar execução
  const add = useCallback(
    async (dados) => {
      if (!supabase) {
        // Modo local (sem Supabase)
        const novaExec = {
          id: Date.now().toString(),
          ...dados,
          created_at: new Date().toISOString()
        }
        setExecucoes((prev) => [novaExec, ...prev])
        return novaExec
      }

      try {
        const { data, error } = await supabase
          .from('execucoes')
          .insert([prepararParaBanco(dados)])
          .select()
          .single()

        if (error) throw error

        setExecucoes((prev) => [data, ...prev])
        return data
      } catch (err) {
        console.error('Erro ao adicionar execução:', err)
        setErro(err.message)
        throw err
      }
    },
    []
  )

  // Atualizar execução
  const update = useCallback(
    async (id, dados) => {
      if (!supabase) {
        // Modo local
        setExecucoes((prev) =>
          prev.map((e) => (e.id === id ? { ...e, ...dados } : e))
        )
        return
      }

      try {
        const { error } = await supabase
          .from('execucoes')
          .update(prepararParaBanco(dados))
          .eq('id', id)

        if (error) throw error

        setExecucoes((prev) =>
          prev.map((e) => (e.id === id ? { ...e, ...dados } : e))
        )
      } catch (err) {
        console.error('Erro ao atualizar execução:', err)
        setErro(err.message)
        throw err
      }
    },
    []
  )

  // Remover execução
  const remove = useCallback(
    async (id) => {
      if (!supabase) {
        // Modo local
        setExecucoes((prev) => prev.filter((e) => e.id !== id))
        return
      }

      try {
        const { error } = await supabase
          .from('execucoes')
          .delete()
          .eq('id', id)

        if (error) throw error

        setExecucoes((prev) => prev.filter((e) => e.id !== id))
      } catch (err) {
        console.error('Erro ao remover execução:', err)
        setErro(err.message)
        throw err
      }
    },
    []
  )

  // Buscar por ID
  const getById = useCallback(
    (id) => {
      return execucoes.find((e) => e.id === id)
    },
    [execucoes]
  )

  return {
    execucoes,
    carregando,
    erro,
    add,
    update,
    remove,
    getById,
    recarregar: carregar
  }
}
