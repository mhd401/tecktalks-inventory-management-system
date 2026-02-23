import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import InventoryList from "./pages/InventoryList";
import POSList from "./pages/POSList";
import StockList from "./pages/StockList";
import ProductList from "./pages/ProductList";

function NotFound() {
  return (
    <div className="card">
      <div className="cardHeader">
        <h2>404</h2>
        <span>Page not found</span>
      </div>
      <p style={{ color: "rgba(255,255,255,0.65)", margin: 0 }}>
        Use the sidebar to navigate.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/inventories" replace />} />
          <Route path="/inventories" element={<InventoryList />} />
          <Route path="/pos" element={<POSList />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/stocks" element={<StockList />} />
          <Route path="/products" element={<ProductList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
