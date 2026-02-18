/**
 * Dashboard Stats Bar — top-level KPIs
 */
import { TrendingUp, AlertTriangle, CheckCircle, Activity } from "lucide-react";

const STATS = [
  { label: "Assessments Today", value: "24", sub: "+8 vs yesterday", icon: Activity, trend: "up" },
  { label: "High/Severe Cases", value: "7", sub: "29% of today's volume", icon: AlertTriangle, trend: "warn" },
  { label: "Low Risk Approved", value: "11", sub: "Standard terms", icon: CheckCircle, trend: "good" },
  { label: "Avg. Risk Score", value: "54.3", sub: "Portfolio composite", icon: TrendingUp, trend: "neutral" },
];

export function StatsBar() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {STATS.map((stat, i) => {
        const Icon = stat.icon;
        const iconColor =
          stat.trend === "up"      ? "hsl(var(--secondary))" :
          stat.trend === "warn"    ? "hsl(var(--risk-high))" :
          stat.trend === "good"    ? "hsl(var(--risk-low))" :
                                     "hsl(var(--muted-foreground))";
        return (
          <div key={i} className="rounded-xl border border-border bg-card shadow-sm p-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: `${iconColor}18` }}>
              <Icon className="w-5 h-5" style={{ color: iconColor }} />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono text-foreground">{stat.value}</div>
              <div className="text-xs font-semibold text-foreground/80 mt-0.5">{stat.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
