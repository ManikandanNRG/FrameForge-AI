"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Film, Settings, FolderOpen, LogOut } from "lucide-react";

const navItems = [
  { href: "/projects", label: "Projects",  icon: FolderOpen },
  { href: "/settings", label: "Settings",  icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-56 flex-shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-2 px-4 py-5 border-b border-zinc-800">
          <Film className="h-5 w-5 text-amber-400" />
          <span className="text-sm font-bold tracking-tight">FrameForge AI</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                path.startsWith(href)
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-zinc-800 px-3 py-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-zinc-950">
        {children}
      </main>
    </div>
  );
}
