import { useEffect, useMemo, useState } from "react";
import { inventoryApi } from "../api/inventoryApi";

export default function InventoryList() {
  const [inventories, setInventories] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadInventories = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await inventoryApi.list();
      setInventories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load inventories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventories();
  }, []);

  const total = inventories.length;
  const newest = useMemo(() => inventories[inventories.length - 1], [inventories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Inventory name cannot be empty");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await inventoryApi.create({ name: trimmed });
      setName("");
      await loadInventories();
    } catch (err) {
      setError(err.message || "Failed to create inventory");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="kpiRow">
        <div className="kpi">
          <strong>{total}</strong>
          <span>Total inventories</span>
        </div>
        <div className="kpi">
          <strong>{newest?.id ?? "-"}</strong>
          <span>Last created ID</span>
        </div>
        <div className="kpi">
          <strong>{loading ? "..." : "Live"}</strong>
          <span>Backend connected</span>
        </div>
      </div>

      <div className="grid2">
        <section className="card">
          <div className="cardHeader">
            <h2>Inventory List</h2>
            <span>MySQL / FastAPI</span>
          </div>

          {error && (
            <p style={{ marginBottom: 10, color: "#ff8b8b", fontSize: 12 }}>
              {error}
            </p>
          )}

          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 120 }}>ID</th>
                <th>Name</th>
                <th style={{ width: 160 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3}>Loading...</td>
                </tr>
              ) : inventories.length === 0 ? (
                <tr>
                  <td colSpan={3}>No inventories yet.</td>
                </tr>
              ) : (
                inventories.map((inv) => (
                  <tr key={inv.id}>
                    <td>#{inv.id}</td>
                    <td>{inv.name}</td>
                    <td>
                      <span className="badge">
                        <span className="dot dotGreen" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <aside className="card">
          <div className="cardHeader">
            <h2>Create Inventory</h2>
            <span>FastAPI POST</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gap: 10 }}>
              <input
                className="input"
                placeholder="Inventory name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <button className="btn btnPrimary" type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create"}
              </button>

              <p style={{ margin: 0, color: "rgba(255,255,255,0.65)", fontSize: 12 }}>
                Data is now saved in MySQL
              </p>
            </div>
          </form>
        </aside>
      </div>
    </>
  );
}