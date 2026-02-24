import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function getTitle(pathname) {
  if (pathname.startsWith("/inventories")) return "Inventories";
  if (pathname.startsWith("/stocks")) return "Stocks";
  if (pathname.startsWith("/products")) return "Products";
  if (pathname.startsWith("/pos")) return "POS";
  return "Dashboard";
}

export default function Topbar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const title = getTitle(pathname);

  return (
    <div className="topbar">
      <div className="topbarTitle">
        <h1>{title}</h1>
        <p>Live data UI • backend connected</p>
      </div>

      <div className="pillRow" style={{ alignItems: "center" }}>
        <div className="pill">Route: {pathname}</div>
        <div className="pill">Environment: Local</div>
        {user ? (
          <div className="pill">
            {user.email} ({user.role})
          </div>
        ) : null}
        <button className="btn" type="button" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}