import { useEffect, useMemo, useState } from "react";
import { posApi } from "../api/posApi";
import { productApi } from "../api/productApi";

export default function POSList() {
  const [posList, setPosList] = useState([]);
  const [sessionsByPos, setSessionsByPos] = useState({});
  const [productsByPos, setProductsByPos] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState({}); // { [posId]: true/false }

  const loadPOSData = async () => {
    setLoading(true);
    setError("");

    try {
      const posUnits = await posApi.list();
      const safePOS = Array.isArray(posUnits) ? posUnits : [];
      setPosList(safePOS);

      // Load sessions + products for each POS
      const results = await Promise.all(
        safePOS.map(async (pos) => {
          const [sessions, products] = await Promise.all([
            posApi.listSessions(pos.id).catch(() => []),
            productApi.listByStock(pos.stock_id).catch(() => []),
          ]);

          return {
            posId: pos.id,
            sessions: Array.isArray(sessions) ? sessions : [],
            products: Array.isArray(products) ? products : [],
          };
        })
      );

      const nextSessionsByPos = {};
      const nextProductsByPos = {};

      results.forEach((r) => {
        nextSessionsByPos[r.posId] = r.sessions;
        nextProductsByPos[r.posId] = r.products;
      });

      setSessionsByPos(nextSessionsByPos);
      setProductsByPos(nextProductsByPos);
    } catch (err) {
      setError(err.message || "Failed to load POS data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPOSData();
  }, []);

  const getStatus = (posId) => {
    const sessions = sessionsByPos[posId] || [];
    return sessions.length > 0 ? sessions[0].status : "CLOSED"; // listSessions is DESC
  };

  const handleOpenSession = async (posId) => {
    setActionLoading((prev) => ({ ...prev, [posId]: true }));
    setError("");
    try {
      await posApi.openSession(posId);
      const sessions = await posApi.listSessions(posId);
      setSessionsByPos((prev) => ({ ...prev, [posId]: sessions || [] }));
    } catch (err) {
      setError(err.message || "Failed to open session");
    } finally {
      setActionLoading((prev) => ({ ...prev, [posId]: false }));
    }
  };

  const handleCloseSession = async (posId) => {
    setActionLoading((prev) => ({ ...prev, [posId]: true }));
    setError("");
    try {
      await posApi.closeSession(posId);
      const sessions = await posApi.listSessions(posId);
      setSessionsByPos((prev) => ({ ...prev, [posId]: sessions || [] }));
    } catch (err) {
      setError(err.message || "Failed to close session");
    } finally {
      setActionLoading((prev) => ({ ...prev, [posId]: false }));
    }
  };

  const totalProducts = useMemo(() => {
    return Object.values(productsByPos).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  }, [productsByPos]);

  const totalStock = useMemo(() => {
    return Object.values(productsByPos).reduce((sum, arr) => {
      const local = (arr || []).reduce(
        (s, p) => s + Number(p.quantity || 0),
        0
      );
      return sum + local;
    }, 0);
  }, [productsByPos]);

  return (
    <div className="page">
      <div className="kpiRow">
        <div className="kpi">
          <strong>{loading ? "..." : posList.length}</strong>
          <span>POS units</span>
        </div>
        <div className="kpi">
          <strong>{loading ? "..." : totalProducts}</strong>
          <span>Products (live)</span>
        </div>
        <div className="kpi">
          <strong>{loading ? "..." : totalStock}</strong>
          <span>Total stock qty</span>
        </div>
      </div>

      <section className="card">
        <div className="cardHeader">
          <h2>POS Units</h2>
          <span>Sessions + products (live)</span>
        </div>

        {error && (
          <p style={{ marginBottom: 10, color: "#ff8b8b", fontSize: 12 }}>
            {error}
          </p>
        )}

        {loading ? (
          <p>Loading POS units...</p>
        ) : posList.length === 0 ? (
          <p style={{ margin: 0, color: "rgba(255,255,255,0.75)" }}>
            No POS units found. (Create POS from Swagger for now, or we can add a POS create form next.)
          </p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {posList.map((pos) => {
              const status = getStatus(pos.id);
              const isOpen = status === "OPEN";
              const products = productsByPos[pos.id] || [];
              const isBusy = !!actionLoading[pos.id];

              return (
                <div
                  key={pos.id}
                  className="card"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <div className="cardHeader">
                    <h2>{pos.name}</h2>
                    <span>Stock ID: {pos.stock_id}</span>
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
                        onClick={() => handleOpenSession(pos.id)}
                        disabled={isBusy || isOpen}
                        type="button"
                      >
                        {isBusy ? "Please wait..." : "Open Session"}
                      </button>
                      <button
                        className="btn btnDanger"
                        onClick={() => handleCloseSession(pos.id)}
                        disabled={isBusy || !isOpen}
                        type="button"
                      >
                        {isBusy ? "Please wait..." : "Close Session"}
                      </button>
                    </div>
                  </div>

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
                        {products.length === 0 ? (
                          <tr>
                            <td colSpan={4}>No products for stock #{pos.stock_id}</td>
                          </tr>
                        ) : (
                          products.map((p) => (
                            <tr key={p.id}>
                              <td>#{p.id}</td>
                              <td>{p.name}</td>
                              <td>${Number(p.price).toFixed(2)}</td>
                              <td>{p.quantity}</td>
                            </tr>
                          ))
                        )}
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
                    Products loaded from backend using this POS stock_id
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}