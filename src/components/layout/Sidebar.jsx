import {
  FileText,
  Award,
  BarChart3,
  Calendar,
  Download,
  Upload
} from 'lucide-react'

export function Sidebar({ activeTab, onTabChange, onExport, onImport }) {
  const tabs = [
    { id: 'execucoes', label: 'Execuções', icon: FileText },
    { id: 'alvaras', label: 'Alvarás', icon: Award },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'prazos', label: 'Prazos', icon: Calendar }
  ]

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-navy flex flex-col z-50">
      {/* Logo */}
      <div className="p-7 border-b border-white/10">
        <h1 className="font-display text-lg text-white leading-tight mb-1">
          JEC Gestão
        </h1>
        <p className="text-xs text-gold2 tracking-wider font-light">
          Rodrigo Dórea & Henrique Leonel
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-xs font-bold uppercase text-white/30 tracking-widest px-3 mb-3 mt-4">
          Módulos
        </p>
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                isActive
                  ? 'bg-gold text-navy font-semibold'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span>{tab.label}</span>
            </button>
          )
        })}

        <p className="text-xs font-bold uppercase text-white/30 tracking-widest px-3 mb-3 mt-6">
          Ações
        </p>
        <button
          onClick={onExport}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/10 hover:text-white transition-all"
        >
          <Download size={18} className="flex-shrink-0" />
          <span>Exportar dados</span>
        </button>
        <button
          onClick={onImport}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/10 hover:text-white transition-all"
        >
          <Upload size={18} className="flex-shrink-0" />
          <span>Importar dados</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 text-xs text-white/40 leading-relaxed">
        OAB/BA 88.688 · OAB/BA 60.205<br />
        Salvador — Bahia
      </div>
    </aside>
  )
}
