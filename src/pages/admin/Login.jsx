import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminLogin() {
  const { signIn, session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (session) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError("Email o contraseña incorrectos.");
      return;
    }
    navigate("/admin");
  };

  return (
    <div
      className="min-h-screen grid place-items-center relative bg-cover bg-center px-4"
      style={{ backgroundImage: "url('/fondoLogin.png')" }}
    >
      <div className="absolute inset-0 bg-navy/60" />
      <div className="relative w-full max-w-sm bg-white border border-slate-100 rounded-xl shadow-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-9 h-9 rounded-lg bg-brand-500 text-white grid place-items-center font-display font-800 text-lg">
            A
          </span>
          <span className="font-display font-800 text-lg text-navy">
            Panel de <span className="text-brand-500">administración</span>
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 transition-colors text-white font-semibold px-6 py-2.5 rounded-lg"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="text-xs text-slate-400 mt-5">
          Bienvenido al panel de administración. Ingresá con tu email y
          contraseña para continuar.
        </p>
      </div>
    </div>
  );
}
