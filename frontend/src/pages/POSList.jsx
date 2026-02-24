import { useEffect, useMemo, useState } from "react";
import { inventoryApi } from "../api/inventoryApi";
import { stockApi } from "../api/stockApi";
import { posApi } from "../api/posApi";
import { productApi } from "../api/productApi";
import DarkPicker from "../components/DarkPicker";
import EditModal from "../components/EditModal";
import { useAuth } from "../context/AuthContext";

import PosImageLookupPanel from "../components/PosImageLookupPanel";
export default function POSList() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

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
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [productActionLoading, setProductActionLoading] = useState({});

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPos, setEditingPos] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", stock_id: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  const setBusy = (posId, value) => {
    setActionLoading((prev) => ({ ...prev, [posId]: value }));
  };

  const setProductBusy = (key, value) => {
    setProductActionLoading((prev) => ({ ...prev, [key]: value }));
  };

  const loadInventoryAndStocks = async () => {
    const invs = await inventoryApi.list();
    const safeInvs = Array.isArray(invs) ? invs : [];
    setInventories(safeInvs);

    if (safeInvs.length === 0) {
      setStocks([]);
      setSelectedInventoryId("");
      setSelectedStockId("");
      return;
    }

    const invId = String(safeInvs[0].id);
    setSelectedInventoryId(invId);

    const st = await stockApi.listByInventory(Number(invId));
    const safeStocks = Array.isArray(st) ? st : [];
    setStocks(safeStocks);

    setSelectedStockId(safeStocks.length > 0 ? String(safeStocks[0].id) : "");
  };

  const loadPOSData = async () => {
    const posUnits = await posApi.list();
    const safePOS = Array.isArray(posUnits) ? posUnits : [];
    setPosList(safePOS);

    const results = await Promise.all(
      safePOS.map(async (pos) => {
        const sessions = await (posApi.listSessions
          ? posApi.listSessions(pos.id).catch(() => [])
          : Promise.resolve([]));

        let sessionsFinal = Array.isArray(sessions) ? sessions : [];
        if (sessionsFinal.length === 0 && posApi.getSession) {
          try {
            const s = await posApi.getSession(pos.id);
            if (s) sessionsFinal = [s];
          } catch {
            // ignore
          }
        }

        const products = await productApi.listByStock(pos.stock_id).catch(() => []);
        return {
          posId: pos.id,
          sessions: sessionsFinal,
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
    setSuccess("");
    try {
      await loadInventoryAndStocks();
      await loadPOSData();
    } catch (err) {
      setError(err?.message || "Failed to load POS page");
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
        const st = await stockApi.listByInventory(Number(selectedInventoryId));
        const safeStocks = Array.isArray(st) ? st : [];
        setStocks(safeStocks);
        setSelectedStockId(safeStocks.length > 0 ? String(safeStocks[0].id) : "");
      } catch (err) {
        setError(err?.message || "Failed to load stocks");
      }
    })();
  }, [selectedInventoryId]);

  const getStatus = (posId) => {
    const sessions = sessionsByPos[posId] || [];
    return sessions.length > 0 ? sessions[0].status : "CLOSED";
  };

  const refreshPosCardData = async (pos) => {
    const sessions = await (posApi.listSessions
      ? posApi.listSessions(pos.id).catch(() => [])
      : Promise.resolve([]));

    let sessionsFinal = Array.isArray(sessions) ? sessions : [];
    if (sessionsFinal.length === 0 && posApi.getSession) {
      try {
        const s = await posApi.getSession(pos.id);
        if (s) sessionsFinal = [s];
      } catch {
        // ignore
      }
    }

    const products = await productApi.listByStock(pos.stock_id).catch(() => []);

    setSessionsByPos((prev) => ({
      ...prev,
      [pos.id]: sessionsFinal,
    }));

    setProductsByPos((prev) => ({
      ...prev,
      [pos.id]: Array.isArray(products) ? products : [],
    }));
  };

  const handleCreatePOS = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      setError("Only admins can create POS terminals.");
      return;
    }

    if (!selectedStockId) return setError("Please select a stock");
    if (!posName.trim()) return setError("POS name is required");

    setSubmittingPOS(true);
    setError("");
    setSuccess("");

    try {
      await posApi.create({
        stock_id: Number(selectedStockId),
        name: posName.trim(),
      });
      setPosName("");
      await loadPOSData();
      setSuccess("POS terminal created successfully");
    } catch (err) {
      setError(err?.message || "Failed to create POS");
    } finally {
      setSubmittingPOS(false);
    }
  };

  const handleOpenSession = async (posId) => {
    setBusy(posId, true);
    setError("");
    setSuccess("");

    try {
      await posApi.openSession(posId);
      const pos = posList.find((p) => p.id === posId);
      if (pos) await refreshPosCardData(pos);
      setSuccess("POS session opened successfully");
    } catch (err) {
      setError(err?.message || "Failed to open session");
    } finally {
      setBusy(posId, false);
    }
  };

  const handleCloseSession = async (posId) => {
    setBusy(posId, true);
    setError("");
    setSuccess("");

    try {
      await posApi.closeSession(posId);
      const pos = posList.find((p) => p.id === posId);
      if (pos) await refreshPosCardData(pos);
      setSuccess("POS session closed successfully");
    } catch (err) {
      setError(err?.message || "Failed to close session");
    } finally {
      setBusy(posId, false);
    }
  };

  const handleAdjustQuantity = async (pos, product, delta) => {
    if (!productApi.adjustQuantity) {
      setError("Adjust quantity endpoint not available yet");
      return;
    }

    const key = `${pos.id}:${product.id}:${delta > 0 ? "inc" : "dec"}`;
    setProductBusy(key, true);
    setError("");
    setSuccess("");

    try {
      await productApi.adjustQuantity(product.id, {
        delta,
        reason: delta > 0 ? "POS restock" : "POS sale",
        pos_id: pos.id,
      });
      await refreshPosCardData(pos);
      setSuccess(
        `${product.name}: quantity ${delta > 0 ? "increased" : "decreased"} successfully`
      );
    } catch (err) {
      setError(err?.message || "Failed to adjust quantity");
    } finally {
      setProductBusy(key, false);
    }
  };

  const handleEditPOS = (pos) => {
    if (!isAdmin) {
      setError("Only admins can edit POS terminals.");
      return;
    }

    setEditingPos(pos);
    setEditForm({
      name: pos.name || "",
      stock_id: String(pos.stock_id ?? ""),
    });
    setIsEditOpen(true);
    setError("");
    setSuccess("");
  };

  const handleSaveEditPOS = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      setError("Only admins can edit POS terminals.");
      return;
    }

    if (!editingPos) return;

    const trimmedName = (editForm.name || "").trim();
    const stockIdNum = Number(editForm.stock_id);

    if (!trimmedName) return setError("POS name is required");
    if (!Number.isInteger(stockIdNum) || stockIdNum <= 0) {
      return setError("Stock ID must be a valid positive integer");
    }

    setBusy(editingPos.id, true);
    setSavingEdit(true);
    setError("");
    setSuccess("");

    try {
      await posApi.update(editingPos.id, {
        name: trimmedName,
        stock_id: stockIdNum,
      });

      setIsEditOpen(false);
      setEditingPos(null);

      await loadPOSData();
      setSuccess("POS updated successfully");
    } catch (err) {
      setError(err?.message || "Failed to update POS");
    } finally {
      setBusy(editingPos.id, false);
      setSavingEdit(false);
    }
  };

  const handleDeletePOS = async (pos) => {
    if (!isAdmin) {
      setError("Only admins can delete POS terminals.");
      return;
    }

    const ok = window.confirm(`Delete POS "${pos.name}"?`);
    if (!ok) return;

    setBusy(pos.id, true);
    setError("");
    setSuccess("");

    try {
      await posApi.remove(pos.id);
      await loadPOSData();
      setSuccess("POS deleted successfully");
    } catch (err) {
      setError(err?.message || "Failed to delete POS");
    } finally {
      setBusy(pos.id, false);
    }
  };

  const totalProducts = useMemo(
    () =>
      Object.values(productsByPos).reduce(
        (sum, arr) => sum + (arr?.length || 0),
        0
      ),
    [productsByPos]
  );

  const totalStock = useMemo(
    () =>
      Object.values(productsByPos).reduce(
        (sum, arr) =>
          sum + (arr || []).reduce((s, p) => s + Number(p.quantity || 0), 0),
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
              <DarkPicker
                value={selectedInventoryId}
                onChange={(val) => setSelectedInventoryId(String(val))}
                placeholder="Select inventory"
                options={inventories.map((inv) => ({
                  value: String(inv.id),
                  label: `#${inv.id} - ${inv.name}`,
                }))}
                disabled={!isAdmin}
              />

              <DarkPicker
                value={selectedStockId}
                onChange={(val) => setSelectedStockId(String(val))}
                placeholder="Select stock"
                options={stocks.map((s) => ({
                  value: String(s.id),
                  label: `#${s.id} - ${s.name}`,
                }))}
                disabled={!isAdmin || !selectedInventoryId}
              />

              <input
                className="input"
                placeholder="POS name"
                value={posName}
                onChange={(e) => setPosName(e.target.value)}
                disabled={!isAdmin || submittingPOS}
              />

              <button
                className="btn btnPrimary"
                type="submit"
                disabled={!isAdmin || submittingPOS}
              >
                {submittingPOS ? "Creating..." : "Create POS"}
              </button>

              {!isAdmin ? (
                <p style={{ margin: 0, color: "#ffcf66", fontSize: 12 }}>
                  Cashier can operate sessions and quantity updates, but cannot create/edit/delete POS terminals.
                </p>
              ) : null}
            </div>
          </form>
        </aside>

        <aside className="card">
          <div className="cardHeader">
            <h2>Status</h2>
            <span>Live backend</span>
          </div>

          {error ? (
            <p style={{ color: "#ff8b8b", fontSize: 12, marginBottom: 8 }}>
              {error}
            </p>
          ) : null}

          {success ? (
            <p style={{ color: "#8bffb0", fontSize: 12, marginBottom: 8 }}>
              {success}
            </p>
          ) : null}

          <p style={{ margin: 0, color: "rgba(255,255,255,0.75)" }}>
            POS terminals, sessions, and product tables are live from FastAPI.
          </p>
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
          <p>No POS units found. Create a POS terminal first.</p>
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

                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                    <div className="btnRow">
                      <button
                        className="btn"
                        type="button"
                        onClick={() => handleEditPOS(pos)}
                        disabled={isBusy || !isAdmin}
                      >
                        Edit POS
                      </button>
                      <button
                        className="btn btnDanger"
                        type="button"
                        onClick={() => handleDeletePOS(pos)}
                        disabled={isBusy || !isAdmin}
                      >
                        Delete POS
                      </button>
                    </div>
                  </div>
                  <PosImageLookupPanel
  pos={pos}
  products={products}
  isOpen={isOpen}
  onRefresh={() => refreshPosCardData(pos)}
  onAdjustQuantity={(product, delta) => handleAdjustQuantity(pos, product, delta)}
/>

                  <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th style={{ width: 100 }}>ID</th>
                          <th>Product</th>
                          <th style={{ width: 120 }}>Stock Qty</th>
                          <th style={{ width: 180 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.length === 0 ? (
                          <tr>
                            <td colSpan={4}>No products for this stock yet.</td>
                          </tr>
                        ) : (
                          products.map((p) => (
                            <tr key={p.id}>
                              <td>#{p.id}</td>
                              <td>{p.name}</td>
                              <td>{p.quantity}</td>
                              <td>
                                <div className="btnRow">
                                  <button
                                    className="btn"
                                    type="button"
                                    onClick={() => handleAdjustQuantity(pos, p, -1)}
                                    disabled={
                                      !productApi.adjustQuantity ||
                                      !isOpen ||
                                      !!productActionLoading[`${pos.id}:${p.id}:dec`] ||
                                      Number(p.quantity) <= 0
                                    }
                                    title={!isOpen ? "Open session first" : "Decrease quantity"}
                                  >
                                    {productActionLoading[`${pos.id}:${p.id}:dec`] ? "..." : "-1"}
                                  </button>

                                  <button
                                    className="btn btnPrimary"
                                    type="button"
                                    onClick={() => handleAdjustQuantity(pos, p, +1)}
                                    disabled={
                                      !productApi.adjustQuantity ||
                                      !isOpen ||
                                      !!productActionLoading[`${pos.id}:${p.id}:inc`]
                                    }
                                    title={!isOpen ? "Open session first" : "Increase quantity"}
                                  >
                                    {productActionLoading[`${pos.id}:${p.id}:inc`] ? "..." : "+1"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    {!productApi.adjustQuantity ? (
                      <p style={{ margin: 10, opacity: 0.7, fontSize: 12 }}>
                        Quantity adjustment is not wired yet (endpoint missing).
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <EditModal
        open={isEditOpen}
        title="Edit POS"
        form={editForm}
        setForm={setEditForm}
        saving={savingEdit}
        onClose={() => {
          if (savingEdit) return;
          setIsEditOpen(false);
          setEditingPos(null);
        }}
        onSave={handleSaveEditPOS}
        fields={[
          { name: "name", label: "POS name", required: true },
          { name: "stock_id", label: "Stock ID", required: true },
        ]}
      />
    </div>
  );
}