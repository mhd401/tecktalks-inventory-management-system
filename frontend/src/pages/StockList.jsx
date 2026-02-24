import { useEffect, useMemo, useState } from "react";
import { inventoryApi } from "../api/inventoryApi";
import { stockApi } from "../api/stockApi";
import EditModal from "../components/EditModal";
import { useAuth } from "../context/AuthContext";

const ui = {
  pickerWrap: {
    display: "grid",
    gap: 8,
    marginBottom: 12,
    padding: 8,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.03)",
    maxHeight: 170,
    overflowY: "auto",
  },
  pickerItem: {
    width: "100%",
    textAlign: "left",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.92)",
    cursor: "pointer",
    fontSize: 14,
  },
  pickerItemActive: {
    background: "rgba(111, 76, 255, 0.22)",
    border: "1px solid rgba(111, 76, 255, 0.55)",
    color: "#fff",
    boxShadow: "0 0 0 2px rgba(111, 76, 255, 0.15) inset",
  },
  pickerLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 4,
  },
};

function InventoryPicker({ inventories, selectedInventoryId, onSelect }) {
  if (!inventories.length) {
    return (
      <div style={{ ...ui.pickerWrap, maxHeight: "none" }}>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
          No inventories available
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={ui.pickerLabel}>Select inventory</div>
      <div style={ui.pickerWrap}>
        {inventories.map((inv) => {
          const isActive = selectedInventoryId === String(inv.id);
          return (
            <button
              key={inv.id}
              type="button"
              onClick={() => onSelect(String(inv.id))}
              style={{
                ...ui.pickerItem,
                ...(isActive ? ui.pickerItemActive : {}),
              }}
            >
              #{inv.id} - {inv.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function StockList() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [inventories, setInventories] = useState([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [stocks, setStocks] = useState([]);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reusable modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    location: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

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
    const data = await stockApi.listByInventory(Number(inventoryId));
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

    if (!isAdmin) {
      setError("Only admins can create stocks.");
      return;
    }

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
        category: category.trim() || null,
        location: location.trim() || null,
      });

      setName("");
      setCategory("");
      setLocation("");

      await loadStocks(selectedInventoryId);
    } catch (err) {
      setError(err.message || "Failed to create stock");
    } finally {
      setSubmitting(false);
    }
  };

  // Open edit modal
  const handleEdit = (stock) => {
    if (!isAdmin) {
      setError("Only admins can edit stocks.");
      return;
    }

    setEditingStock(stock);
    setEditForm({
      name: stock.name || "",
      category: stock.category || "",
      location: stock.location || "",
    });
    setIsEditOpen(true);
    setError("");
  };

  // Save edit modal
  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      setError("Only admins can edit stocks.");
      return;
    }

    if (!editingStock) return;

    const trimmed = (editForm.name || "").trim();
    if (!trimmed) {
      setError("Stock name cannot be empty");
      return;
    }

    try {
      setSavingEdit(true);
      setError("");

      await stockApi.update(editingStock.id, {
        name: trimmed,
        category: (editForm.category || "").trim() || null,
        location: (editForm.location || "").trim() || null,
      });

      setIsEditOpen(false);
      setEditingStock(null);

      await loadStocks(selectedInventoryId);
    } catch (err) {
      setError(err.message || "Failed to update stock");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (stock) => {
    if (!isAdmin) {
      setError("Only admins can delete stocks.");
      return;
    }

    const ok = window.confirm(`Delete stock "${stock.name}"?`);
    if (!ok) return;

    try {
      setError("");
      await stockApi.remove(stock.id);
      await loadStocks(selectedInventoryId);
    } catch (err) {
      setError(err.message || "Failed to delete stock");
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

          <InventoryPicker
            inventories={inventories}
            selectedInventoryId={selectedInventoryId}
            onSelect={setSelectedInventoryId}
          />

          {!isAdmin && (
            <p style={{ marginTop: 0, color: "#ffcf66", fontSize: 12 }}>
              Cashier role is read-only for stock management actions.
            </p>
          )}

          {error && <p style={{ color: "#ff8b8b", fontSize: 12 }}>{error}</p>}

          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 90 }}>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Location</th>
                <th style={{ width: 220 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>Loading...</td>
                </tr>
              ) : stocks.length === 0 ? (
                <tr>
                  <td colSpan={5}>No stocks found.</td>
                </tr>
              ) : (
                stocks.map((s) => (
                  <tr key={s.id}>
                    <td>#{s.id}</td>
                    <td>{s.name}</td>
                    <td>{s.category || "-"}</td>
                    <td>{s.location || "-"}</td>
                    <td>
                      <div className="btnRow">
                        <button
                          type="button"
                          className="btn"
                          onClick={() => handleEdit(s)}
                          disabled={loading || !isAdmin}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btnDanger"
                          onClick={() => handleDelete(s)}
                          disabled={loading || !isAdmin}
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
                disabled={!isAdmin || submitting}
              />

              <input
                className="input"
                placeholder="Category (optional)"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={!isAdmin || submitting}
              />

              <input
                className="input"
                placeholder="Location (optional)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={!isAdmin || submitting}
              />

              <button
                className="btn btnPrimary"
                type="submit"
                disabled={!isAdmin || submitting}
              >
                {submitting ? "Creating..." : "Create Stock"}
              </button>

              {!isAdmin && (
                <p style={{ margin: 0, color: "#ffcf66", fontSize: 12 }}>
                  Cashier role cannot create stocks.
                </p>
              )}
            </div>
          </form>
        </aside>
      </div>

      {/* Reusable edit modal */}
      <EditModal
        open={isEditOpen}
        title="Edit Stock"
        form={editForm}
        setForm={setEditForm}
        saving={savingEdit}
        onClose={() => {
          if (savingEdit) return;
          setIsEditOpen(false);
          setEditingStock(null);
        }}
        onSave={handleSaveEdit}
        fields={[
          { name: "name", label: "Stock name", required: true },
          { name: "category", label: "Category (optional)" },
          { name: "location", label: "Location (optional)" },
        ]}
      />
    </>
  );
}