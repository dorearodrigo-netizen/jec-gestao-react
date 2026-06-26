# 🔧 Configuração do Supabase para JEC Gestão

## Passo 1: Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Preenca os dados:
   - **Name**: `jec-gestao`
   - **Database Password**: Crie uma senha forte
   - **Region**: Escolha a mais próxima (ex: South America - São Paulo)
4. Aguarde a criação (pode levar alguns minutos)

## Passo 2: Obter Credenciais

1. Vá em **Project Settings** → **API**
2. Copie:
   - **Project URL** (será `VITE_SUPABASE_URL`)
   - **Project API Key** → **anon public** (será `VITE_SUPABASE_ANON_KEY`)

## Passo 3: Atualizar .env

Abra o arquivo `.env` na raiz do projeto e preencha:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

## Passo 4: Criar Tabelas no Supabase

Na console do Supabase, vá em **SQL Editor** e execute os seguintes scripts:

### Tabela: execucoes

```sql
CREATE TABLE IF NOT EXISTS execucoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_processo VARCHAR(20),
  vara TEXT,
  relator TEXT,
  exequente TEXT,
  executado TEXT,
  
  -- Valores
  dm_valor NUMERIC,
  dmat_valor NUMERIC,
  dmat_descricao TEXT,
  
  -- Datas
  data_transito DATE,
  dm_inicio_juros DATE,
  dm_inicio_corr DATE,
  
  -- Índices
  dm_correcao VARCHAR(10),
  dm_juros VARCHAR(50),
  
  -- Obrigação
  ob_possui BOOLEAN,
  ob_descricao TEXT,
  ob_prazo INTEGER,
  ob_astreinte NUMERIC,
  
  -- Documento
  tipo_documento VARCHAR(20),
  houve_reforma BOOLEAN,
  reformas JSONB,
  
  -- Cálculo
  calc JSONB,
  
  -- Metadados
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT numero_processo_key UNIQUE(numero_processo)
);

-- Índice para queries rápidas
CREATE INDEX idx_execucoes_numero ON execucoes(numero_processo);
CREATE INDEX idx_execucoes_created AT ON execucoes(created_at DESC);
```

### Tabela: alvaras

```sql
CREATE TABLE IF NOT EXISTS alvaras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_processo VARCHAR(20),
  data_alvara DATE,
  valor_depositado NUMERIC,
  valor_devido NUMERIC,
  descricao TEXT,
  
  -- Referência à execução
  execucao_id UUID REFERENCES execucoes(id) ON DELETE CASCADE,
  
  -- Metadados
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice para queries rápidas
CREATE INDEX idx_alvaras_execucao ON alvaras(execucao_id);
CREATE INDEX idx_alvaras_created AT ON alvaras(created_at DESC);
```

## Passo 5: Configurar Row Level Security (RLS)

⚠️ **IMPORTANTE**: Sem RLS, qualquer pessoa pode ver todos os dados!

Na console do Supabase:

1. Vá em **Authentication** → **Users**
2. Crie um usuário de teste (ou use o seu email)
3. Vá em **SQL Editor** e execute:

```sql
-- Habilitar RLS nas tabelas
ALTER TABLE execucoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alvaras ENABLE ROW LEVEL SECURITY;

-- Política: Usuários veem apenas seus próprios dados
CREATE POLICY "Users can view their own execucoes"
  ON execucoes FOR SELECT
  USING (auth.uid()::text = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own execucoes"
  ON execucoes FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own execucoes"
  ON execucoes FOR UPDATE
  USING (auth.uid()::text = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own execucoes"
  ON execucoes FOR DELETE
  USING (auth.uid()::text = user_id OR user_id IS NULL);

-- Mesmos policies para alvaras
CREATE POLICY "Users can view their own alvaras"
  ON alvaras FOR SELECT
  USING (auth.uid()::text = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own alvaras"
  ON alvaras FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own alvaras"
  ON alvaras FOR UPDATE
  USING (auth.uid()::text = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own alvaras"
  ON alvaras FOR DELETE
  USING (auth.uid()::text = user_id OR user_id IS NULL);
```

## Passo 6: Testar Conexão

Execute:

```bash
npm run dev
```

Se tudo estiver configurado corretamente, o app vai:
- ✅ Carregar dados do Supabase
- ✅ Salvar novas execuções
- ✅ Atualizar dados automaticamente

## Troubleshooting

### "VITE_SUPABASE_URL não está definido"
- Verifique se o arquivo `.env` existe na raiz do projeto
- Reinicie o servidor: `npm run dev`

### "Erro de autenticação"
- Verifique se a chave API está correta
- Confirme se as tabelas foram criadas

### "Dados não aparecem"
- Abra DevTools (F12) → Console
- Procure por mensagens de erro
- Verifique as policies de RLS

## Próximos Passos

Depois que Supabase estiver funcionando:

1. ✅ Testar salvar/carregar execuções
2. ✅ Integrar com geração de petições
3. ✅ Configurar autenticação (opcional)
4. ✅ Setup de backups automáticos
