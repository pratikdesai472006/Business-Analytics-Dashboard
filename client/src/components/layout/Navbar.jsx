import { Bell, Menu, Moon, Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
const titles = {
  "/dashboard": "Dashboard",
  "/upload": "Upload data",
  "/reports": "Reports",
  "/forecast": "Forecast",
  "/profile": "Profile",
};
function Navbar({ onMenu }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const path = useLocation().pathname;
  const now = new Date();
  return (
    <header className="sticky top-0 z-20 h-[76px] px-4 md:px-8 flex items-center justify-between bg-[#f8fafc]/85 backdrop-blur border-b border-slate-200/70">
      <div className="flex items-center gap-3">
        <button
          className="icon-button md:hidden"
          onClick={onMenu}
          aria-label="Open menu"
        >
          <Menu size={19} />
        </button>
        <div>
          <p className="text-[11px] font-semibold text-slate-400">
            {now.toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </p>
          <h1 className="text-lg font-bold tracking-tight">
            {titles[path] || "Analytics"}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <label className="desktop-only relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            className="w-56 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
            placeholder="Search reports…"
          />
        </label>
        <button className="icon-button desktop-only" aria-label="Toggle theme">
          <Moon size={17} />
        </button>
        <button className="icon-button relative" aria-label="Notifications">
          <Bell size={17} />
          <i className="absolute top-2.5 right-2.5 block w-1.5 h-1.5 rounded-full bg-blue-600" />
        </button>
        <button
          onClick={() => nav("/profile")}
          className="ml-1 w-9 h-9 rounded-full bg-blue-600 text-white text-xs font-bold"
        >
          {(user?.fullName || "U")
            .split(" ")
            .map((x) => x[0])
            .join("")
            .slice(0, 2)}
        </button>
      </div>
    </header>
  );
}
export default Navbar;
