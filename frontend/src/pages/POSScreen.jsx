import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { posApi } from "../api/posApi";
import { getApiBaseUrl } from "../api/client";

function money(v) {
  const n = Number(v ?? 0);
  if (Number.isNaN(n)) return "0.00";
  return n.toFixed(2);
}

function sumLines(lines) {
  return lines.reduce((acc, l) => acc + Number(l.unitPrice) * Number(l.qty), 0);
}

function resolveAssetUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${getApiBaseUrl()}${url}`;
}

export default function POSScreen() {
  const { posId } = useParams();
  const navigate = useNavigate();

  const [pos, setPos] = useState(null);
  const [summary, setSummary] = useState(null);

  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [lines, setLines] = useState([]);
  const [selectedLineIdx, setSelectedLineIdx] = useState(-1);

  const [mode, setMode] = useState("QTY"); // QTY | PRICE
  const [pad, setPad] = useState("");

  const [menuOpen, setMenuOpen] = useState(false);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const [imgSearching, setImgSearching] = useState(false);
  const fileRef = useRef(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    price: "",
    cost: "",
    barcode: "",
    quantity: 0,
    imageFile: null,
  });

  const [cashModal, setCashModal] = useState(null); // {type: 'IN'|'OUT'}
  const [cashAmount, setCashAmount] = useState("");
  const [cashNote, setCashNote] = useState("");

  const [closeModal, setCloseModal] = useState(false);
  const [closingCash, setClosingCash] = useState("");

  const total = useMemo(() => sumLines(lines), [lines]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [posRes, sumRes] = await Promise.all([
          posApi.get(posId),
          posApi.drawerSummary(posId),
        ]);

        if (!mounted) return;
        setPos(posRes);
        setSummary(sumRes);

        // If session is not open -> must go to session-reference
       const statusRaw =
  sumRes?.status ??
  sumRes?.session_status ??
  sumRes?.session?.status ??
  "";

const status = String(statusRaw).toUpperCase();

if (status !== "OPEN") {
  navigate(`/pos/${posId}/session-reference`, { replace: true });
  return;
}

        await loadProducts("");
      } catch (e) {
        if (!mounted) return;
        setErr(e.message || "Failed to load POS.");
      }
    })();

    return () => (mounted = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posId]);

  async function refreshSummary() {
    const s = await posApi.drawerSummary(posId);
    setSummary(s);
    return s;
  }

  async function loadProducts(q) {
    setLoadingProducts(true);
    try {
      const list = await posApi.listProducts(posId, q);
      setProducts(list || []);
    } finally {
      setLoadingProducts(false);
    }
  }

  function addProduct(p) {
    setErr("");
    setPad("");
    setMode("QTY");
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.product.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        setSelectedLineIdx(idx);
        return next;
      }
      const next = [...prev, { product: p, qty: 1, unitPrice: Number(p.price ?? 0) }];
      setSelectedLineIdx(next.length - 1);
      return next;
    });
  }

  function setSelectedValue(value) {
    if (selectedLineIdx < 0) return;
    const n = Number(value);
    if (!Number.isFinite(n)) return;

    setLines((prev) => {
      const next = [...prev];
      const cur = next[selectedLineIdx];
      if (!cur) return prev;

      if (mode === "QTY") {
        const q = Math.max(1, Math.trunc(n));
        next[selectedLineIdx] = { ...cur, qty: q };
      } else {
        next[selectedLineIdx] = { ...cur, unitPrice: Math.max(0, n) };
      }
      return next;
    });
  }

  function padPress(ch) {
    setPad((p) => {
      if (ch === "C") return "";
      if (ch === "⌫") return p.slice(0, -1);
      if (ch === "." && p.includes(".")) return p;
      return (p + ch).slice(0, 10);
    });
  }

  useEffect(() => {
    if (pad === "") return;
    setSelectedValue(pad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pad]);

  async function search() {
    setErr("");
    try {
      await loadProducts(query);
    } catch (e) {
      setErr(e.message || "Search failed");
    }
  }

  async function doImageSearch(file) {
    setErr("");
    setImgSearching(true);
    try {
      const res = await posApi.searchByImage(posId, file);
      if (res?.found && res?.product?.id) {
        const existing = products.find((p) => p.id === res.product.id);
        const p =
          existing || {
            id: res.product.id,
            name: res.product.name,
            price: res.product.price ?? 0,
            quantity: res.product.quantity ?? 0,
            image_url: res.product.image_url ?? null,
          };
        addProduct(p);
      } else {
        setErr("No match found. You can create a new product from the menu.");
      }
    } catch (e) {
      setErr(e.message || "Image search failed");
    } finally {
      setImgSearching(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function pay() {
    if (!lines.length) return;
    setBusy(true);
    setErr("");
    try {
      const payloadLines = lines.map((l) => ({
        product_id: l.product.id,
        quantity: l.qty,
        unit_price: Number(l.unitPrice),
      }));
      await posApi.payOrder(posId, payloadLines);
      setLines([]);
      setSelectedLineIdx(-1);
      await refreshSummary();
      await loadProducts(query); // refresh qty after sale
    } catch (e) {
      setErr(e.message || "Payment failed");
    } finally {
      setBusy(false);
    }
  }

  async function createProduct() {
    setBusy(true);
    setErr("");
    try {
      const created = await posApi.createProduct(posId, {
        name: createForm.name,
        sku: createForm.barcode || null,
        price: Number(createForm.price || 0),
        cost: createForm.cost === "" ? null : Number(createForm.cost || 0),
        quantity: Number(createForm.quantity || 0),
        imageFile: createForm.imageFile,
      });

      setCreateOpen(false);
      setCreateForm({ name: "", price: "", cost: "", barcode: "", quantity: 0, imageFile: null });

      await loadProducts(query);
      addProduct(created);
    } catch (e) {
      setErr(e.message || "Create product failed");
    } finally {
      setBusy(false);
    }
  }

  async function cashMove(type) {
    setBusy(true);
    setErr("");
    try {
      await posApi.cashMove(posId, type, Number(cashAmount), cashNote || null);
      setCashModal(null);
      setCashAmount("");
      setCashNote("");
      await refreshSummary();
    } catch (e) {
      setErr(e.message || "Cash movement failed");
    } finally {
      setBusy(false);
    }
  }

  async function closeSession() {
    setBusy(true);
    setErr("");
    try {
      await posApi.closeSessionWithCash(posId, Number(closingCash || 0));
      setCloseModal(false);
      setClosingCash("");
      navigate("/pos", { replace: true });
    } catch (e) {
      setErr(e.message || "Close session failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="posShell">
      {/* TOP BAR */}
      <div className="posTopBar">
        <div className="posBrand">
          <span className="posBadge">POS</span>
          <span className="posTitle">{pos?.name || `POS #${posId}`}</span>
          <span className="posMeta">
            Session: <b>{summary?.session_id ?? "-"}</b> • Opening: <b>${money(summary?.opening_cash)}</b>
          </span>
        </div>

        <div className="posSearch">
          <input
            className="posSearchInput"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            onKeyDown={(e) => (e.key === "Enter" ? search() : null)}
          />

          <button className="posIconBtn" onClick={search} disabled={loadingProducts}>
            {loadingProducts ? "..." : "Search"}
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) doImageSearch(f);
            }}
          />
          <button className="posIconBtn" onClick={() => fileRef.current?.click()} disabled={imgSearching}>
            {imgSearching ? "..." : "Upload"}
          </button>

          <button className="posIconBtn" onClick={() => setMenuOpen((v) => !v)}>
            Menu
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="posBody">
        {/* LEFT SIDE */}
        <div className="posLeft">
          <div className="posOrderPanel">
            <div className="posOrderHeader">
              <div className="posTotal">Total: ${money(total)}</div>
              <button className="posPayBtn" disabled={busy || !lines.length} onClick={pay}>
                {busy ? "Processing..." : "Payment"}
              </button>
            </div>

            <div className="posLines">
              {lines.length ? (
                lines.map((l, idx) => (
                  <div
                    key={l.product.id}
                    className={"posLine " + (idx === selectedLineIdx ? "active" : "")}
                    onClick={() => setSelectedLineIdx(idx)}
                  >
                    <div className="posLineName">{l.product.name}</div>
                    <div className="posLineMeta">
                      <span>Qty: {l.qty}</span>
                      <span>@ ${money(l.unitPrice)}</span>
                      <b>${money(Number(l.unitPrice) * Number(l.qty))}</b>
                    </div>
                  </div>
                ))
              ) : (
                <div className="posEmpty">No items yet. Tap products on the right.</div>
              )}
            </div>

            {err ? <div className="posError">{err}</div> : null}
          </div>

          <div className="posPad">
            <div className="posPadMode">
              <button className={"posModeBtn " + (mode === "QTY" ? "active" : "")} onClick={() => setMode("QTY")}>
                Qty
              </button>
              <button className={"posModeBtn " + (mode === "PRICE" ? "active" : "")} onClick={() => setMode("PRICE")}>
                Price
              </button>
              <div className="posPadDisplay">{pad || "—"}</div>
            </div>

            <div className="posPadGrid">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map((k) => (
                <button key={k} className="posPadBtn" onClick={() => padPress(k)}>
                  {k}
                </button>
              ))}
              <button className="posPadBtn wide" onClick={() => padPress("C")}>
                Clear
              </button>
            </div>

            {/* Theoretical cash should be visible always */}
            <div className="posDrawerSummary">
              <div>
                Theoretical cash: <b>${money(summary?.theoretical_cash)}</b>
              </div>
              <div style={{ opacity: 0.85 }}>
                Sales: ${money(summary?.sales_total)} • In: ${money(summary?.cash_in_total)} • Out: ${money(summary?.cash_out_total)}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="posRight">
          <div className="posGrid">
            {products.map((p) => (
              <button key={p.id} className="posCard" onClick={() => addProduct(p)}>
                <div className="posCardImg">
                  {p.image_url ? <img src={resolveAssetUrl(p.image_url)} alt={p.name} loading="lazy" /> : null}
                </div>
                <div className="posCardName">{p.name}</div>
                <div className="posCardPrice">${money(p.price)}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden menu */}
      {menuOpen ? (
        <div className="posMenu">
          <button className="posMenuItem" onClick={() => { setCreateOpen(true); setMenuOpen(false); }}>
            Create product
          </button>
          <button className="posMenuItem" onClick={() => { setCashModal({ type: "IN" }); setMenuOpen(false); }}>
            Cash in
          </button>
          <button className="posMenuItem" onClick={() => { setCashModal({ type: "OUT" }); setMenuOpen(false); }}>
            Cash out
          </button>
          <button
            className="posMenuItem"
            onClick={async () => {
              await refreshSummary();
              setCloseModal(true);
              setMenuOpen(false);
            }}
          >
            Close session
          </button>

          <Link className="posMenuItem linkLike" to="/">
            Return to backend
          </Link>
        </div>
      ) : null}

      {/* Create product modal */}
      {createOpen ? (
        <div className="posModalBackdrop" onClick={() => setCreateOpen(false)}>
          <div className="posModal" onClick={(e) => e.stopPropagation()}>
            <h3>Create product</h3>

            <div className="posForm">
              <label>
                <span>Name</span>
                <input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
              </label>

              <label>
                <span>Price</span>
                <input inputMode="decimal" value={createForm.price} onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })} />
              </label>

              <label>
                <span>Cost (optional)</span>
                <input inputMode="decimal" value={createForm.cost} onChange={(e) => setCreateForm({ ...createForm, cost: e.target.value })} />
              </label>

              <label>
                <span>Barcode / SKU</span>
                <input value={createForm.barcode} onChange={(e) => setCreateForm({ ...createForm, barcode: e.target.value })} />
              </label>

              <label>
                <span>Quantity (default 0)</span>
                <input
                  inputMode="numeric"
                  value={createForm.quantity}
                  onChange={(e) => setCreateForm({ ...createForm, quantity: Number(e.target.value || 0) })}
                />
              </label>

              <label style={{ gridColumn: "span 2" }}>
                <span>Image (optional)</span>
                <input type="file" accept="image/*" onChange={(e) => setCreateForm({ ...createForm, imageFile: e.target.files?.[0] || null })} />
              </label>
            </div>

            <div className="posModalActions">
              <button className="posIconBtn" onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button className="posPayBtn" disabled={busy || !createForm.name.trim()} onClick={createProduct}>
                {busy ? "..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Cash in/out modal */}
      {cashModal ? (
        <div className="posModalBackdrop" onClick={() => setCashModal(null)}>
          <div className="posModal" onClick={(e) => e.stopPropagation()}>
            <h3>{cashModal.type === "IN" ? "Cash In" : "Cash Out"}</h3>

            <div className="posForm">
              <label>
                <span>Amount</span>
                <input inputMode="decimal" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} />
              </label>

              <label>
                <span>Note (optional)</span>
                <input value={cashNote} onChange={(e) => setCashNote(e.target.value)} />
              </label>
            </div>

            <div className="posModalActions">
              <button className="posIconBtn" onClick={() => setCashModal(null)}>
                Cancel
              </button>
              <button className="posPayBtn" disabled={busy || !cashAmount} onClick={() => cashMove(cashModal.type)}>
                {busy ? "..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Close session modal */}
      {closeModal ? (
        <div className="posModalBackdrop" onClick={() => setCloseModal(false)}>
          <div className="posModal" onClick={(e) => e.stopPropagation()}>
            <h3>Close session</h3>

            <div className="posCloseSummary">
              <div>
                Theoretical cash: <b>${money(summary?.theoretical_cash)}</b>
              </div>
              <div style={{ opacity: 0.85 }}>
                Opening ${money(summary?.opening_cash)} + Sales ${money(summary?.sales_total)} + In ${money(summary?.cash_in_total)} - Out ${money(summary?.cash_out_total)}
              </div>

              {closingCash !== "" ? (
                <div style={{ marginTop: 6 }}>
                  Difference (counted - theoretical):{" "}
                  <b>${money(Number(closingCash || 0) - Number(summary?.theoretical_cash || 0))}</b>
                </div>
              ) : null}
            </div>

            <div className="posForm">
              <label>
                <span>Count drawer cash</span>
                <input inputMode="decimal" value={closingCash} onChange={(e) => setClosingCash(e.target.value)} />
              </label>
            </div>

            <div className="posModalActions">
              <button className="posIconBtn" onClick={() => setCloseModal(false)}>
                Cancel
              </button>
              <button className="posPayBtn" disabled={busy || !closingCash} onClick={closeSession}>
                {busy ? "..." : "Close"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}