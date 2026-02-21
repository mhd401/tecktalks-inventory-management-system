import { useEffect, useMemo, useState } from "react";

import { listProductsByStock } from "../api/products";
import { listPOS, createPOS, getSession, openSessionApi, closeSessionApi } from "../api/pos";

export default function POSList() {
  const [posList, setPosList] = useState([]);
  const [sessionStatus, setSessionStatus] = useState({});
  const [name, setName] = useState("");
  const [stockId, setStockId] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const [productsByStock, setProductsByStock] = useState({});

  async function loadPOS() {
    const data = await listPOS();
    setPosList(data);

    const statusMap = {};
    await Promise.all(
      data.map(async (p) => {
        try {
          const res = await getSession(p.id);
          statusMap[p.id] = res.session.status; // "OPEN" / "CLOSED"
        } catch {
          statusMap[p.id] = "CLOSED";
        }
      })
    );
    setSessionStatus(statusMap);
  }

  async function loadProducts(stockId) {
    if (productsByStock[stockId]) return; // cache

    try {
      const data = await listProductsByStock(stockId);
      setProductsByStock((prev) => ({ ...prev, [stockId]: data }));
    } catch (err) {
      console.error("Failed to load products for stock", stockId, err);
      setProductsByStock((prev) => ({ ...prev, [stockId]: [] }));
    }
  }

  // Load POS once on mount
  useEffect(() => {
    loadPOS().catch(console.error);
  }, []);

  // When POS list changes, load products for each stock_id
  useEffect(() => {
    posList.forEach((pos) => {
      loadProducts(pos.stock_id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posList]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !stockId) return;

    await createPOS({
      name: name.trim(),
      stock_id: Number(stockId),
    });

    setName("");
    setStockId("");
    await loadPOS();
  };

  const openSession = async (posId) => {
    setLoadingId(posId);
    try {
      await openSessionApi(posId);
      setSessionStatus((prev) => ({ ...prev, [posId]: "OPEN" }));
    } finally {
      setLoadingId(null);
    }
  };

  const closeSession = async (posId) => {
    setLoadingId(posId);
    try {
      await closeSessionApi(posId);
      setSessionStatus((prev) => ({ ...prev, [posId]: "CLOSED" }));
    } finally {
      setLoadingId(null);
    }
  };

  // KPIs from real backend products (across all stocks)
  const allProducts = useMemo(() => Object.values(productsByStock).flat(), [productsByStock]);
  const totalProducts = allProducts.length;
  const totalStock = useMemo(
    () => allProducts.reduce((sum, p) => sum + (p.quantity || 0), 0),
    [allProducts]
  );

  return (
    <div className="page">
      <div className="kpiRow">
        <div className="kpi">
          <strong>{posList.length}</strong>
          <span>POS units</span>
        </div>
        <div className="kpi">
          <strong>{totalProducts}</strong>
          <span>Products (backend)</span>
        </div>
        <div className="kpi">
          <strong>{totalStock}</strong>
          <span>Total stock qty</span>
        </div>
      </div>

      {/* CREATE POS */}
      <section className="card">
        <div className="cardHeader">
          <h2>Create POS</h2>
        </div>

        <form onSubmit={handleCreate} style={{ display: "flex", gap: 10 }}>
          <input
            className="input"
            placeholder="POS name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Stock ID"
            type="number"
            value={stockId}
            onChange={(e) => setStockId(e.target.value)}
          />
          <button className="btn btnPrimary">Create</button>
        </form>
      </section>

      {/* POS LIST */}
      <section className="card">
        <div className="cardHeader">
          <h2>POS Units</h2>
        </div>

        {posList.map((pos) => {
          const status = sessionStatus[pos.id] ?? "CLOSED";
          const isOpen = status === "OPEN";

          const products = productsByStock[pos.stock_id] ?? [];

          return (
            <div key={pos.id} className="card" style={{ marginBottom: 15 }}>
              <div className="cardHeader">
                <h2>{pos.name}</h2>
                <span>Stock ID: {pos.stock_id}</span>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span className="badge">
                  <span className={isOpen ? "dot dotGreen" : "dot dotRed"} />
                  Session: {status}
                </span>

                <div className="btnRow" style={{ marginTop: 0 }}>
                  <button
                    className="btn btnPrimary"
                    disabled={loadingId === pos.id}
                    onClick={() => openSession(pos.id)}
                    type="button"
                  >
                    Open
                  </button>
                  <button
                    className="btn btnDanger"
                    disabled={loadingId === pos.id}
                    onClick={() => closeSession(pos.id)}
                    type="button"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Products for this POS stock */}
              <div className="card" style={{ padding: 0, overflow: "hidden", marginTop: 12 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 100 }}>ID</th>
                      <th>Product</th>
                      <th style={{ width: 140 }}>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td>#{p.id}</td>
                        <td>{p.name}</td>
                        <td>{p.quantity}</td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ opacity: 0.7 }}>
                          No products for this stock yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
