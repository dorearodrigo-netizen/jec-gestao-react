import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://uznnrxycugnogqcahqsa.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6bm5yeHljdWdub2dxY2FocXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NTY0NjksImV4cCI6MjA5NjIzMjQ2OX0.8IzFtjUJmBZ1TQN0xAi46O9GRt38QKS75WD7U7e5ZQw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Execuções
export async function fetchExecucoes() {
  try {
    const { data, error } = await supabase
      .from('execucoes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar execuções:', error)
    return []
  }
}

export async function createExecucao(exec) {
  try {
    const { data, error } = await supabase
      .from('execucoes')
      .insert([{ ...exec, created_at: new Date() }])
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Erro ao criar execução:', error)
    throw error
  }
}

export async function updateExecucao(id, updates) {
  try {
    const { data, error } = await supabase
      .from('execucoes')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', id)
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Erro ao atualizar execução:', error)
    throw error
  }
}

export async function deleteExecucao(id) {
  try {
    const { error } = await supabase
      .from('execucoes')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Erro ao deletar execução:', error)
    throw error
  }
}

// Alvarás
export async function fetchAlvaras() {
  try {
    const { data, error } = await supabase
      .from('alvaras')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar alvarás:', error)
    return []
  }
}

export async function createAlvara(alv) {
  try {
    const { data, error } = await supabase
      .from('alvaras')
      .insert([{ ...alv, created_at: new Date() }])
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Erro ao criar alvará:', error)
    throw error
  }
}

export async function updateAlvara(id, updates) {
  try {
    const { data, error } = await supabase
      .from('alvaras')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', id)
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Erro ao atualizar alvará:', error)
    throw error
  }
}

export async function deleteAlvara(id) {
  try {
    const { error } = await supabase
      .from('alvaras')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Erro ao deletar alvará:', error)
    throw error
  }
}
