import { useEffect, useMemo, useState } from "react";
import { inventoryApi } from "../api/inventoryApi";
import { stockApi } from "../api/stockApi";
import { productApi } from "../api/productApi";
import DarkPicker from "../components/DarkPicker";
import EditModal from "../components/EditModal";

export default function ProductList() {
  const [inventories, setInventories] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [products, setProducts] = useState([]);

  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [selectedStockId, setSelectedStockId] = useState("");

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reusable edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    sku: "",
    price: "",
    quantity: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const loadInventories = async () => {
    const data = await inventoryApi.list();
    const safe = Array.isArray(data) ? data : [];
    setInventories(safe);
    return safe;
  };

  const loadStocks = async (inventoryId) => {
    if (!inventoryId) {
      setStocks([]);
      setSelectedStockId("");
      return [];
    }
    const data = await stockApi.listByInventory(Number(inventoryId));
    const safe = Array.isArray(data) ? data : [];
    setStocks(safe);

    if (safe.length > 0) setSelectedStockId(String(safe[0].id));
    else setSelectedStockId("");

    return safe;
  };

  const loadProducts = async (stockId) => {
    if (!stockId) {
      setProducts([]);
      return;
    }
    const data = await productApi.listByStock(Number(stockId));
    setProducts(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const invs = await loadInventories();
        if (invs.length > 0) {
          setSelectedInventoryId(String(invs[0].id));

          const st = await stockApi.listByInventory(Number(invs[0].id));
          const safeStocks = Array.isArray(st) ? st : [];
          setStocks(safeStocks);

          if (safeStocks.length > 0) {
            setSelectedStockId(String(safeStocks[0].id));
            await loadProducts(safeStocks[0].id);
          } else {
            setProducts([]);
          }
        } else {
          setStocks([]);
          setProducts([]);
          setSelectedInventoryId("");
          setSelectedStockId("");
        }
      } catch (err) {
        setError(err.message || "Failed to load product page");
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
        const st = await stockApi.listByInventory(Number(selectedInventoryId));
        const safeStocks = Array.isArray(st) ? st : [];
        setStocks(safeStocks);

        if (safeStocks.length > 0) {
          const firstStockId = String(safeStocks[0].id);
          setSelectedStockId(firstStockId);
          await loadProducts(firstStockId);
        } else {
          setSelectedStockId("");
          setProducts([]);
        }
      } catch (err) {
        setError(err.message || "Failed to load stocks");
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedInventoryId]);

  useEffect(() => {
    if (!selectedStockId) return;

    (async () => {
      setLoading(true);
      setError("");
      try {
        await loadProducts(selectedStockId);
      } catch (err) {
        setError(err.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedStockId]);

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!selectedStockId) {
      setError("Please select a stock");
      return;
    }
    if (!name.trim()) {
      setError("Product name is required");
      return;
    }

    const priceNum = Number(price || 0);
    const qtyNum = Number(quantity || 0);

    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError("Price must be a valid non-negative number");
      return;
    }
    if (!Number.isInteger(qtyNum) || qtyNum < 0) {
      setError("Quantity must be a valid non-negative integer");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await productApi.create({
        stock_id: Number(selectedStockId),
        name: name.trim(),
        sku: sku.trim() || null,
        price: priceNum,
        quantity: qtyNum,
      });

      setName("");
      setSku("");
      setPrice("");
      setQuantity("");

      await loadProducts(selectedStockId);
    } catch (err) {
      setError(err.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  // Open modal instead of window.prompt
  const handleEdit = (p) => {
    setEditingProduct(p);
    setEditForm({
      name: p.name || "",
      sku: p.sku || "",
      price: String(p.price ?? 0),
      quantity: String(p.quantity ?? 0),
    });
    setIsEditOpen(true);
    setError("");
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    const trimmedName = (editForm.name || "").trim();
    const priceNum = Number(editForm.price);
    const qtyNum = Number(editForm.quantity);

    if (!trimmedName) {
      setError("Product name is required");
      return;
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError("Price must be a valid non-negative number");
      return;
    }
    if (!Number.isInteger(qtyNum) || qtyNum < 0) {
      setError("Quantity must be a valid non-negative integer");
      return;
    }

    try {
      setSavingEdit(true);
      setError("");

      await productApi.update(editingProduct.id, {
        name: trimmedName,
        sku: (editForm.sku || "").trim() || null,
        price: priceNum,
        quantity: qtyNum,
      });

      setIsEditOpen(false);
      setEditingProduct(null);

      await loadProducts(selectedStockId);
    } catch (err) {
      setError(err.message || "Failed to update product");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (p) => {
    const ok = window.confirm(`Delete product "${p.name}"?`);
    if (!ok) return;

    try {
      setError("");
      await productApi.remove(p.id);
      await loadProducts(selectedStockId);
    } catch (err) {
      setError(err.message || "Failed to delete product");
    }
  };

  const totalQty = useMemo(
    () => products.reduce((sum, p) => sum + Number(p.quantity || 0), 0),
    [products]
  );

  return (
    <>
      <div className="kpiRow">
        <div className="kpi">
          <strong>{loading ? "..." : products.length}</strong>
          <span>Products in selected stock</span>
        </div>
        <div className="kpi">
          <strong>{loading ? "..." : totalQty}</strong>
          <span>Total quantity</span>
        </div>
        <div className="kpi">
          <strong>{selectedStockId || "-"}</strong>
          <span>Selected stock ID</span>
        </div>
      </div>

      <div className="grid2">
        <section className="card">
          <div className="cardHeader">
            <h2>Products</h2>
            <span>MySQL / FastAPI</span>
          </div>

          <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
            <DarkPicker
              value={selectedInventoryId}
              onChange={(val) => setSelectedInventoryId(String(val))}
              placeholder="Select inventory"
              options={inventories.map((inv) => ({
                value: String(inv.id),
                label: `#${inv.id} - ${inv.name}`,
              }))}
            />

            <DarkPicker
              value={selectedStockId}
              onChange={(val) => setSelectedStockId(String(val))}
              placeholder="Select stock"
              options={stocks.map((s) => ({
                value: String(s.id),
                label: `#${s.id} - ${s.name}`,
              }))}
              disabled={!selectedInventoryId}
            />
          </div>

          {error && <p style={{ color: "#ff8b8b", fontSize: 12 }}>{error}</p>}

          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 90 }}>ID</th>
                <th>Name</th>
                <th style={{ width: 120 }}>SKU</th>
                <th style={{ width: 110 }}>Price</th>
                <th style={{ width: 120 }}>Qty</th>
                <th style={{ width: 220 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>Loading...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6}>No products found.</td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td>{p.name}</td>
                    <td>{p.sku || "-"}</td>
                    <td>${Number(p.price).toFixed(2)}</td>
                    <td>{p.quantity}</td>
                    <td>
                      <div className="btnRow">
                        <button
                          type="button"
                          className="btn"
                          onClick={() => handleEdit(p)}
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btnDanger"
                          onClick={() => handleDelete(p)}
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
            <h2>Create Product</h2>
            <span>FastAPI POST</span>
          </div>

          <form onSubmit={handleCreate}>
            <div style={{ display: "grid", gap: 10 }}>
              <input
                className="input"
                placeholder="Product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="input"
                placeholder="SKU (optional)"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
              <input
                className="input"
                type="number"
                step="0.01"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <input
                className="input"
                type="number"
                placeholder="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />

              <button className="btn btnPrimary" type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Product"}
              </button>
            </div>
          </form>
        </aside>
      </div>

      {/* Reusable Edit Modal */}
      <EditModal
        open={isEditOpen}
        title="Edit Product"
        form={editForm}
        setForm={setEditForm}
        saving={savingEdit}
        onClose={() => {
          if (savingEdit) return;
          setIsEditOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveEdit}
        fields={[
          { name: "name", label: "Product name", required: true },
          { name: "sku", label: "SKU (optional)" },
          { name: "price", label: "Price" },
          { name: "quantity", label: "Quantity" },
        ]}
      />
    </>
  );
}