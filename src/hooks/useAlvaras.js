import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

// Inicializar cliente Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase = null

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
}

export function useAlvaras() {
  const [alvaras, setAlvaras] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)

  // Carregar alvarás do Supabase
  const carregar = useCallback(async () => {
    if (!supabase) {
      console.warn('Supabase não configurado. Usando dados locais.')
      setAlvaras([])
      setCarregando(false)
      return
    }

    try {
      setCarregando(true)
      const { data, error } = await supabase
        .from('alvaras')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setAlvaras(data || [])
      setErro(null)
    } catch (err) {
      console.error('Erro ao carregar alvarás:', err)
      setErro(err.message)
      setAlvaras([])
    } finally {
      setCarregando(false)
    }
  }, [])

  // Carregar ao montar
  useEffect(() => {
    carregar()
  }, [carregar])

  // Adicionar alvará
  const add = useCallback(
    async (dados) => {
      if (!supabase) {
        // Modo local (sem Supabase)
        const novoAlvara = {
          id: Date.now().toString(),
          ...dados,
          created_at: new Date().toISOString()
        }
        setAlvaras((prev) => [novoAlvara, ...prev])
        return novoAlvara
      }

      try {
        const { data, error } = await supabase
          .from('alvaras')
          .insert([dados])
          .select()
          .single()

        if (error) throw error

        setAlvaras((prev) => [data, ...prev])
        return data
      } catch (err) {
        console.error('Erro ao adicionar alvará:', err)
        setErro(err.message)
        throw err
      }
    },
    []
  )

  // Atualizar alvará
  const update = useCallback(
    async (id, dados) => {
      if (!supabase) {
        // Modo local
        setAlvaras((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...dados } : a))
        )
        return
      }

      try {
        const { error } = await supabase
          .from('alvaras')
          .update(dados)
          .eq('id', id)

        if (error) throw error

        setAlvaras((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...dados } : a))
        )
      } catch (err) {
        console.error('Erro ao atualizar alvará:', err)
        setErro(err.message)
        throw err
      }
    },
    []
  )

  // Remover alvará
  const remove = useCallback(
    async (id) => {
      if (!supabase) {
        // Modo local
        setAlvaras((prev) => prev.filter((a) => a.id !== id))
        return
      }

      try {
        const { error } = await supabase
          .from('alvaras')
          .delete()
          .eq('id', id)

        if (error) throw error

        setAlvaras((prev) => prev.filter((a) => a.id !== id))
      } catch (err) {
        console.error('Erro ao remover alvará:', err)
        setErro(err.message)
        throw err
      }
    },
    []
  )

  // Buscar por ID
  const getById = useCallback(
    (id) => {
      return alvaras.find((a) => a.id === id)
    },
    [alvaras]
  )

  return {
    alvaras,
    carregando,
    erro,
    add,
    update,
    remove,
    getById,
    recarregar: carregar
  }
}
