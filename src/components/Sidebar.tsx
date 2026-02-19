/**
 * Sidebar Navigation — Climate Credit Risk Engine
 */
import { BarChart3, FileText, Home, MapPin, Settings, Shield, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "assessment", label: "Risk Assessment", icon: MapPin },
  { id: "portfolio", label: "Portfolio", icon: BarChart3 },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "trends", label: "Trends", icon: TrendingUp },
  { id: "officers", label: "Officers", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 h-screen flex flex-col" style={{ background: "hsl(var(--sidebar-background))" }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: "hsl(var(--sidebar-border))" }}>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--secondary))" }}>
          <Shield className="w-5 h-5" style={{ color: "hsl(var(--secondary-foreground))" }} />
        </div>
        <div>
          <div className="text-sm font-bold leading-tight" style={{ color: "hsl(var(--sidebar-foreground))" }}>
            Climate Credit
          </div>
          <div className="text-xs font-medium" style={{ color: "hsl(var(--sidebar-primary))" }}>
            Risk Engine
          </div>
        </div>
      </div>

      {/* Bank badge */}
      <div className="mx-4 mt-4 rounded-md px-3 py-2 text-xs font-medium" style={{ background: "hsl(var(--sidebar-accent))", color: "hsl(var(--sidebar-accent-foreground))" }}>
        Reserve Bank of India · RBI/2024-25/001
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150",
              activeTab === id ? "nav-active" : "hover:bg-sidebar-accent"
            )}
            style={{
              color: activeTab === id ? "hsl(var(--sidebar-primary))" : "hsl(var(--sidebar-foreground))",
              borderLeft: activeTab === id ? "3px solid hsl(var(--sidebar-primary))" : "3px solid transparent",
            }}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 border-t space-y-2" style={{ borderColor: "hsl(var(--sidebar-border))" }}>

        <div className="px-3 py-2 rounded-md" style={{ background: "hsl(var(--sidebar-accent))" }}>
          <div className="text-xs font-semibold" style={{ color: "hsl(var(--sidebar-foreground))" }}>
            Rajesh Kumar
          </div>
          <div className="text-xs" style={{ color: "hsl(var(--sidebar-primary))" }}>
            Senior Loan Officer · Delhi
          </div>
        </div>
      </div>
    </aside>
  );
}
