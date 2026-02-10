import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout() {
  return (
    <div className="appShell">
      <Sidebar />
      <main className="main">
        <Topbar />
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
