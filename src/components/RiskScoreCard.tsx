/**
 * Climate Risk Score Card
 * Displays the composite score, classification badge, and gauge.
 */
import { ClimateRiskReport, RiskClassification } from "@/types/climate";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";

interface RiskScoreCardProps {
  report: ClimateRiskReport;
}

const CLASSIFICATION_CONFIG: Record<RiskClassification, {
  gradient: string;
  badgeStyle: React.CSSProperties;
  icon: React.ElementType;
  textColor: string;
  description: string;
}> = {
  Low: {
    gradient: "var(--gradient-score-low)",
    badgeStyle: { background: "hsl(var(--risk-low-bg))", color: "hsl(var(--risk-low))", border: "1px solid hsl(var(--risk-low) / 0.3)" },
    icon: CheckCircle,
    textColor: "hsl(var(--risk-low))",
    description: "Minimal climate risk. Standard lending terms applicable.",
  },
  Moderate: {
    gradient: "var(--gradient-score-moderate)",
    badgeStyle: { background: "hsl(var(--risk-moderate-bg))", color: "hsl(var(--risk-moderate))", border: "1px solid hsl(var(--risk-moderate) / 0.3)" },
    icon: Info,
    textColor: "hsl(var(--risk-moderate))",
    description: "Elevated risk requiring enhanced monitoring and standard climate provisions.",
  },
  High: {
    gradient: "var(--gradient-score-high)",
    badgeStyle: { background: "hsl(var(--risk-high-bg))", color: "hsl(var(--risk-high))", border: "1px solid hsl(var(--risk-high) / 0.3)" },
    icon: AlertTriangle,
    textColor: "hsl(var(--risk-high))",
    description: "Significant climate exposure. Enhanced due diligence and risk provisions required.",
  },
  Severe: {
    gradient: "var(--gradient-score-severe)",
    badgeStyle: { background: "hsl(var(--risk-severe-bg))", color: "hsl(var(--risk-severe))", border: "1px solid hsl(var(--risk-severe) / 0.3)" },
    icon: XCircle,
    textColor: "hsl(var(--risk-severe))",
    description: "Critical climate risk. Board-level approval and mandatory risk mitigation required.",
  },
};

function ScoreGauge({ score, classification }: { score: number; classification: RiskClassification }) {
  const config = CLASSIFICATION_CONFIG[classification];
  const radius = 72;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  // Arc covers 75% of the circle (270deg), starting from bottom-left
  const arcPct = 0.75;
  const offset = circumference * arcPct * (1 - score / 100);
  const dasharray = circumference * arcPct;

  return (
    <div className="relative flex items-center justify-center" style={{ width: radius * 2 + 8, height: radius * 2 + 8 }}>
      <svg
        width={radius * 2 + 8}
        height={radius * 2 + 8}
        viewBox={`0 0 ${radius * 2 + 8} ${radius * 2 + 8}`}
        style={{ transform: "rotate(135deg)" }}
      >
        {/* Track */}
        <circle
          cx={radius + 4}
          cy={radius + 4}
          r={normalizedRadius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
          strokeDasharray={`${dasharray} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Score arc */}
        <circle
          cx={radius + 4}
          cy={radius + 4}
          r={normalizedRadius}
          fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth={stroke}
          strokeDasharray={`${dasharray - offset} ${circumference}`}
          strokeLinecap="round"
          className="score-ring"
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            {classification === "Low" && <>
              <stop offset="0%" stopColor="hsl(142 69% 35%)" />
              <stop offset="100%" stopColor="hsl(160 65% 40%)" />
            </>}
            {classification === "Moderate" && <>
              <stop offset="0%" stopColor="hsl(38 92% 50%)" />
              <stop offset="100%" stopColor="hsl(45 90% 55%)" />
            </>}
            {classification === "High" && <>
              <stop offset="0%" stopColor="hsl(22 90% 52%)" />
              <stop offset="100%" stopColor="hsl(30 88% 55%)" />
            </>}
            {classification === "Severe" && <>
              <stop offset="0%" stopColor="hsl(0 75% 50%)" />
              <stop offset="100%" stopColor="hsl(10 78% 55%)" />
            </>}
          </linearGradient>
        </defs>
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold font-mono" style={{ color: config.textColor }}>{score}</span>
        <span className="text-xs text-muted-foreground font-medium">/ 100</span>
      </div>
    </div>
  );
}

export function RiskScoreCard({ report }: RiskScoreCardProps) {
  const config = CLASSIFICATION_CONFIG[report.risk_classification];
  const Icon = config.icon;

  return (
    <div className="rounded-xl border border-border bg-card shadow-md overflow-hidden animate-slide-up">
      {/* Header gradient */}
      <div className="px-6 py-5" style={{ background: config.gradient }}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">{report.location_name}</h2>
            <p className="text-sm text-white/70 mt-0.5">{report.region} · {report.property_type.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}</p>
            <p className="text-xs text-white/50 mt-1 font-mono">{report.latitude.toFixed(4)}°N, {report.longitude.toFixed(4)}°E</p>
          </div>
          <span className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 bg-white/15 text-white border border-white/20">
            <Icon className="w-3.5 h-3.5" />
            {report.risk_classification} Risk
          </span>
        </div>
      </div>

      {/* Score content */}
      <div className="p-6">
        <div className="flex items-center gap-8">
          <ScoreGauge score={report.climate_risk_score} classification={report.risk_classification} />
          <div className="flex-1 space-y-3">
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Climate Risk Score
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold font-mono" style={{ color: config.textColor }}>
                  {report.climate_risk_score}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-bold" style={config.badgeStyle}>
                  {report.risk_classification}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{config.description}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="data-cell">
                <div className="text-xs text-muted-foreground">Model Confidence</div>
                <div className="text-sm font-semibold text-foreground">{Math.round(report.confidence_level * 100)}%</div>
              </div>
              <div className="data-cell">
                <div className="text-xs text-muted-foreground">Data Vintage</div>
                <div className="text-sm font-semibold text-foreground">{report.data_vintage}</div>
              </div>
              <div className="data-cell">
                <div className="text-xs text-muted-foreground">Model Version</div>
                <div className="text-sm font-mono text-foreground">{report.model_version}</div>
              </div>
              <div className="data-cell">
                <div className="text-xs text-muted-foreground">Assessment Date</div>
                <div className="text-sm font-semibold text-foreground">
                  {new Date(report.assessment_date).toLocaleDateString("en-IN")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
