/**
 * Configuração de ambiente do frontend.
 *
 * API_URL: endereço do servidor de PDF/OCR/petições/índices.
 *   - Em desenvolvimento usa localhost:3001.
 *   - Em produção, defina VITE_API_URL (ex.: https://seu-backend.onrender.com)
 *     nas variáveis de ambiente da hospedagem (Vercel).
 */
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
