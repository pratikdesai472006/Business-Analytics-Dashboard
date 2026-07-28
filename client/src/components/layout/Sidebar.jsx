import {
  BarChart3,
  Upload,
  FileText,
  TrendingUp,
  UserRound,
  LogOut,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
const items = [
  ["Dashboard", "/dashboard", BarChart3],
  ["Upload data", "/upload", Upload],
  ["Reports", "/reports", FileText],
  ["Forecast", "/forecast", TrendingUp],
  ["Profile", "/profile", UserRound],
];
const initials = (name = "User") =>
  name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
function Sidebar({ open, close }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const signOut = () => {
    logout();
    navigate("/login");
  };
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-9">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3"
            onClick={close}
          >
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-blue-600 text-white">
              <BarChart3 size={21} />
            </span>
            <span>
              <b className="block text-sm">Aperture</b>
              <small className="text-slate-500">Analytics</small>
            </span>
          </NavLink>
          <button
            className="icon-button md:hidden"
            onClick={close}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <p className="px-3 mb-3 text-[10px] tracking-[.16em] font-bold text-slate-400">
          WORKSPACE
        </p>
        {items.map(([name, path, Icon]) => (
          <NavLink key={path} to={path} onClick={close} className="nav-link">
            <Icon size={18} />
            {name}
          </NavLink>
        ))}
      </div>
      <div className="p-4 mt-auto border-t border-slate-100">
        <button
          onClick={() => navigate("/profile")}
          className="w-full flex items-center gap-3 rounded-xl p-2 text-left hover:bg-slate-50"
        >
          <span className="w-9 h-9 rounded-full grid place-items-center bg-slate-900 text-xs font-bold text-white">
            {initials(user?.fullName)}
          </span>
          <span className="min-w-0">
            <b className="block truncate text-xs">
              {user?.fullName || "Your workspace"}
            </b>
            <small className="block truncate text-slate-500">
              {user?.email || "Administrator"}
            </small>
          </span>
        </button>
        <button
          onClick={signOut}
          className="mt-3 w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-500 hover:text-red-600"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
export default Sidebar;
