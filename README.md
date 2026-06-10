# JEC Gestão — React + Vite + Tailwind

Sistema profissional de gestão de execuções e alvarás em JEC/BA, desenvolvido com React, Vite, Tailwind CSS e boas práticas de programação.

## 🚀 Características

- **React 18** com Hooks e composição de componentes
- **Vite** para desenvolvimento e build ultrarrápido
- **Tailwind CSS** para estilização moderna
- **localStorage** para persistência de dados
- **BACEN SGS API** para cálculo de índices (IPCA, Selic)
- **jsPDF** para geração de petições jurídicas
- **Lucide Icons** para ícones vetoriais
- **Componentização** limpa e reutilizável
- **Hooks customizados** para lógica isolada
- **Serviços** modulares para cálculos e API

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx       # Menu lateral
│   │   ├── Topbar.jsx        # Barra superior
│   │   └── Modal.jsx         # Modal genérico
│   ├── execucoes/
│   │   ├── ExecucaoForm.jsx  # Formulário de cadastro
│   │   └── ExecutacoesList.jsx # Lista com cards
│   ├── alvaras/              # (em desenvolvimento)
│   ├── dashboard/            # (em desenvolvimento)
│   ├── prazos/               # (em desenvolvimento)
│   └── common/               # Componentes reutilizáveis
├── hooks/
│   ├── useStorage.js         # localStorage + execuções/alvarás
│   ├── useNotification.js    # Sistema de notificações
│   └── index.js              # Exports
├── services/
│   ├── bacenService.js       # BACEN SGS API
│   ├── calculoService.js     # Cálculos monetários
│   ├── pdfService.js         # Geração de PDFs
│   └── index.js              # Exports
├── types/
│   └── index.js              # Definições de tipos (JSDoc)
├── utils/                    # Funções utilitárias
├── App.jsx                   # Componente principal
├── main.jsx                  # Entry point
└── index.css                 # Tailwind + componentes

public/                        # Arquivos estáticos
package.json
vite.config.js
tailwind.config.js
postcss.config.js
```

## 🛠️ Instalação e Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Iniciar servidor de desenvolvimento

```bash
npm run dev
```

A aplicação abrirá em `http://localhost:3000`

### 3. Build para produção

```bash
npm run build
```

## 📚 Arquitetura e Boas Práticas

### Componentes

- **Componentes funcionais** com Hooks
- **Props bem definidas** (JSDoc quando complexo)
- **Separação clara** de responsabilidades
- **Reutilização** máxima (DRY principle)

### Hooks Customizados

- `useStorage()` — persistência em localStorage
- `useExecucoes()` — CRUD de execuções com memoização
- `useAlvaras()` — CRUD de alvarás
- `useNotification()` — sistema de toasts

### Serviços

- **bacenService.js** — fetch de índices BACEN com cache
- **calculoService.js** — cálculos de CM, juros, totalizações
- **pdfService.js** — geração de petições jurídicas com jsPDF

### Estado Global

Usa **hooks locais** + **localStorage**. Para aplicações maiores, considere `zustand` ou `Redux`.

## 🎨 Design System

### Cores (Tailwind)

- `navy` (#1a2942) — Primária
- `gold` (#c9a84c) — Destaque/CTA
- `teal` (#0d6b55) — Sucesso/Positivo
- `red` (#9b3030) — Alerta/Negativo
- `amber` (#7a4910) — Aviso

### Componentes Base

- `.btn` — Botão padrão
- `.btn-primary` — Botão principal
- `.btn-gold` — Botão secundário
- `.input` — Campo de texto
- `.label` — Rótulo de formulário
- `.card` — Card com sombra
- `.badge` — Distintivo de status

## 🚀 Implementando Novos Módulos

### Exemplo: Módulo Alvarás

1. Criar componentes em `src/components/alvaras/`
   - `AlvaraForm.jsx`
   - `AlvarasList.jsx`
   - `AlvaraCard.jsx`

2. Adicionar lógica em hooks se necessário

3. Integrar em `App.jsx` na aba correspondente

4. Estilizar com Tailwind usando sistema de cores

## 📋 Checklist de Funcionalidades

- [x] Cadastro de execuções
- [x] Cálculo de valores (IPCA, Selic)
- [x] Geração de PDFs com jsPDF
- [x] Sidebar navegação
- [x] Modal genérico
- [x] Notificações toast
- [ ] Módulo alvarás (interface + CRUD)
- [ ] Dashboard com gráficos
- [ ] Cálculo de prazos com feriados
- [ ] Import/export JSON
- [ ] Integração Supabase (opcional)
- [ ] Testes unitários (Jest)

## 🔧 Troubleshooting

### localStorage não funciona
- Verificar se o navegador tem localStorage habilitado
- Não usar em modo privado/incógnito

### PDFs não geram
- Verificar se jsPDF está importado corretamente
- Verificar console para erros

### BACEN API indisponível
- A API pode estar temporariamente fora
- Implementar fallback com valores hardcoded

## 📝 Exemplo de Uso

```javascript
// Em um componente
import { useExecucoes } from './hooks'
import { calcularExecucao, formatarMoeda } from './services'

function MeuComponente() {
  const { execucoes, add, update } = useExecucoes()
  
  // Usar normalmente
  const salvar = (novaExec) => {
    add(novaExec)
  }
  
  return (
    <div>
      {execucoes.map(e => (
        <p key={e.id}>{e.p} — {formatarMoeda(e.dm)}</p>
      ))}
    </div>
  )
}
```

## 🤝 Contribuindo

1. Criar branch: `git checkout -b feature/nova-funcionalidade`
2. Commit: `git commit -am 'Adiciona nova funcionalidade'`
3. Push: `git push origin feature/nova-funcionalidade`
4. Pull Request para `main`

## 📄 Licença

Desenvolvido para HL Advocacia — Rodrigo Dórea & Henrique Leonel

---

**Desenvolvido com React, Vite e Tailwind CSS** ⚡
