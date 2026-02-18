/**
 * Lending Adjustment Panel
 * Displays recommended lending adjustments based on climate risk assessment
 */
import { LendingAdjustment } from "@/types/climate";
import { AlertTriangle, BadgePercent, ShieldCheck, FileWarning, Landmark, Search } from "lucide-react";

interface LendingPanelProps {
  adjustments: LendingAdjustment[];
  loanAmount?: number;
  baseLine?: number; // base interest rate in %
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string }> = {
  interest_rate:          { icon: BadgePercent,  label: "Interest Rate" },
  insurance:              { icon: ShieldCheck,   label: "Insurance" },
  risk_warning:           { icon: FileWarning,   label: "Risk Note" },
  loan_cap:               { icon: Landmark,      label: "LTV Cap" },
  enhanced_due_diligence: { icon: Search,        label: "Due Diligence" },
};

const SEVERITY_STYLE: Record<string, React.CSSProperties> = {
  info:     { background: "hsl(210 80% 55% / 0.08)", borderColor: "hsl(210 80% 55% / 0.3)", color: "hsl(210 80% 40%)" },
  warning:  { background: "hsl(var(--risk-moderate-bg))", borderColor: "hsl(var(--risk-moderate) / 0.3)", color: "hsl(var(--risk-moderate))" },
  critical: { background: "hsl(var(--risk-severe-bg))",   borderColor: "hsl(var(--risk-severe) / 0.3)",   color: "hsl(var(--risk-severe))" },
};

const SEVERITY_ICON_STYLE: Record<string, React.CSSProperties> = {
  info:     { background: "hsl(210 80% 55% / 0.15)", color: "hsl(210 80% 40%)" },
  warning:  { background: "hsl(var(--risk-moderate-bg))", color: "hsl(var(--risk-moderate))" },
  critical: { background: "hsl(var(--risk-severe-bg))", color: "hsl(var(--risk-severe))" },
};

export function LendingPanel({ adjustments, loanAmount = 150, baseLine = 8.5 }: LendingPanelProps) {
  const rateAdj = adjustments.find(a => a.type === "interest_rate");
  const effectiveRate = rateAdj
    ? baseLine + parseFloat(rateAdj.value?.replace(/[^0-9.]/g, "") ?? "0")
    : baseLine;

  const criticalCount = adjustments.filter(a => a.severity === "critical").length;
  const warningCount  = adjustments.filter(a => a.severity === "warning").length;

  return (
    <div className="rounded-xl border border-border bg-card shadow-md overflow-hidden animate-slide-up">
      <div className="px-6 py-4 border-b border-border" style={{ background: "var(--gradient-card-header)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm" style={{ color: "hsl(var(--primary-foreground))" }}>
              Lending Adjustment Recommendations
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--primary-foreground) / 0.65)" }}>
              RBI Climate Risk Framework — Auto-generated
            </p>
          </div>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-200 border border-red-400/30">
                {criticalCount} Critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                {warningCount} Warning
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-3 border-b border-border">
        <div className="px-5 py-4 border-r border-border">
          <div className="text-xs text-muted-foreground mb-1">Loan Amount</div>
          <div className="text-xl font-bold font-mono text-foreground">₹{loanAmount}L</div>
        </div>
        <div className="px-5 py-4 border-r border-border">
          <div className="text-xs text-muted-foreground mb-1">Base Rate</div>
          <div className="text-xl font-bold font-mono text-foreground">{baseLine.toFixed(1)}%</div>
        </div>
        <div className="px-5 py-4">
          <div className="text-xs text-muted-foreground mb-1">Effective Rate</div>
          <div className="text-xl font-bold font-mono" style={{ color: effectiveRate > baseLine ? "hsl(var(--risk-high))" : "hsl(var(--risk-low))" }}>
            {effectiveRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Adjustments list */}
      <div className="p-6 space-y-3">
        {adjustments.map((adj, i) => {
          const typeCfg = TYPE_CONFIG[adj.type] ?? { icon: AlertTriangle, label: adj.type };
          const Icon = typeCfg.icon;
          const sevStyle = SEVERITY_STYLE[adj.severity];
          const iconStyle = SEVERITY_ICON_STYLE[adj.severity];

          return (
            <div
              key={i}
              className="rounded-lg border p-4 flex gap-4"
              style={{ ...sevStyle, borderColor: sevStyle.borderColor }}
            >
              <div className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5" style={iconStyle}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: sevStyle.color }}>{adj.title}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-white/50 text-gray-600">
                      {typeCfg.label}
                    </span>
                  </div>
                  {adj.value && (
                    <span className="text-sm font-bold font-mono flex-shrink-0 px-2 py-0.5 rounded" style={{ color: sevStyle.color, background: "hsl(0 0% 100% / 0.5)" }}>
                      {adj.value}
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.7)" }}>
                  {adj.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="px-6 pb-4">
        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          ⚠ These recommendations are generated by the Climate Credit Risk Engine v2.1 and are advisory in nature. Final lending decisions remain with the Credit Committee as per bank policy. Ref: RBI/2024-25/DOR/FINC/001.
        </p>
      </div>
    </div>
  );
}
