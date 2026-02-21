import React from "react";

export default function EditModal({
  open,
  title = "Edit",
  fields = [],
  form = {},
  setForm,
  onClose,
  onSave,
  saving = false,
}) {
  if (!open) return null;

  const handleChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <div className="cardHeader">
          <h2>{title}</h2>
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>

        <form onSubmit={onSave}>
          <div style={{ display: "grid", gap: 10 }}>
            {fields.map((field) => {
              if (field.type === "select") {
                return (
                  <select
                    key={field.name}
                    className="input"
                    value={form[field.name] ?? ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    required={field.required}
                  >
                    <option value="">{field.placeholder || `Select ${field.label}`}</option>
                    {(field.options || []).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                );
              }

              return (
                <input
                  key={field.name}
                  className="input"
                  type={field.type || "text"}
                  step={field.step}
                  placeholder={field.placeholder || field.label}
                  value={form[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  required={field.required}
                />
              );
            })}

            <div className="btnRow">
              <button type="button" className="btn" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btnPrimary" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}