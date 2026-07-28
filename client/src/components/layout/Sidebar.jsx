import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  UploadCloud,
  FileBarChart,
  TrendingUp,
  UserRound,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  X,
} from "lucide-react";
import LogoutButton from "./LogoutButton";
import { cn } from "../common/cn";

const nav = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Upload", path: "/upload", icon: UploadCloud },
  { name: "Reports", path: "/reports", icon: FileBarChart },
  { name: "Forecast", path: "/forecast", icon: TrendingUp },
  { name: "Profile", path: "/profile", icon: UserRound },
];

function SidebarContent({ collapsed, onToggleCollapse, onNavigate, showClose, onMobileClose }) {
  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Brand */}
      <div className={cn("flex h-16 items-center gap-2.5 px-4", collapsed && "lg:justify-center lg:px-0")}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-soft">
          <Sparkles className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-foreground">Analytica</p>
            <p className="truncate text-[11px] text-subtle">Analytics Suite</p>
          </div>
        )}
        {showClose && (
          <button
            onClick={onMobileClose}
            className="ml-auto rounded-xl p-2 text-muted transition-colors hover:bg-elevated hover:text-foreground lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Primary">
        {!collapsed && (
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">Menu</p>
        )}
        {nav.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={onNavigate}
            title={collapsed ? item.name : undefined}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                collapsed && "lg:justify-center",
                isActive
                  ? "bg-primary-soft text-primary"
                  : "text-muted hover:bg-elevated hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 h-5 w-1 rounded-r-full bg-primary" aria-hidden="true" />
                )}
                <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                {!collapsed && <span>{item.name}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Upgrade card */}
      {!collapsed && (
        <div className="mx-3 mb-3 rounded-2xl border border-border bg-gradient-to-br from-primary-soft to-transparent p-4">
          <p className="text-sm font-semibold text-foreground">Pro insights</p>
          <p className="mt-1 text-xs text-muted">Unlock AI forecasting and unlimited exports.</p>
          <button className="mt-3 w-full rounded-lg bg-primary py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-hover">
            Upgrade plan
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-border p-3">
        <LogoutButton collapsed={collapsed} className="w-full" />
        <button
          onClick={onToggleCollapse}
          className={cn(
            "mt-1 hidden w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-subtle transition-colors hover:bg-elevated hover:text-foreground lg:flex",
            collapsed && "lg:justify-center"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-[18px] w-[18px]" />
          ) : (
            <>
              <PanelLeftClose className="h-[18px] w-[18px]" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }) {
  return (
    <>
      {/* Desktop: fixed */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-border transition-all duration-300 lg:block",
          collapsed ? "w-[76px]" : "w-64"
        )}
      >
        <SidebarContent collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
      </aside>

      {/* Mobile: drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          onClick={onMobileClose}
          className={cn(
            "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-64 border-r border-border shadow-lift transition-transform duration-300",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <SidebarContent
            collapsed={false}
            onToggleCollapse={onToggleCollapse}
            onNavigate={onMobileClose}
            showClose
            onMobileClose={onMobileClose}
          />
        </div>
      </div>
    </>
  );
}

export default Sidebar;
