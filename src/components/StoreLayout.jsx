import { Routes, Route } from "react-router-dom";
//import TopBar from './TopBar'
import Header from "./Header";
import Footer from "./Footer";
import Home from "../pages/Home";
import Shop from "../pages/Shop";
import ProductDetail from "../pages/ProductDetail";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Contact from "../pages/Contact";
import PaymentResult from "../pages/PaymentResult";
import WhatsAppFloatButton from "./WhatsAppFloatButton";

export default function StoreLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tienda" element={<Shop />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/contacto" element={<Contact />} />
          <Route
            path="/pago-exitoso"
            element={<PaymentResult variant="success" />}
          />
          <Route
            path="/pago-fallido"
            element={<PaymentResult variant="failure" />}
          />
          <Route
            path="/pago-pendiente"
            element={<PaymentResult variant="pending" />}
          />
        </Routes>
      </main>
      <Footer />
      <WhatsAppFloatButton />
    </div>
  );
}
