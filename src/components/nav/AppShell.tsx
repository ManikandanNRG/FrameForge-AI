"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  Film,
  Settings,
  FolderOpen,
  LogOut,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const navItems = [
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  // Restore sidebar state from localStorage on initial client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("frameforge_sidebar_collapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {
      // localStorage may fail in restricted browser privacy modes
    }
  }, []);

  function toggleCollapse() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("frameforge_sidebar_collapsed", String(next));
      } catch {
        // Ignore storage error
      }
      return next;
    });
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Clean White Slim Sidebar with Minimize / Expand toggle */}
      <aside
        className={clsx(
          "flex flex-shrink-0 flex-col border-r border-slate-200 bg-white shadow-xs transition-[width] duration-200 ease-in-out",
          collapsed ? "w-14" : "w-48"
        )}
      >
        {/* Header: Logo + Minimize/Expand Button */}
        <div
          className={clsx(
            "flex items-center border-b border-slate-100 py-3.5",
            collapsed ? "justify-center px-2" : "justify-between px-3.5"
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div
              className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-xs shrink-0 cursor-pointer"
              onClick={toggleCollapse}
              title={collapsed ? "Click to expand sidebar" : "FrameForge AI"}
            >
              <Film className="h-4 w-4" />
            </div>
            {!collapsed && (
              <span className="text-xs font-bold tracking-tight text-slate-900 truncate">
                FrameForge AI
              </span>
            )}
          </div>

          <button
            onClick={toggleCollapse}
            title={collapsed ? "Expand sidebar (Ctrl+B)" : "Minimize sidebar"}
            className={clsx(
              "rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition",
              collapsed && "hidden"
            )}
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className={clsx("flex-1 py-3 space-y-1", collapsed ? "px-1.5" : "px-2.5")}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={clsx(
                  "flex items-center rounded-xl text-xs font-semibold transition-all",
                  collapsed
                    ? "justify-center p-2.5"
                    : "gap-2.5 px-3 py-2",
                  isActive
                    ? "bg-slate-100 text-slate-900 shadow-xs border border-slate-200/60"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon
                  className={clsx(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-amber-600" : "text-slate-400"
                  )}
                />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer: Expand Toggle (when collapsed) & Sign Out */}
        <div className={clsx("border-t border-slate-100 py-3 space-y-1", collapsed ? "px-1.5" : "px-2.5")}>
          {/* Quick toggle at bottom */}
          <button
            onClick={toggleCollapse}
            title={collapsed ? "Expand sidebar" : "Minimize sidebar"}
            className={clsx(
              "flex w-full items-center rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition",
              collapsed ? "justify-center p-2" : "gap-2.5 px-3 py-1.5"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4 text-slate-500" />
            ) : (
              <>
                <ChevronLeft className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-500">Minimize Menu</span>
              </>
            )}
          </button>

          {/* Sign out */}
          <button
            onClick={logout}
            title="Sign out"
            className={clsx(
              "flex w-full items-center rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors",
              collapsed ? "justify-center p-2" : "gap-2.5 px-3 py-1.5"
            )}
          >
            <LogOut className="h-4 w-4 text-slate-400 shrink-0" />
            {!collapsed && <span className="truncate">Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-slate-50">
        {children}
      </main>
    </div>
  );
}
