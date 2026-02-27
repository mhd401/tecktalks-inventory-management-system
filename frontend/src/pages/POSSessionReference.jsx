import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { posApi } from "../api/posApi";

function money(v) {
  const n = Number(v ?? 0);
  if (Number.isNaN(n)) return "0.00";
  return n.toFixed(2);
}

export default function POSSessionReference() {
  const { posId } = useParams();
  const navigate = useNavigate();

  const [expected, setExpected] = useState(null);
  const [openingCash, setOpeningCash] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const didInit = useRef(false);
  

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    let mounted = true;
    (async () => {
      try {
        const [exp, summary] = await Promise.all([
          posApi.expectedOpeningCash(posId),
          posApi.drawerSummary(posId).catch(() => null),
        ]);
        if (!mounted) return;
        setExpected(exp?.expected_opening_cash ?? 0);
        // if already open, jump to POS screen
        const isOpen =
          summary &&
          (
            summary.status === "OPEN" ||
            summary.session_status === "OPEN" ||
            summary.is_open === true
          );
        
        if (isOpen) {
          navigate(`/pos/${posId}`, { replace: true });
          return;
        }
        setOpeningCash(String(exp?.expected_opening_cash ?? "0.00"));
      } catch (e) {
        if (!mounted) return;
        setErr(e?.response?.data?.detail || e.message || "Failed to load opening cash reference.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [posId, navigate]);

  const canSubmit = useMemo(() => {
    const n = Number(openingCash);
    return Number.isFinite(n) && n >= 0 && !loading;
  }, [openingCash, loading]);

  async function onConfirm() {
    setErr("");
    setLoading(true);
    try {
      const res = await posApi.openSessionWithCash(posId, Number(openingCash));
      // go to POS screen
      navigate(`/pos/${posId}`, { replace: true, state: { sessionId: res?.id } });
    } catch (e) {
      setErr(e?.response?.data?.detail || e.message || "Failed to open session.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ maxWidth: 720 }}>
      <div className="cardHeader">
        <h2>Open POS Session</h2>
        <span>Cash drawer reference</span>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ color: "rgba(255,255,255,0.8)" }}>
          Expected opening cash (from last closing):{" "}
          <b>${money(expected)}</b>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ color: "rgba(255,255,255,0.8)" }}>Count cash in drawer</span>
          <input
            value={openingCash}
            onChange={(e) => setOpeningCash(e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
            className="input"
          />
        </label>

        {err ? (
          <div className="errorBox">{err}</div>
        ) : null}

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="button" disabled={!canSubmit} onClick={onConfirm}>
            {loading ? "Opening..." : "Open Session"}
          </button>
          <Link to="/pos" className="link">
            Back to POS list
          </Link>
        </div>

        <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.4 }}>
          This step matches real POS workflow: the cashier must count the drawer before
          starting the day. We store this as <b>opening_cash</b> in the session.
        </div>
      </div>
    </div>
  );
}
