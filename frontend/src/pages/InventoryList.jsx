import { useEffect, useMemo, useState } from "react";
import { getInventories, createInventory } from "../api/inventories";

export default function InventoryList() {
  const [inventories, setInventories] = useState([]);
  const [name, setName] = useState("");
  const [userId, setUserId] = useState(1); // MVP default owner

  async function loadInventories() {
    try {
      const data = await getInventories();
      setInventories(data);
    } catch (err) {
      console.error("Failed to load inventories:", err);
    }
  }

  useEffect(() => {
    loadInventories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      id: Date.now(),          // simple unique id for in-memory MVP
      name: name.trim(),
      user_id: Number(userId), // required by schema
    };

    try {
      await createInventory(payload);
      setName("");
      await loadInventories();
    } catch (err) {
      console.error("Failed to create inventory:", err);
      alert("Create failed. Check console (likely missing fields / CORS).");
    }
  };

  const total = inventories.length;
  const newest = useMemo(() => inventories[inventories.length - 1], [inventories]);

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
          <strong>Connected</strong>
          <span>FastAPI (in-memory)</span>
        </div>
      </div>

      <div className="grid2">
        <section className="card">
          <div className="cardHeader">
            <h2>Inventory List</h2>
            <span>Backend data</span>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 120 }}>ID</th>
                <th>Name</th>
                <th style={{ width: 140 }}>Owner</th>
                <th style={{ width: 160 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {inventories.map((inv) => (
                <tr key={inv.id}>
                  <td>#{inv.id}</td>
                  <td>{inv.name}</td>
                  <td>{inv.user_id}</td>
                  <td>
                    <span className="badge">
                      <span className="dot dotGreen" />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
              {inventories.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ opacity: 0.7 }}>
                    No inventories yet.
                  </td>
                </tr>
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

              <input
                className="input"
                placeholder="User ID (owner)"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />

              <button className="btn btnPrimary" type="submit">
                Create
              </button>

              <p style={{ margin: 0, color: "rgba(255,255,255,0.65)", fontSize: 12 }}>
                Requires: id, name, user_id (in-memory backend)
              </p>
            </div>
          </form>
        </aside>
      </div>
    </>
  );
}
