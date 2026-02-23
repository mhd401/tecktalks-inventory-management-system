import { useEffect, useMemo, useState } from "react";
import { inventoryApi } from "../api/inventoryApi";
import EditModal from "../components/EditModal";

export default function InventoryList() {
  const [inventories, setInventories] = useState([]);
  const [name, setName] = useState("");
  const [userId, setUserId] = useState(""); // optional (depends on backend)
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState(null);
  const [editForm, setEditForm] = useState({ name: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  const loadInventories = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await inventoryApi.list();
      setInventories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load inventories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventories();
  }, []);

  const total = inventories.length;
  const newest = useMemo(
    () => inventories[inventories.length - 1],
    [inventories]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Inventory name cannot be empty");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = { name: trimmedName };

      // send user_id only if provided (avoid breaking backend if it doesn't accept it)
      if (String(userId).trim() !== "") {
        payload.user_id = Number(userId);
      }

      await inventoryApi.create(payload);
      setName("");
      setUserId("");
      await loadInventories();
    } catch (err) {
      setError(err?.message || "Failed to create inventory");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleEdit = (inv) => {
    setEditingInventory(inv);
    setEditForm({ name: inv?.name || "" });
    setIsEditOpen(true);
    setError("");
  };

  // Save Edit Modal
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingInventory) return;

    const trimmed = (editForm.name || "").trim();
    if (!trimmed) {
      setError("Inventory name cannot be empty");
      return;
    }

    setSavingEdit(true);
    setError("");

    try {
      await inventoryApi.update(editingInventory.id, { name: trimmed });
      setIsEditOpen(false);
      setEditingInventory(null);
      await loadInventories();
    } catch (err) {
      setError(err?.message || "Failed to update inventory");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (inv) => {
    const ok = window.confirm(`Delete inventory "${inv.name}"?`);
    if (!ok) return;

    try {
      setError("");
      await inventoryApi.remove(inv.id);
      await loadInventories();
    } catch (err) {
      setError(err?.message || "Failed to delete inventory");
    }
  };

  return (
    <>
      <div className="kpiRow">
        <div className="kpi">
          <strong>{loading ? "..." : total}</strong>
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
            <span>DB / FastAPI</span>
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
                <th style={{ width: 140 }}>Owner</th>
                <th style={{ width: 160 }}>Status</th>
                <th style={{ width: 220 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>Loading...</td>
                </tr>
              ) : inventories.length === 0 ? (
                <tr>
                  <td colSpan={5}>No inventories yet.</td>
                </tr>
              ) : (
                inventories.map((inv) => (
                  <tr key={inv.id}>
                    <td>#{inv.id}</td>
                    <td>{inv.name}</td>
                    <td>{inv.user_id ?? "-"}</td>
                    <td>
                      <span className="badge">
                        <span className="dot dotGreen" />
                        Active
                      </span>
                    </td>
                    <td>
                      <div className="btnRow">
                        <button
                          type="button"
                          className="btn"
                          onClick={() => handleEdit(inv)}
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btnDanger"
                          onClick={() => handleDelete(inv)}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
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

              <input
                className="input"
                placeholder="User ID (optional)"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />

              <button
                className="btn btnPrimary"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create"}
              </button>

              <p style={{ margin: 0, color: "rgba(255,255,255,0.65)", fontSize: 12 }}>
                Data is saved in DB • Edit/Delete supported
              </p>
            </div>
          </form>
        </aside>
      </div>

      <EditModal
        open={isEditOpen}
        title="Edit Inventory"
        form={editForm}
        setForm={setEditForm}
        saving={savingEdit}
        onClose={() => {
          if (savingEdit) return;
          setIsEditOpen(false);
          setEditingInventory(null);
        }}
        onSave={handleSaveEdit}
        fields={[{ name: "name", label: "Inventory name", required: true }]}
      />
    </>
  );
}