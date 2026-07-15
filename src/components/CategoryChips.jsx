export default function CategoryChips({ categories, active, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
          !active ? 'bg-navy text-white border-navy' : 'bg-white text-slate-600 border-slate-200 hover:border-navy'
        }`}
      >
        Todas
      </button>
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={`shrink-0 flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
            active === c.id ? 'bg-navy text-white border-navy' : 'bg-white text-slate-600 border-slate-200 hover:border-navy'
          }`}
        >
          <span aria-hidden="true">{c.icon}</span> {c.name}
        </button>
      ))}
    </div>
  )
}
