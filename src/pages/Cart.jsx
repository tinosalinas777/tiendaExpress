import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function Cart() {
  const {
    items,
    updateQty,
    removeItem,
    subtotal,
    shipping,
    total,
    FREE_SHIPPING_THRESHOLD,
  } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">🛒</p>
        <h1 className="font-display font-800 text-xl text-navy mb-2">
          Tu carrito está vacío
        </h1>
        <p className="text-slate-500 mb-6">
          Todavía no agregaste productos. ¡Dale una vuelta a la tienda!
        </p>
        <Link
          to="/tienda"
          className="bg-brand-500 hover:bg-brand-600 text-white font-semibold px-6 py-3 rounded-lg"
        >
          Ir a la tienda
        </Link>
      </div>
    );
  }

  const missing = FREE_SHIPPING_THRESHOLD - subtotal;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-display font-800 text-2xl text-navy mb-6">
        Tu carrito
      </h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 flex flex-col gap-3">
          {missing > 0 && (
            <div className="bg-brand-50 text-brand-700 text-sm rounded-lg p-3">
              Te faltan $ {missing.toLocaleString("es-AR")} para tener envío
              gratis 🏍️
            </div>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 border border-slate-100 rounded-xl p-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-50 rounded-lg grid place-items-center text-3xl shrink-0 overflow-hidden">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    item.icon || "🛒"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-navy text-sm truncate">
                    {item.name}
                  </p>
                  <p className="text-slate-400 text-xs">
                    $ {item.price.toLocaleString("es-AR")} / {item.unit}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                <div className="flex items-center border border-slate-200 rounded-lg shrink-0">
                  <button
                    onClick={() => updateQty(item.id, item.qty - 1)}
                    className="w-8 h-8 grid place-items-center text-slate-600"
                    aria-label={`Restar unidad de ${item.name}`}
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-medium">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.id, item.qty + 1)}
                    className="w-8 h-8 grid place-items-center text-slate-600"
                    aria-label={`Sumar unidad de ${item.name}`}
                  >
                    +
                  </button>
                </div>
                <p className="font-semibold text-navy w-16 sm:w-20 text-right shrink-0">
                  $ {(item.price * item.qty).toLocaleString("es-AR")}
                </p>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                  aria-label={`Quitar ${item.name} del carrito`}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-slate-100 rounded-xl p-5 h-fit">
          <h2 className="font-display font-700 text-navy mb-4">Resumen</h2>
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>Subtotal</span>
            <span>$ {subtotal.toLocaleString("es-AR")}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>Envío (moto)</span>
            <span>
              {shipping === 0
                ? "Gratis"
                : `$ ${shipping.toLocaleString("es-AR")}`}
            </span>
          </div>
          <div className="flex justify-between font-display font-800 text-navy text-lg border-t border-slate-100 mt-3 pt-3">
            <span>Total</span>
            <span>$ {total.toLocaleString("es-AR")}</span>
          </div>
          <Link
            to="/checkout"
            className="mt-5 block text-center bg-brand-500 hover:bg-brand-600 transition-colors text-white font-semibold px-6 py-3 rounded-lg"
          >
            Finalizar compra
          </Link>
        </div>
      </div>
    </div>
  );
}
