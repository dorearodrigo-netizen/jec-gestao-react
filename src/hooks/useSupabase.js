import { useState, useCallback, useEffect } from 'react'
import {
  fetchExecucoes,
  createExecucao,
  updateExecucao,
  deleteExecucao,
  fetchAlvaras,
  createAlvara,
  updateAlvara,
  deleteAlvara,
} from '../services/supabaseService'

export function useExecucoes() {
  const [execucoes, setExecucoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Carregar dados ao montar
  useEffect(() => {
    loadExecucoes()
  }, [])

  const loadExecucoes = async () => {
    try {
      setLoading(true)
      const data = await fetchExecucoes()
      setExecucoes(data)
      setError(null)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const add = useCallback(async (exec) => {
    try {
      const newExec = await createExecucao(exec)
      setExecucoes(prev => [newExec, ...prev])
      return newExec
    } catch (err) {
      console.error(err)
      throw err
    }
  }, [])

  const update = useCallback(async (id, updates) => {
    try {
      const updated = await updateExecucao(id, updates)
      setExecucoes(prev => prev.map(e => e.id === id ? updated : e))
      return updated
    } catch (err) {
      console.error(err)
      throw err
    }
  }, [])

  const remove = useCallback(async (id) => {
    try {
      await deleteExecucao(id)
      setExecucoes(prev => prev.filter(e => e.id !== id))
    } catch (err) {
      console.error(err)
      throw err
    }
  }, [])

  const getById = useCallback((id) => {
    return execucoes.find(e => e.id === id)
  }, [execucoes])

  return { execucoes, loading, error, add, update, remove, getById, reload: loadExecucoes }
}

export function useAlvaras() {
  const [alvaras, setAlvaras] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadAlvaras()
  }, [])

  const loadAlvaras = async () => {
    try {
      setLoading(true)
      const data = await fetchAlvaras()
      setAlvaras(data)
      setError(null)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const add = useCallback(async (alv) => {
    try {
      const newAlv = await createAlvara(alv)
      setAlvaras(prev => [newAlv, ...prev])
      return newAlv
    } catch (err) {
      console.error(err)
      throw err
    }
  }, [])

  const update = useCallback(async (id, updates) => {
    try {
      const updated = await updateAlvara(id, updates)
      setAlvaras(prev => prev.map(a => a.id === id ? updated : a))
      return updated
    } catch (err) {
      console.error(err)
      throw err
    }
  }, [])

  const remove = useCallback(async (id) => {
    try {
      await deleteAlvara(id)
      setAlvaras(prev => prev.filter(a => a.id !== id))
    } catch (err) {
      console.error(err)
      throw err
    }
  }, [])

  const getById = useCallback((id) => {
    return alvaras.find(a => a.id === id)
  }, [alvaras])

  const getByProcesso = useCallback((processo) => {
    return alvaras.filter(a => a.p === processo)
  }, [alvaras])

  return { alvaras, loading, error, add, update, remove, getById, getByProcesso, reload: loadAlvaras }
}
