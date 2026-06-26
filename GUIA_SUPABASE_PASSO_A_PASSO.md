# 🎓 Guia Passo-a-Passo: Configuração do Supabase

**⏱️ Tempo estimado: 10-15 minutos**

---

## 📍 PASSO 1: Criar Projeto no Supabase
**Status**: ⏳ Você vai fazer

### 1️⃣ Abra o navegador e acesse:
```
https://supabase.com
```

### 2️⃣ Clique em **"Start your project"** ou **"New Project"**

### 3️⃣ Preencha os dados:
```
Nome do Projeto:     jec-gestao
Senha do Banco:      [Crie uma SENHA FORTE]
Região:              South America - São Paulo
```

✏️ **SALVE A SENHA** - você vai precisar!

### 4️⃣ Aguarde a criação (2-3 minutos)
Quando terminar, você vai para a dashboard do Supabase.

---

## 📍 PASSO 2: Copiar Credenciais
**Status**: ⏳ Você vai fazer

### 1️⃣ Na dashboard, vá em **"Project Settings"** (engrenagem no canto inferior esquerdo)

### 2️⃣ Clique em **"API"** na esquerda

### 3️⃣ Você vai ver:
- **Project URL** - Algo como: `https://xxxxx.supabase.co`
- **Project API Keys** - Com a chave **anon public**

### 4️⃣ **COPIE ESTAS INFORMAÇÕES:**
```
Project URL (VITE_SUPABASE_URL):
[Cole aqui quando copiar]
________________________________

Anon Public Key (VITE_SUPABASE_ANON_KEY):
[Cole aqui quando copiar]
________________________________
```

✏️ **GUARDE ESTAS CREDENCIAIS**

---

## 📍 PASSO 3: Preencher o Arquivo .env
**Status**: ⏳ Você vai fazer

### 1️⃣ Abra o arquivo `.env` na raiz do seu projeto:
```
C:\Users\Infosol\Downloads\jec-gestao-react\.env
```

### 2️⃣ Você vai ver:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

### 3️⃣ **SUBSTITUA** pelos valores que você copiou:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=seu_token_aqui
```

### 4️⃣ Salve o arquivo (Ctrl+S)

✅ **FEITO!**

---

## 📍 PASSO 4: Criar Tabelas no Supabase
**Status**: ⏳ Você vai fazer

### 1️⃣ Volte à dashboard do Supabase

### 2️⃣ No menu esquerdo, clique em **"SQL Editor"**

### 3️⃣ Clique em **"New Query"** (botão azul)

### 4️⃣ **COPIE E COLE** este SQL para a tabela `execucoes`:

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

CREATE INDEX idx_execucoes_numero ON execucoes(numero_processo);
CREATE INDEX idx_execucoes_created_at ON execucoes(created_at DESC);
```

### 5️⃣ Clique em **"Execute"** (triângulo ▶ azul)

✅ **Tabela execucoes criada!**

### 6️⃣ **NOVO QUERY** para a tabela `alvaras`:

Clique em **"New Query"** novamente e cole:

```sql
CREATE TABLE IF NOT EXISTS alvaras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_processo VARCHAR(20),
  data_alvara DATE,
  valor_depositado NUMERIC,
  valor_devido NUMERIC,
  descricao TEXT,
  
  execucao_id UUID REFERENCES execucoes(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alvaras_execucao ON alvaras(execucao_id);
CREATE INDEX idx_alvaras_created_at ON alvaras(created_at DESC);
```

### 7️⃣ Clique em **"Execute"**

✅ **Tabela alvaras criada!**

---

## 📍 PASSO 5: Configurar Row Level Security (RLS)
**Status**: ⏳ Você vai fazer

⚠️ **IMPORTANTE**: Isso protege seus dados!

### 1️⃣ **NOVO QUERY** para habilitar RLS:

```sql
ALTER TABLE execucoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alvaras ENABLE ROW LEVEL SECURITY;
```

Clique em **"Execute"**

✅ **RLS habilitado!**

### 2️⃣ **NOVO QUERY** para as policies de `execucoes`:

```sql
CREATE POLICY "Execucoes: SELECT"
  ON execucoes FOR SELECT
  USING (true);

CREATE POLICY "Execucoes: INSERT"
  ON execucoes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Execucoes: UPDATE"
  ON execucoes FOR UPDATE
  USING (true);

CREATE POLICY "Execucoes: DELETE"
  ON execucoes FOR DELETE
  USING (true);
```

Clique em **"Execute"**

✅ **Policies execucoes criadas!**

### 3️⃣ **NOVO QUERY** para as policies de `alvaras`:

```sql
CREATE POLICY "Alvaras: SELECT"
  ON alvaras FOR SELECT
  USING (true);

CREATE POLICY "Alvaras: INSERT"
  ON alvaras FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Alvaras: UPDATE"
  ON alvaras FOR UPDATE
  USING (true);

CREATE POLICY "Alvaras: DELETE"
  ON alvaras FOR DELETE
  USING (true);
```

Clique em **"Execute"**

✅ **Policies alvaras criadas!**

---

## 📍 PASSO 6: Testar a Conexão
**Status**: ⏳ Próximo passo

### 1️⃣ Volte ao terminal e **REINICIE** o servidor:

```bash
npm run dev:all
```

### 2️⃣ Acesse http://localhost:3000

### 3️⃣ Se você vir **a página carregando sem erros**, está funcionando! ✅

---

## ✅ CHECKLIST FINAL

- [ ] Projeto criado no Supabase
- [ ] Credenciais copiadas
- [ ] `.env` preenchido
- [ ] Tabela `execucoes` criada
- [ ] Tabela `alvaras` criada
- [ ] RLS habilitado
- [ ] Policies criadas
- [ ] Servidor reiniciado
- [ ] App carregando em localhost:3000

---

## 🆘 Problemas?

### "Erro de SQL syntax"
- Copie o SQL **exatamente** como está
- Certifique-se de executar cada query separadamente

### "Project não aparece"
- Aguarde 2-3 minutos
- Refresque a página

### "App não conecta ao Supabase"
- Abra DevTools (F12) → Console
- Procure por mensagens de erro
- Verifique se o `.env` foi preenchido corretamente

---

**Pronto para começar? 🚀**
