import { useState } from 'react'

// Senha única definida por variável de ambiente (VITE_APP_PASSWORD na Vercel).
// Sem ela (ex.: desenvolvimento local) o acesso é liberado direto.
const SENHA = import.meta.env.VITE_APP_PASSWORD
const CHAVE = 'jec_acesso_ok'

/**
 * Cadeado simples de acesso. NÃO é autenticação completa — é um deterrente:
 * impede o acesso casual à tela. A proteção real dos dados depende das regras
 * (RLS) do Supabase. Mantém o acesso durante a sessão do navegador.
 */
export function PasswordGate({ children }) {
  const [liberado, setLiberado] = useState(
    () => !SENHA || sessionStorage.getItem(CHAVE) === '1'
  )
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(false)

  if (liberado) return children

  const entrar = (e) => {
    e.preventDefault()
    if (senha === SENHA) {
      sessionStorage.setItem(CHAVE, '1')
      setLiberado(true)
    } else {
      setErro(true)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f1d3a' }}>
      <form onSubmit={entrar} style={{ background: '#fff', padding: '2rem', borderRadius: 12, width: 320, boxShadow: '0 10px 40px rgba(0,0,0,.3)' }}>
        <h1 style={{ fontSize: '1.15rem', margin: '0 0 .25rem', color: '#0f1d3a' }}>JEC Gestão</h1>
        <p style={{ fontSize: '.8rem', color: '#666', margin: '0 0 1rem' }}>Acesso restrito — informe a senha.</p>
        <input
          type="password"
          value={senha}
          autoFocus
          onChange={(e) => { setSenha(e.target.value); setErro(false) }}
          placeholder="Senha"
          style={{ width: '100%', padding: '.6rem', border: '1px solid #ccc', borderRadius: 8, marginBottom: '.5rem', boxSizing: 'border-box' }}
        />
        {erro && <p style={{ color: '#c00', fontSize: '.75rem', margin: '0 0 .5rem' }}>Senha incorreta.</p>}
        <button type="submit" style={{ width: '100%', padding: '.6rem', background: '#0f1d3a', color: '#fff', border: 0, borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
          Entrar
        </button>
      </form>
    </div>
  )
}
