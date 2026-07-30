import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function DashboardLayout({ children }) {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="app-shell">
      <Sidebar open={open} close={() => setOpen(false)} />
      <div className="main-content">
        <Navbar onMenu={() => setOpen(true)} />
        <main className="page-content">{children}</main>
        <div className="fixed bottom-4 right-4 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur">
          {now.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
