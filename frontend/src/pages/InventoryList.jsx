import { useMemo, useState } from "react";

export default function InventoryList() {
  const base = [
    { id: 1, name: "Main Inventory" },
    { id: 2, name: "Secondary Inventory" },
  ];

  const [inventories, setInventories] = useState(base);
  const [name, setName] = useState("");

  const total = inventories.length;

  const handleSubmit = (e) => {
    e.preventDefault();
    const newInventory = { id: inventories.length + 1, name };
    setInventories([...inventories, newInventory]);
    setName("");
  };

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
          <strong>Ready</strong>
          <span>Backend integration later</span>
        </div>
      </div>

      <div className="grid2">
        <section className="card">
          <div className="cardHeader">
            <h2>Inventory List</h2>
            <span>Mock JSON</span>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 120 }}>ID</th>
                <th>Name</th>
                <th style={{ width: 160 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {inventories.map((inv) => (
                <tr key={inv.id}>
                  <td>#{inv.id}</td>
                  <td>{inv.name}</td>
                  <td>
                    <span className="badge">
                      <span className="dot dotGreen" />
                      Active (mock)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <aside className="card">
          <div className="cardHeader">
            <h2>Create Inventory</h2>
            <span>Local state</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gap: 10 }}>
              <input
                className="input"
                placeholder="Inventory name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <button className="btn btnPrimary" type="submit">
                Create
              </button>

              <p style={{ margin: 0, color: "rgba(255,255,255,0.65)", fontSize: 12 }}>
                No validation • No API • No persistence
              </p>
            </div>
          </form>
        </aside>
      </div>
    </>
  );
}
