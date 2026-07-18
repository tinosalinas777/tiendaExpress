import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Hero from "../components/Hero";
import Benefits from "../components/Benefits";
import ProductCard from "../components/ProductCard";
import { fetchProducts } from "../lib/catalog";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts({ onOffer: true }).then((data) => {
      setProducts(data.slice(0, 8));
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <Hero />
      <Benefits />

      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-800 text-2xl text-navy">Ofertas</h2>
          <Link
            to="/tienda"
            className="text-brand-500 font-medium text-sm hover:underline"
          >
            Ver toda la tienda →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-slate-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
