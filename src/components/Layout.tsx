import { ReactNode, useState } from "react";
import { Link, useLocation, NavLink } from "react-router-dom";
import { 
  Home, BookOpen, Play, Trophy, Settings, FileText, 
  Menu, X, Sun, Moon, Monitor, ChevronLeft, ChevronRight,
  Keyboard, BarChart2, HelpCircle
} from "lucide-react";
import { cn } from "../utils/cn";
import type { ExamPaper } from "../types";

interface LayoutProps {
  children: ReactNode;
  papers: ExamPaper[];
  theme: "light" | "dark" | "system";
  toggleTheme: () => void;
}

export function Layout({ children, papers, theme, toggleTheme }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/practice", label: "Practice", icon: Play },
    { path: "/typography", label: "Typography", icon: FileText },
    { path: "/papers", label: "Papers", icon: BookOpen },
    { path: "/results", label: "Results", icon: Trophy },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static z-50 flex h-full w-64 flex-col border-r bg-card transition-transform duration-200",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex h-16 items-center justify-between border-b px-4 lg:justify-start">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary">
            <Keyboard className="h-6 w-6" />
            <span>Examoffice</span>
          </Link>
          <button
            className="lg:hidden p-2 rounded-md hover:bg-accent"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-2" role="navigation" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-4">
          <div className="text-xs text-muted-foreground">
            <p>Version 0.1.0</p>
            <p className="mt-1">Free & Open Source</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 rounded-md hover:bg-accent"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Breadcrumb */}
            <nav className="hidden md:flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
              {location.pathname.split("/").filter(Boolean).map((segment, index, array) => (
                <span key={segment} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight className="h-3 w-3" />}
                  <span className="capitalize">{segment.replace(/-/g, " ")}</span>
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              aria-label={`Current theme: ${theme}. Click to change.`}
            >
              {theme === "dark" ? (
                <Moon className="h-5 w-5" />
              ) : theme === "light" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Monitor className="h-5 w-5" />
              )}
            </button>

            {/* Quick stats */}
            <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
              <span>Free forever</span>
              <span>•</span>
              <span>No tracking</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}