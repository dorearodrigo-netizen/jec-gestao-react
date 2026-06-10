const SUPABASE_URL = 'https://uznnrxycugnogqcahqsa.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6bm5yeHljdWdub2dxY2FocXNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDY1NjQ2OSwiZXhwIjoyMDk2MjMyNDY5fQ.ZN4q_TJnS8LEI3OF5ZoonPFHegEm_yWyYqVA32ynfi0'

const headers = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`
}

// Execuções
export async function fetchExecucoes() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/execucoes?order=created_at.desc`,
      { headers }
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error('Erro ao buscar execuções:', error)
    return []
  }
}

export async function createExecucao(exec) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/execucoes`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...exec, created_at: new Date().toISOString() })
      }
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return Array.isArray(data) ? data[0] : data
  } catch (error) {
    console.error('Erro ao criar execução:', error)
    throw error
  }
}

export async function updateExecucao(id, updates) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/execucoes?id=eq.${id}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() })
      }
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return Array.isArray(data) ? data[0] : data
  } catch (error) {
    console.error('Erro ao atualizar execução:', error)
    throw error
  }
}

export async function deleteExecucao(id) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/execucoes?id=eq.${id}`,
      {
        method: 'DELETE',
        headers
      }
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return true
  } catch (error) {
    console.error('Erro ao deletar execução:', error)
    throw error
  }
}

// Alvarás
export async function fetchAlvaras() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/alvaras?order=created_at.desc`,
      { headers }
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.json()
  } catch (error) {
    console.error('Erro ao buscar alvarás:', error)
    return []
  }
}

export async function createAlvara(alv) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/alvaras`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...alv, created_at: new Date().toISOString() })
      }
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return Array.isArray(data) ? data[0] : data
  } catch (error) {
    console.error('Erro ao criar alvará:', error)
    throw error
  }
}

export async function updateAlvara(id, updates) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/alvaras?id=eq.${id}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() })
      }
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return Array.isArray(data) ? data[0] : data
  } catch (error) {
    console.error('Erro ao atualizar alvará:', error)
    throw error
  }
}

export async function deleteAlvara(id) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/alvaras?id=eq.${id}`,
      {
        method: 'DELETE',
        headers
      }
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return true
  } catch (error) {
    console.error('Erro ao deletar alvará:', error)
    throw error
  }
}
