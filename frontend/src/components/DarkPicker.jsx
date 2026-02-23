import { useEffect, useMemo, useRef, useState } from "react";

export default function DarkPicker({
  value,
  onChange,
  options = [],
  placeholder = "Select",
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = useMemo(() => {
    const found = options.find((opt) => String(opt.value) === String(value));
    return found?.label || placeholder;
  }, [options, value, placeholder]);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        style={{
          width: "100%",
          minHeight: 48,
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.03)",
          color: "rgba(255,255,255,0.92)",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: 14,
        }}
      >
        <span style={{ textAlign: "left" }}>{selectedLabel}</span>
        <span style={{ opacity: 0.8 }}>{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            zIndex: 50,
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            maxHeight: 220,
            overflowY: "auto",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(15, 18, 32, 0.98)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            padding: 6,
          }}
        >
          {options.length === 0 ? (
            <div
              style={{
                padding: "10px 12px",
                color: "rgba(255,255,255,0.6)",
                fontSize: 13,
              }}
            >
              No options available
            </div>
          ) : (
            options.map((opt) => {
              const isActive = String(opt.value) === String(value);
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => {
                    onChange(String(opt.value));
                    setOpen(false);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 12px",
                    marginBottom: 4,
                    cursor: "pointer",
                    background: isActive
                      ? "rgba(108, 92, 231, 0.28)"
                      : "transparent",
                    color: "rgba(255,255,255,0.95)",
                    fontSize: 14,
                  }}
                >
                  {opt.label}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}