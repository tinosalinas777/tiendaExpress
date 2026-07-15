export default function TopBar() {
  const items = [
    { icon: '🏍️', text: 'Envío en moto en el día' },
    { icon: '💳', text: 'Pagás con tarjeta o efectivo' },
    { icon: '🛡️', text: 'Productos frescos garantizados' },
  ]
  return (
    <div className="bg-navy text-white text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-8 text-center">
        {items.map((item) => (
          <span key={item.text} className="flex items-center gap-2 opacity-90">
            <span aria-hidden="true">{item.icon}</span>
            {item.text}
          </span>
        ))}
      </div>
    </div>
  )
}
