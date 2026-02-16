import { useLocation } from "react-router-dom";

function getTitle(pathname) {
  if (pathname.startsWith("/inventories")) return "Inventories";
  if (pathname.startsWith("/pos")) return "POS";
  return "Dashboard";
}

export default function Topbar() {
  const { pathname } = useLocation();
  const title = getTitle(pathname);

  return (
    <div className="topbar">
      <div className="topbarTitle">
        <h1>{title}</h1>
        <p>Mock data UI • no backend calls</p>
      </div>

      <div className="pillRow">
        <div className="pill">Route: {pathname}</div>
        <div className="pill">Environment: Local</div>
      </div>
    </div>
  );
}
