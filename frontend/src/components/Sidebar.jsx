import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const itemClass = ({ isActive }) =>
    isActive ? "navItem navItemActive" : "navItem";

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brandLogo">TT</div>
        <div className="brandTitle">
          <strong>TechTalks IMS</strong>
          <span>Frontend MVP (mock)</span>
        </div>
      </div>

      <nav className="nav">
        <NavLink to="/inventories" className={itemClass}>
          <span className="navIcon">📦</span>
          Inventories
        </NavLink>

        <NavLink to="/pos" className={itemClass}>
          <span className="navIcon">🧾</span>
          POS
        </NavLink>
      </nav>

      <div style={{ marginTop: 18 }} className="card">
        <div className="cardHeader">
          <h2>Status</h2>
          <span>Mock only</span>
        </div>
        <div className="badge">
          <span className="dot dotGreen" />
          UI ready for backend later
        </div>
      </div>
    </aside>
  );
}
