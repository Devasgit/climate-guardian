/**
 * Recent Assessments Table — sidebar history panel
 */
import { RecentAssessment, RiskClassification } from "@/types/climate";
import { Clock } from "lucide-react";

interface RecentAssessmentsProps {
  assessments: RecentAssessment[];
  onSelect?: (id: string) => void;
}

const BADGE_STYLE: Record<RiskClassification, React.CSSProperties> = {
  Low:      { background: "hsl(var(--risk-low-bg))",      color: "hsl(var(--risk-low))" },
  Moderate: { background: "hsl(var(--risk-moderate-bg))", color: "hsl(var(--risk-moderate))" },
  High:     { background: "hsl(var(--risk-high-bg))",     color: "hsl(var(--risk-high))" },
  Severe:   { background: "hsl(var(--risk-severe-bg))",   color: "hsl(var(--risk-severe))" },
};

export function RecentAssessments({ assessments, onSelect }: RecentAssessmentsProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-md overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm text-foreground">Recent Assessments</h3>
      </div>
      <div className="divide-y divide-border">
        {assessments.map(a => (
          <button
            key={a.id}
            onClick={() => onSelect?.(a.id)}
            className="w-full px-5 py-3.5 flex items-start gap-3 hover:bg-muted/40 transition-colors text-left"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-mono text-muted-foreground">{a.id}</span>
                <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={BADGE_STYLE[a.classification]}>
                  {a.classification}
                </span>
              </div>
              <div className="text-sm font-medium text-foreground truncate">{a.location_name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {a.property_type.replace("_", " ")} · ₹{a.loan_amount}L
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold font-mono" style={{ color: BADGE_STYLE[a.classification].color }}>
                {a.score}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(a.timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
