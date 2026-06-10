import { useState, useCallback, useEffect } from 'react'

export function useStorage(key, initialValue = null) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading from localStorage: ${key}`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error writing to localStorage: ${key}`, error)
    }
  }, [key, storedValue])

  return [storedValue, setValue]
}

export function useExecucoes() {
  const [execucoes, setExecucoes] = useStorage('jec_exec_v1', [])

  const add = useCallback((exec) => {
    setExecucoes(prev => [...prev, { ...exec, id: Date.now().toString() }])
  }, [setExecucoes])

  const update = useCallback((id, updates) => {
    setExecucoes(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
  }, [setExecucoes])

  const remove = useCallback((id) => {
    setExecucoes(prev => prev.filter(e => e.id !== id))
  }, [setExecucoes])

  const getById = useCallback((id) => {
    return execucoes.find(e => e.id === id)
  }, [execucoes])

  return { execucoes, add, update, remove, getById }
}

export function useAlvaras() {
  const [alvaras, setAlvaras] = useStorage('jec_alv_v1', [])

  const add = useCallback((alv) => {
    setAlvaras(prev => [...prev, { ...alv, id: Date.now().toString() }])
  }, [setAlvaras])

  const update = useCallback((id, updates) => {
    setAlvaras(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))
  }, [setAlvaras])

  const remove = useCallback((id) => {
    setAlvaras(prev => prev.filter(a => a.id !== id))
  }, [setAlvaras])

  const getById = useCallback((id) => {
    return alvaras.find(a => a.id === id)
  }, [alvaras])

  const getByProcesso = useCallback((processo) => {
    return alvaras.filter(a => a.p === processo)
  }, [alvaras])

  return { alvaras, add, update, remove, getById, getByProcesso }
}
