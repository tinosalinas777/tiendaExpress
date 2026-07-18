import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

function getStartOfDay(d = new Date()) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getStartOfWeek(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay(); // 0 (domingo) a 6 (sábado)
  const diff = (day === 0 ? -6 : 1) - day; // retrocede hasta el lunes
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getStartOfMonth(d = new Date()) {
  const date = new Date(d.getFullYear(), d.getMonth(), 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ pending: 0, lowStock: 0 });
  const [earnings, setEarnings] = useState({
    day: { total: 0, count: 0 },
    week: { total: 0, count: 0 },
    month: { total: 0, count: 0 },
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const startOfDay = getStartOfDay();
      const startOfWeek = getStartOfWeek();
      const startOfMonth = getStartOfMonth();

      const [
        { data: pending },
        { data: lowStock },
        { data: monthOrders },
        { data: recent },
      ] = await Promise.all([
        supabase.from("orders").select("id").eq("status", "pendiente"),
        supabase
          .from("products")
          .select("id")
          .lt("stock", 5)
          .eq("active", true),
        // Traemos todo el mes de una — el día y la semana son subconjuntos, así
        // no hace falta pegarle tres veces a Supabase.
        supabase
          .from("orders")
          .select("total, created_at")
          .neq("status", "cancelado")
          .gte("created_at", startOfMonth.toISOString()),
        supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      const sumSince = (from) =>
        (monthOrders || [])
          .filter((o) => new Date(o.created_at) >= from)
          .reduce(
            (acc, o) => ({
              total: acc.total + Number(o.total),
              count: acc.count + 1,
            }),
            { total: 0, count: 0 },
          );

      setEarnings({
        day: sumSince(startOfDay),
        week: sumSince(startOfWeek),
        month: sumSince(startOfMonth),
      });
      setStats({
        pending: pending?.length || 0,
        lowStock: lowStock?.length || 0,
      });
      setRecentOrders(recent || []);
      setLoading(false);
    }
    load();
  }, []);

  const earningsCards = [
    { label: "Hoy", key: "day" },
    { label: "Esta semana", key: "week" },
    { label: "Este mes", key: "month" },
  ];

  const cards = [
    {
      label: "Pedidos pendientes",
      value: stats.pending,
      icon: "🏍️",
      link: "/admin/pedidos",
    },
    {
      label: "Productos con poco stock",
      value: stats.lowStock,
      icon: "⚠️",
      link: "/admin/productos",
    },
  ];

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-display font-800 text-2xl text-navy mb-6">Resumen</h1>

      <h2 className="font-display font-700 text-navy text-sm uppercase tracking-wide text-slate-500 mb-3">
        Ganancias
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {earningsCards.map((c) => (
          <div
            key={c.key}
            className="bg-white border border-slate-100 rounded-xl p-5 shadow-card"
          >
            <p className="text-slate-500 text-sm">{c.label}</p>
            <p className="font-display font-800 text-2xl text-navy mt-1">
              {loading
                ? "—"
                : `$ ${earnings[c.key].total.toLocaleString("es-AR")}`}
            </p>
            <p className="text-slate-400 text-xs mt-1">
              {loading
                ? ""
                : `${earnings[c.key].count} pedido${earnings[c.key].count === 1 ? "" : "s"}`}
            </p>
          </div>
        ))}
      </div>
      <p className="text-slate-400 text-xs -mt-5 mb-8">
        No incluye pedidos cancelados.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {cards.map((c) => {
          const Wrapper = c.link ? Link : "div";
          return (
            <Wrapper
              key={c.label}
              to={c.link}
              className="bg-white border border-slate-100 rounded-xl p-5 shadow-card block hover:shadow-cardHover transition-shadow"
            >
              <span className="text-2xl">{c.icon}</span>
              <p className="font-display font-800 text-2xl text-navy mt-2">
                {loading ? "—" : c.value}
              </p>
              <p className="text-slate-500 text-sm">{c.label}</p>
            </Wrapper>
          );
        })}
      </div>

      <div className="bg-white border border-slate-100 rounded-xl shadow-card">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-display font-700 text-navy">Últimos pedidos</h2>
          <Link
            to="/admin/pedidos"
            className="text-brand-500 text-sm font-medium hover:underline"
          >
            Ver todos →
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {loading ? (
            <p className="p-5 text-slate-400 text-sm">Cargando...</p>
          ) : recentOrders.length === 0 ? (
            <p className="p-5 text-slate-400 text-sm">
              Todavía no hay pedidos.
            </p>
          ) : (
            recentOrders.map((o) => (
              <div
                key={o.id}
                className="px-5 py-3 flex items-center justify-between text-sm"
              >
                <div>
                  <p className="font-medium text-navy">
                    #{o.id} · {o.customer_name}
                  </p>
                  <p className="text-slate-400">
                    {new Date(o.created_at).toLocaleString("es-AR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-navy">
                    $ {Number(o.total).toLocaleString("es-AR")}
                  </p>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    pendiente: "bg-amber-100 text-amber-700",
    en_camino: "bg-brand-100 text-brand-700",
    entregado: "bg-green-100 text-green-700",
    cancelado: "bg-red-100 text-red-700",
  };
  const labels = {
    pendiente: "Pendiente",
    en_camino: "En camino",
    entregado: "Entregado",
    cancelado: "Cancelado",
  };
  return (
    <span
      className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${styles[status] || "bg-slate-100 text-slate-600"}`}
    >
      {labels[status] || status}
    </span>
  );
}

export function PaymentBadge({ status }) {
  const styles = {
    aprobado: "bg-green-100 text-green-700",
    pendiente: "bg-amber-100 text-amber-700",
    rechazado: "bg-red-100 text-red-700",
    no_aplica: "bg-slate-100 text-slate-500",
  };
  const labels = {
    aprobado: "Pago aprobado",
    pendiente: "Pago pendiente",
    rechazado: "Pago rechazado",
    no_aplica: "Efectivo/transferencia",
  };
  return (
    <span
      className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${styles[status] || "bg-slate-100 text-slate-600"}`}
    >
      {labels[status] || status}
    </span>
  );
}
