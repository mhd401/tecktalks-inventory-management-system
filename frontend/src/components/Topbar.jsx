import { useLocation } from "react-router-dom";

function getTitle(pathname) {
  if (pathname.startsWith("/inventories")) return "Inventories";
  if (pathname.startsWith("/stocks")) return "Stocks";
  if (pathname.startsWith("/products")) return "Products";
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
        <p>Live data UI • backend connected</p>
      </div>

      <div className="pillRow">
        <div className="pill">Route: {pathname}</div>
        <div className="pill">Environment: Local</div>
      </div>
    </div>
  );
}