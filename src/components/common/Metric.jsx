export function Metric({ icon: Icon, label, value, subtext, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-900',
    green: 'bg-teal-100 text-teal',
    amber: 'bg-amber-100 text-amber',
    gold: 'bg-yellow-100 text-yellow-900'
  }

  return (
    <div className="card p-6">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colorClasses[color]}`}>
        {Icon && <Icon size={20} />}
      </div>
      <p className="text-xs font-bold uppercase text-text3 tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-bold text-text leading-none">{value}</p>
      {subtext && <p className="text-xs text-text3 mt-2">{subtext}</p>}
    </div>
  )
}
