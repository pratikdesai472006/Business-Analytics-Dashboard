import { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
function DashboardLayout({ children }) { const [open, setOpen] = useState(false); return <div className="app-shell"><Sidebar open={open} close={() => setOpen(false)} /><div className="main-content"><Navbar onMenu={() => setOpen(true)} /><main className="page-content">{children}</main></div></div>; }
export default DashboardLayout;
