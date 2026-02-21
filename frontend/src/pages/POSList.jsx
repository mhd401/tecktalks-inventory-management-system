import { useEffect, useMemo, useState } from "react";
import { inventoryApi } from "../api/inventoryApi";
import { stockApi } from "../api/stockApi";
import { posApi } from "../api/posApi";
import { productApi } from "../api/productApi";

export default function POSList() {
  const [inventories, setInventories] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [selectedStockId, setSelectedStockId] = useState("");
  const [posName, setPosName] = useState("");

  const [posList, setPosList] = useState([]);
  const [sessionsByPos, setSessionsByPos] = useState({});
  const [productsByPos, setProductsByPos] = useState({});
  const [loading, setLoading] = useState(true);
  const [submittingPOS, setSubmittingPOS] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState({});

  const loadInventoryAndStocks = async () => {
    const invs = await inventoryApi.list();
    const safeInvs = Array.isArray(invs) ? invs : [];
    setInventories(safeInvs);

    if (safeInvs.length > 0) {
      const invId = String(safeInvs[0].id);
      setSelectedInventoryId(invId);

      const st = await stockApi.listByInventory(invId);
      const safeStocks = Array.isArray(st) ? st : [];
      setStocks(safeStocks);

      if (safeStocks.length > 0) {
        setSelectedStockId(String(safeStocks[0].id));
      }
    }
  };

  const loadPOSData = async () => {
    const posUnits = await posApi.list();
    const safePOS = Array.isArray(posUnits) ? posUnits : [];
    setPosList(safePOS);

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
  };

  const fullReload = async () => {
    setLoading(true);
    setError("");
    try {
      await loadInventoryAndStocks();
      await loadPOSData();
    } catch (err) {
      setError(err.message || "Failed to load POS page");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fullReload();
  }, []);

  useEffect(() => {
    if (!selectedInventoryId) return;
    (async () => {
      try {
        const st = await stockApi.listByInventory(selectedInventoryId);
        const safeStocks = Array.isArray(st) ? st : [];
        setStocks(safeStocks);
        setSelectedStockId(safeStocks.length > 0 ? String(safeStocks[0].id) : "");
      } catch (err) {
        setError(err.message || "Failed to load stocks");
      }
    })();
  }, [selectedInventoryId]);

  const getStatus = (posId) => {
    const sessions = sessionsByPos[posId] || [];
    return sessions.length > 0 ? sessions[0].status : "CLOSED";
  };

  const handleCreatePOS = async (e) => {
    e.preventDefault();
    if (!selectedStockId) return setError("Please select a stock");
    if (!posName.trim()) return setError("POS name is required");

    setSubmittingPOS(true);
    setError("");
    try {
      await posApi.create({
        stock_id: Number(selectedStockId),
        name: posName.trim(),
      });
      setPosName("");
      await loadPOSData();
    } catch (err) {
      setError(err.message || "Failed to create POS");
    } finally {
      setSubmittingPOS(false);
    }
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

  const totalProducts = useMemo(
    () => Object.values(productsByPos).reduce((sum, arr) => sum + (arr?.length || 0), 0),
    [productsByPos]
  );

  const totalStock = useMemo(
    () =>
      Object.values(productsByPos).reduce(
        (sum, arr) => sum + (arr || []).reduce((s, p) => s + Number(p.quantity || 0), 0),
        0
      ),
    [productsByPos]
  );

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

      <div className="grid2" style={{ marginBottom: 12 }}>
        <aside className="card">
          <div className="cardHeader">
            <h2>Create POS Terminal</h2>
            <span>FastAPI POST</span>
          </div>

          <form onSubmit={handleCreatePOS}>
            <div style={{ display: "grid", gap: 10 }}>
              <select
                className="input"
                value={selectedInventoryId}
                onChange={(e) => setSelectedInventoryId(e.target.value)}
              >
                <option value="">Select inventory</option>
                {inventories.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    #{inv.id} - {inv.name}
                  </option>
                ))}
              </select>

              <select
                className="input"
                value={selectedStockId}
                onChange={(e) => setSelectedStockId(e.target.value)}
              >
                <option value="">Select stock</option>
                {stocks.map((s) => (
                  <option key={s.id} value={s.id}>
                    #{s.id} - {s.name}
                  </option>
                ))}
              </select>

              <input
                className="input"
                placeholder="POS name"
                value={posName}
                onChange={(e) => setPosName(e.target.value)}
              />

              <button className="btn btnPrimary" type="submit" disabled={submittingPOS}>
                {submittingPOS ? "Creating..." : "Create POS"}
              </button>
            </div>
          </form>
        </aside>

        <aside className="card">
          <div className="cardHeader">
            <h2>Status</h2>
            <span>Live backend</span>
          </div>
          {error ? (
            <p style={{ color: "#ff8b8b", fontSize: 12 }}>{error}</p>
          ) : (
            <p style={{ margin: 0, color: "rgba(255,255,255,0.75)" }}>
              POS terminals, sessions, and product tables are live from FastAPI + MySQL.
            </p>
          )}
        </aside>
      </div>

      <section className="card">
        <div className="cardHeader">
          <h2>POS Units</h2>
          <span>Sessions + products (live)</span>
        </div>

        {loading ? (
          <p>Loading POS units...</p>
        ) : posList.length === 0 ? (
          <p>No POS units found.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {posList.map((pos) => {
              const status = getStatus(pos.id);
              const isOpen = status === "OPEN";
              const products = productsByPos[pos.id] || [];
              const isBusy = !!actionLoading[pos.id];

              return (
                <div key={pos.id} className="card" style={{ background: "rgba(255,255,255,0.04)" }}>
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
                      Session: <b style={{ color: "rgba(255,255,255,0.92)" }}>{status}</b>
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
                          <tr><td colSpan={4}>No products for stock #{pos.stock_id}</td></tr>
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
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}