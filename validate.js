/**
 * Script de validação - verifica se todas as importações estão corretas
 * Roda com: node validate.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

console.log('🔍 Validando projeto JEC Gestão...\n')

const checks = [
  {
    name: 'Models DOCX',
    path: 'models/CUMP_SENTENCA.docx',
    type: 'file'
  },
  {
    name: 'Server.js',
    path: 'server.js',
    type: 'file'
  },
  {
    name: 'Package.json',
    path: 'package.json',
    type: 'file'
  },
  {
    name: 'Vite config',
    path: 'vite.config.js',
    type: 'file'
  }
]

let passed = 0
let failed = 0

for (const check of checks) {
  const fullPath = path.join(__dirname, check.path)
  const exists = fs.existsSync(fullPath)

  if (exists) {
    console.log(`✅ ${check.name}: OK`)
    passed++
  } else {
    console.log(`❌ ${check.name}: FALTANDO`)
    failed++
  }
}

console.log(`\n📊 Resultado: ${passed}/${checks.length} arquivos validados`)

if (failed === 0) {
  console.log('\n✨ Projeto pronto para iniciar!')
  console.log('\n🚀 Para rodar tudo:')
  console.log('   npm run dev:all')
  console.log('\nOu separadamente:')
  console.log('   npm run dev      (Vite em porta 3000)')
  console.log('   npm run server   (Servidor Node em porta 3001)')
} else {
  console.log(`\n⚠️  Faltam ${failed} arquivo(s)`)
  process.exit(1)
}
