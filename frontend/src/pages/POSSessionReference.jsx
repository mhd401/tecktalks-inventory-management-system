import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { posApi } from "../api/posApi";

function money(v) {
  const n = Number(v ?? 0);
  if (Number.isNaN(n)) return "0.00";
  return n.toFixed(2);
}

function isSessionOpenFromSummary(summary) {
  if (!summary) return false;

  const statusRaw =
    summary?.status ??
    summary?.session_status ??
    summary?.session?.status ??
    summary?.session?.state ??
    summary?.state ??
    "";

  const status = String(statusRaw).toUpperCase();
  return status === "OPEN" || summary?.is_open === true;
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

        const expectedCash = exp?.expected_opening_cash ?? 0;
        setExpected(expectedCash);

        // ✅ If already open, go directly to POS screen
        const isOpen = isSessionOpenFromSummary(summary);
        if (isOpen) {
          navigate(`/pos/${posId}`, { replace: true });
          return;
        }

        setOpeningCash(String(expectedCash));
      } catch (e) {
        if (!mounted) return;
        setErr(e.message || "Failed to load opening cash reference.");
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

  const diff = useMemo(() => {
    const entered = Number(openingCash);
    const exp = Number(expected ?? 0);
    if (!Number.isFinite(entered) || !Number.isFinite(exp)) return null;
    return entered - exp;
  }, [openingCash, expected]);

  async function onConfirm() {
    setErr("");
    setLoading(true);
    try {
      await posApi.openSessionWithCash(posId, Number(openingCash));
      navigate(`/pos/${posId}`, { replace: true });
    } catch (e) {
      setErr(e.message || "Failed to open session.");
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
          Expected opening cash (from last closing): <b>${money(expected)}</b>
        </div>

        {diff != null && Math.abs(diff) > 0.009 ? (
          <div style={{ color: "rgba(255,207,102,0.95)", fontSize: 13 }}>
            Difference (counted - expected): <b>${money(diff)}</b>
          </div>
        ) : null}

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ color: "rgba(255,255,255,0.8)" }}>
            Count cash in drawer
          </span>
          <input
            value={openingCash}
            onChange={(e) => setOpeningCash(e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
            className="input"
          />
        </label>

        {err ? <div className="errorBox">{err}</div> : null}

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="button" disabled={!canSubmit} onClick={onConfirm}>
            {loading ? "Opening..." : "Open Session"}
          </button>
          <Link to="/pos" className="link">
            Back to POS list
          </Link>
        </div>

        <div
          style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          This step matches real POS workflow: the cashier must count the drawer
          before starting the day. We store this as <b>opening_cash</b> in the
          session.
        </div>
      </div>
    </div>
  );
}