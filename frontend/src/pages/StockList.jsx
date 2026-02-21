import { useEffect, useMemo, useState } from "react";
import { inventoryApi } from "../api/inventoryApi";
import { stockApi } from "../api/stockApi";

export default function StockList() {
  const [inventories, setInventories] = useState([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [stocks, setStocks] = useState([]);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadInventories = async () => {
    const data = await inventoryApi.list();
    const safe = Array.isArray(data) ? data : [];
    setInventories(safe);
    if (!selectedInventoryId && safe.length > 0) {
      setSelectedInventoryId(String(safe[0].id));
    }
    return safe;
  };

  const loadStocks = async (inventoryId) => {
    if (!inventoryId) {
      setStocks([]);
      return;
    }
    const data = await stockApi.listByInventory(inventoryId);
    setStocks(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const invs = await loadInventories();
        if (invs.length > 0) {
          await loadStocks(invs[0].id);
        } else {
          setStocks([]);
        }
      } catch (err) {
        setError(err.message || "Failed to load stock page");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedInventoryId) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        await loadStocks(selectedInventoryId);
      } catch (err) {
        setError(err.message || "Failed to load stocks");
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedInventoryId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!selectedInventoryId) {
      setError("Please select an inventory");
      return;
    }
    if (!name.trim()) {
      setError("Stock name cannot be empty");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await stockApi.create({
        inventory_id: Number(selectedInventoryId),
        name: name.trim(),
        location: location.trim() || null,
      });
      setName("");
      setLocation("");
      await loadStocks(selectedInventoryId);
    } catch (err) {
      setError(err.message || "Failed to create stock");
    } finally {
      setSubmitting(false);
    }
  };

  const total = stocks.length;
  const newest = useMemo(() => stocks[stocks.length - 1], [stocks]);

  return (
    <>
      <div className="kpiRow">
        <div className="kpi">
          <strong>{loading ? "..." : total}</strong>
          <span>Stocks in selected inventory</span>
        </div>
        <div className="kpi">
          <strong>{newest?.id ?? "-"}</strong>
          <span>Last stock ID</span>
        </div>
        <div className="kpi">
          <strong>{selectedInventoryId || "-"}</strong>
          <span>Selected inventory ID</span>
        </div>
      </div>

      <div className="grid2">
        <section className="card">
          <div className="cardHeader">
            <h2>Stock List</h2>
            <span>MySQL / FastAPI</span>
          </div>

          <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
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
          </div>

          {error && <p style={{ color: "#ff8b8b", fontSize: 12 }}>{error}</p>}

          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 100 }}>ID</th>
                <th>Name</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3}>Loading...</td></tr>
              ) : stocks.length === 0 ? (
                <tr><td colSpan={3}>No stocks found.</td></tr>
              ) : (
                stocks.map((s) => (
                  <tr key={s.id}>
                    <td>#{s.id}</td>
                    <td>{s.name}</td>
                    <td>{s.location || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <aside className="card">
          <div className="cardHeader">
            <h2>Create Stock</h2>
            <span>FastAPI POST</span>
          </div>

          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gap: 10 }}>
              <input
                className="input"
                placeholder="Stock name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="input"
                placeholder="Location (optional)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <button className="btn btnPrimary" type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Stock"}
              </button>
            </div>
          </form>
        </aside>
      </div>
    </>
  );
}