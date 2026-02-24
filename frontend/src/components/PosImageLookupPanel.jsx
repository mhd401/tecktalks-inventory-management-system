import { useMemo, useState } from "react";
import { productApi } from "../api/productApi";

function inferNameFromFilename(fileName = "") {
  return fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function PosImageLookupPanel({
  pos,
  products,
  isOpen,
  onAdjustQuantity,
  onRefresh,
}) {
  const [file, setFile] = useState(null);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);

  const [lookupResult, setLookupResult] = useState(null); 
  // shape:
  // { found: true, product }
  // { found: false, detected_name, suggested_price, suggested_sku }

  const [draft, setDraft] = useState({
    name: "",
    sku: "",
    price: "",
    quantity: "1",
  });

  const [msg, setMsg] = useState({ type: "", text: "" });

  const selectedFileName = useMemo(() => file?.name || "", [file]);

  const runFallbackLookup = () => {
    const inferredName = inferNameFromFilename(file?.name || "");
    const key = inferredName.toLowerCase();

    const found = (products || []).find((p) => {
      const n = String(p.name || "").toLowerCase();
      const sku = String(p.sku || "").toLowerCase();
      if (!key) return false;
      return n.includes(key) || key.includes(n) || (sku && key.includes(sku));
    });

    if (found) {
      return { found: true, product: found, _mock: true };
    }

    const suggestedPrice = "0.00";
    return {
      found: false,
      detected_name: inferredName || "New Product",
      suggested_price: suggestedPrice,
      suggested_sku: "",
      _mock: true,
    };
  };

  const handleLookup = async () => {
    if (!file) {
      setMsg({ type: "error", text: "Please choose an image first." });
      return;
    }

    setLoadingLookup(true);
    setMsg({ type: "", text: "" });
    setLookupResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("stock_id", String(pos.stock_id));

      // Expected backend response:
      // { found: true, product: {...} }
      // or { found: false, detected_name, suggested_price, suggested_sku }
      const res = await productApi.identifyByImage(formData);

      if (res?.found) {
        setLookupResult({ found: true, product: res.product });
        setMsg({ type: "success", text: "Product identified successfully." });
      } else {
        const detectedName = res?.detected_name || inferNameFromFilename(file.name) || "New Product";
        const suggestedPrice = res?.suggested_price ?? "0.00";
        const suggestedSku = res?.suggested_sku ?? "";

        setDraft({
          name: detectedName,
          sku: suggestedSku,
          price: String(suggestedPrice),
          quantity: "1",
        });

        setLookupResult({
          found: false,
          detected_name: detectedName,
          suggested_price: suggestedPrice,
          suggested_sku: suggestedSku,
        });

        setMsg({ type: "error", text: "Product not found. You can create it below." });
      }
    } catch (err) {
      // Fallback when backend endpoint isn't implemented yet
      const fallback = runFallbackLookup();

      if (fallback.found) {
        setLookupResult(fallback);
        setMsg({
          type: "success",
          text: "Backend image endpoint not ready yet — using filename fallback (demo mode). Product matched.",
        });
      } else {
        setDraft({
          name: fallback.detected_name || "New Product",
          sku: fallback.suggested_sku || "",
          price: String(fallback.suggested_price ?? "0.00"),
          quantity: "1",
        });

        setLookupResult(fallback);
        setMsg({
          type: "error",
          text: "Backend image endpoint not ready yet — using filename fallback (demo mode). Product not found.",
        });
      }
    } finally {
      setLoadingLookup(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!isOpen) {
      setMsg({ type: "error", text: "Open a POS session first before creating a product." });
      return;
    }

    const name = draft.name.trim();
    const sku = draft.sku.trim();
    const priceNum = Number(draft.price);
    const qtyNum = Number(draft.quantity);

    if (!name) {
      setMsg({ type: "error", text: "Product name is required." });
      return;
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setMsg({ type: "error", text: "Price must be a valid non-negative number." });
      return;
    }
    if (!Number.isInteger(qtyNum) || qtyNum <= 0) {
      setMsg({ type: "error", text: "Quantity must be a positive integer." });
      return;
    }

    setCreatingProduct(true);
    setMsg({ type: "", text: "" });

    try {
      const created = await productApi.create({
        stock_id: Number(pos.stock_id),
        name,
        sku: sku || null,
        price: priceNum,
        quantity: qtyNum,
      });

      await onRefresh?.();

      setLookupResult({ found: true, product: created || { name, quantity: qtyNum } });
      setMsg({ type: "success", text: "Product created successfully. You can now update quantity." });
    } catch (err) {
      setMsg({ type: "error", text: err?.message || "Failed to create product." });
    } finally {
      setCreatingProduct(false);
    }
  };

  return (
    <div
      className="card"
      style={{
        marginBottom: 10,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="cardHeader">
        <h2 style={{ fontSize: 16 }}>Image Product Lookup</h2>
        <span>{isOpen ? "Session OPEN" : "Open session required for qty/create"}</span>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <input
          className="input"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        {selectedFileName ? (
          <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>
            Selected: {selectedFileName}
          </p>
        ) : null}

        <button
          className="btn"
          type="button"
          onClick={handleLookup}
          disabled={loadingLookup || !file}
        >
          {loadingLookup ? "Searching..." : "Search by Image"}
        </button>

        {msg.text ? (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: msg.type === "error" ? "#ff8b8b" : "#8bffb0",
            }}
          >
            {msg.text}
          </p>
        ) : null}

        {lookupResult?.found ? (
          <div
            style={{
              padding: 10,
              borderRadius: 10,
              border: "1px solid rgba(139,255,176,0.25)",
              background: "rgba(139,255,176,0.06)",
              display: "grid",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 13 }}>
              <b>Found:</b> {lookupResult.product?.name || "Product"}
              {lookupResult.product?.id ? ` (ID #${lookupResult.product.id})` : ""}
            </div>

            <div style={{ fontSize: 12, opacity: 0.9 }}>
              Qty: {lookupResult.product?.quantity ?? "-"} • Price:{" "}
              {lookupResult.product?.price != null
                ? `$${Number(lookupResult.product.price).toFixed(2)}`
                : "-"}
            </div>

            <div className="btnRow">
              <button
                className="btn"
                type="button"
                onClick={() => onAdjustQuantity?.(lookupResult.product, -1)}
                disabled={!isOpen || Number(lookupResult.product?.quantity || 0) <= 0}
                title={!isOpen ? "Open session first" : "Decrease quantity"}
              >
                -1
              </button>

              <button
                className="btn btnPrimary"
                type="button"
                onClick={() => onAdjustQuantity?.(lookupResult.product, +1)}
                disabled={!isOpen}
                title={!isOpen ? "Open session first" : "Increase quantity"}
              >
                +1
              </button>
            </div>
          </div>
        ) : null}

        {lookupResult && !lookupResult.found ? (
          <div
            style={{
              display: "grid",
              gap: 8,
              padding: 10,
              borderRadius: 10,
              border: "1px solid rgba(255,207,102,0.25)",
              background: "rgba(255,207,102,0.05)",
            }}
          >
            <div style={{ fontSize: 12, color: "#ffcf66" }}>
              Product not found — create a new one (suggested values pre-filled).
            </div>

            <input
              className="input"
              placeholder="Product name"
              value={draft.name}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
            />
            <input
              className="input"
              placeholder="SKU (optional)"
              value={draft.sku}
              onChange={(e) => setDraft((p) => ({ ...p, sku: e.target.value }))}
            />
            <input
              className="input"
              type="number"
              step="0.01"
              placeholder="Suggested price"
              value={draft.price}
              onChange={(e) => setDraft((p) => ({ ...p, price: e.target.value }))}
            />
            <input
              className="input"
              type="number"
              placeholder="Initial quantity"
              value={draft.quantity}
              onChange={(e) => setDraft((p) => ({ ...p, quantity: e.target.value }))}
            />

            <button
              className="btn btnPrimary"
              type="button"
              onClick={handleCreateProduct}
              disabled={creatingProduct || !isOpen}
              title={!isOpen ? "Open session first" : "Create product"}
            >
              {creatingProduct ? "Creating..." : "Create Product"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}