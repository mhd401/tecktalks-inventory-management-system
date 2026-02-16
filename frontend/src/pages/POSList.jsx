import { useMemo, useState } from "react";

export default function POSList() {
  const posList = [
    { id: 1, name: "POS 1", stockId: 10 },
    { id: 2, name: "POS 2", stockId: 11 },
  ];

  // Dummy products (you can later map them to stockId if you want)
  const products = [
    { id: 101, name: "Coca Cola", price: 1.5, stockQty: 24 },
    { id: 102, name: "Water Bottle", price: 0.8, stockQty: 60 },
    { id: 103, name: "Chips", price: 1.2, stockQty: 15 },
    { id: 104, name: "Chocolate Bar", price: 1.0, stockQty: 5 },
  ];

  // Session status per POS id
  const [sessionStatus, setSessionStatus] = useState(() => {
    const initial = {};
    posList.forEach((p) => (initial[p.id] = "CLOSED"));
    return initial;
  });

  const openSession = (posId) =>
    setSessionStatus((prev) => ({ ...prev, [posId]: "OPEN" }));

  const closeSession = (posId) =>
    setSessionStatus((prev) => ({ ...prev, [posId]: "CLOSED" }));

  // (Optional) totals for KPI feel
  const totalProducts = products.length;
  const totalStock = useMemo(
    () => products.reduce((sum, p) => sum + p.stockQty, 0),
    [products]
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
          <span>Products (mock)</span>
        </div>
        <div className="kpi">
          <strong>{totalStock}</strong>
          <span>Total stock qty</span>
        </div>
      </div>

      <section className="card">
        <div className="cardHeader">
          <h2>POS Units</h2>
          <span>Session + products (mock)</span>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {posList.map((pos) => {
            const status = sessionStatus[pos.id];
            const isOpen = status === "OPEN";

            return (
              <div
                key={pos.id}
                className="card"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <div className="cardHeader">
                  <h2>{pos.name}</h2>
                  <span>Stock ID: {pos.stockId}</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    marginBottom: 10,
                  }}
                >
                  <span className="badge">
                    <span className={isOpen ? "dot dotGreen" : "dot dotRed"} />
                    Session:{" "}
                    <b style={{ color: "rgba(255,255,255,0.92)" }}>{status}</b>
                  </span>

                  <div className="btnRow">
                    <button
                      className="btn btnPrimary"
                      onClick={() => openSession(pos.id)}
                    >
                      Open Session
                    </button>
                    <button
                      className="btn btnDanger"
                      onClick={() => closeSession(pos.id)}
                    >
                      Close Session
                    </button>
                  </div>
                </div>

                {/* Products table (dummy) */}
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: 100 }}>ID</th>
                        <th>Product</th>
                        <th style={{ width: 120 }}>Price</th>
                        <th style={{ width: 140 }}>Stock Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id}>
                          <td>#{p.id}</td>
                          <td>{p.name}</td>
                          <td>${p.price.toFixed(2)}</td>
                          <td>{p.stockQty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p
                  style={{
                    margin: "10px 0 0",
                    color: "rgba(255,255,255,0.65)",
                    fontSize: 12,
                  }}
                >
                  Products are mock data • later you can filter by stockId
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
