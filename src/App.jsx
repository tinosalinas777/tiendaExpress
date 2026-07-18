import { Routes, Route } from "react-router-dom";
import StoreLayout from "./components/StoreLayout";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import AdminLayout from "./components/admin/AdminLayout";
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOrders from "./pages/admin/Orders";
import AdminProducts from "./pages/admin/Products";

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="pedidos" element={<AdminOrders />} />
        <Route path="productos" element={<AdminProducts />} />
      </Route>
      <Route path="/*" element={<StoreLayout />} />
    </Routes>
  );
}
