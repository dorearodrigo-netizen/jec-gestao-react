# JEC Gestão — Instruções para Claude

## 🔒 REGRA VINCULANTE: Cálculos com Índices Oficiais

**SEMPRE use dados oficiais dos índices econômicos para cálculos de execução.**

### Índices Obrigatórios
- **IPCA** (Índice Nacional de Preços ao Consumidor Amplo) — para correção monetária
- **Selic** (Sistema Especial de Liquidação e de Custódia) — para juros moratórios
- **Fonte oficial**: Banco Central do Brasil (BCB)
- **API**: https://www.bcb.gov.br/api/dados/v1/series

### Quando Aplicar
1. **Sempre que houver botão "Calcular"** — usar dados do BCB em tempo real
2. **Em exibições de valores** — mostrar data e fator de atualização
3. **Em campos obrigatórios** — nunca permitir valores estimados ou manuais

### O que NÃO fazer
❌ Aceitar valores calculados manualmente  
❌ Usar índices desatualizados ou em cache  
❌ Permitir bypass dessa validação  
❌ Usar fórmulas aproximadas quando dados oficiais estão disponíveis

### Implementação Atual
- `src/services/bacenService.js` — fetch dos dados oficiais do BCB
- `src/services/calculoService.js` — cálculos baseados nesses dados
- `ExecucaoForm.jsx` — botão Calcular chama `calcularExecucao()` que sempre busca dados novos

---

## 📄 PDFs: Inicial, Sentença e Acórdão

### Funcionalidades Atuais
✅ Upload de PDFs (arraste/clique)  
✅ Armazenamento dos arquivos  
✅ Exibição de confirmação

### Funcionalidades Futuras Necessárias?

**Responda estas questões para eu implementar:**

1. **Extração de dados dos PDFs**
   - Quer que eu leia o PDF e extraia automaticamente:
     - Data da sentença?
     - Valor condenado?
     - Dispositivos/fundamentação legal?
     - Partes envolvidas?

2. **Validação contra PDFs**
   - Quer validar se os dados preenchidos no formulário batem com o que está escrito no PDF?

3. **Geração de petições**
   - Quer que a ferramenta use o conteúdo dos PDFs para gerar petições automaticamente?

4. **Simples armazenamento**
   - Ou por enquanto é só guardar os arquivos como anexo/referência?

---

## Estrutura de Pastas
```
src/
├── components/
│   ├── execucoes/
│   │   ├── ExecucaoForm.jsx      (formulário + upload)
│   │   ├── ExecutacoesList.jsx   (listagem)
│   │   ├── PDFUpload.jsx         (componente upload)
│   │   └── index.js
│   ├── alvaras/
│   ├── dashboard/
│   ├── prazos/
│   └── layout/
├── services/
│   ├── bacenService.js           (IPCA, Selic do BCB)
│   ├── calculoService.js         (cálculos com índices oficiais)
│   ├── supabaseService.js        (BD)
│   └── pdfService.js             (geração de PDFs)
└── hooks/
    └── useSupabase.js            (CRUD)
```

---

## Commits Recentes
- Adicionado upload de PDFs (inicial, sentença, acórdão)
- Adicionado botão Calcular com dados do BCB
- Criado componentes Dashboard e Prazos
- Corrigido mapeamento de campos Supabase ↔ React
