import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  UserRound,
  LogOut,
} from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Avatar from "../common/Avatar";
import { cn } from "../common/cn";
import { relativeTime } from "../../services/format";

const greeting = (name) => {
  const h = new Date().getHours();
  const part = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return name ? `${part}, ${name.split(" ")[0]}` : part;
};

const notifications = [
  { id: 1, title: "Q2 report is ready to download", at: new Date(Date.now() - 9 * 60000).toISOString(), unread: true },
  { id: 2, title: "Forecast confidence improved to 92%", at: new Date(Date.now() - 3 * 3600000).toISOString(), unread: true },
  { id: 3, title: "New dataset processed: 4,204 rows", at: new Date(Date.now() - 26 * 3600000).toISOString(), unread: false },
];

function useClickOutside(onOutside) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onOutside]);
  return ref;
}

function Navbar({ onMenuClick }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [now, setNow] = useState(new Date());
  const [openMenu, setOpenMenu] = useState(null); // "bell" | "profile" | null

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  const menuRef = useClickOutside(() => setOpenMenu(null));
  const name = user?.fullName || "there";

  const handleLogout = async () => {
    setOpenMenu(null);
    const res = await Swal.fire({
      title: "Sign out?",
      text: "You'll need to sign back in to continue.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sign out",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
    });
    if (res.isConfirmed) {
      logout();
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        {/* Mobile menu */}
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 text-muted transition-colors hover:bg-elevated hover:text-foreground lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Greeting */}
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-sm font-semibold text-foreground">
            {greeting(user?.fullName)}
          </p>
          <p className="truncate text-xs text-subtle">
            {now.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}{" "}
            ·{" "}
            {now.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Search */}
        <div className="ml-auto hidden max-w-xs flex-1 md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-subtle" />
            <input
              type="search"
              placeholder="Search reports, metrics…"
              aria-label="Search"
              className="h-10 w-full rounded-xl border border-input bg-surface pl-11 pr-14 text-sm text-foreground placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
            />
            <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-elevated px-1.5 py-0.5 text-[10px] font-medium text-subtle lg:block">
              ⌘K
            </kbd>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1.5 md:ml-0" ref={menuRef}>
          {/* Theme switch */}
          <button
            onClick={toggleTheme}
            className="rounded-xl p-2.5 text-muted transition-colors hover:bg-elevated hover:text-foreground"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === "bell" ? null : "bell")}
              className="relative rounded-xl p-2.5 text-muted transition-colors hover:bg-elevated hover:text-foreground"
              aria-label="Notifications"
              aria-expanded={openMenu === "bell"}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-background" />
            </button>

            {openMenu === "bell" && (
              <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-border bg-elevated p-2 shadow-lift animate-scale-in">
                <div className="flex items-center justify-between px-3 py-2">
                  <p className="text-sm font-semibold text-foreground">Notifications</p>
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                    2 new
                  </span>
                </div>
                <ul className="max-h-80 overflow-y-auto">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <button className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface">
                        <span
                          className={cn(
                            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                            n.unread ? "bg-primary" : "bg-border-strong"
                          )}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm text-foreground">{n.title}</span>
                          <span className="text-xs text-subtle">{relativeTime(n.at)}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === "profile" ? null : "profile")}
              className="flex items-center gap-2.5 rounded-xl p-1 pr-2 transition-colors hover:bg-elevated"
              aria-label="Account menu"
              aria-expanded={openMenu === "profile"}
            >
              <Avatar name={user?.fullName || "User"} size="sm" />
              <span className="hidden text-left sm:block">
                <span className="block max-w-[120px] truncate text-sm font-semibold leading-tight text-foreground">
                  {user?.fullName || "User"}
                </span>
                <span className="block max-w-[120px] truncate text-xs text-subtle">
                  {user?.email || "Signed in"}
                </span>
              </span>
            </button>

            {openMenu === "profile" && (
              <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-border bg-elevated p-2 shadow-lift animate-scale-in">
                <div className="flex items-center gap-3 rounded-xl px-3 py-3">
                  <Avatar name={user?.fullName || "User"} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {user?.fullName || "User"}
                    </p>
                    <p className="truncate text-xs text-subtle">{user?.email}</p>
                  </div>
                </div>
                <div className="my-1 h-px bg-border" />
                <button
                  onClick={() => {
                    setOpenMenu(null);
                    navigate("/profile");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
                >
                  <UserRound className="h-[18px] w-[18px]" />
                  My profile
                </button>
                <button
                  onClick={() => {
                    setOpenMenu(null);
                    navigate("/profile");
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-foreground"
                >
                  <Settings className="h-[18px] w-[18px]" />
                  Settings
                </button>
                <div className="my-1 h-px bg-border" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
