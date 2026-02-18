/**
 * Risk Factor Breakdown Chart
 * Bar chart + factor detail cards for the 4 climate dimensions
 */
import { ClimateFactorScore } from "@/types/climate";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Droplets, Thermometer, Waves, CloudRain } from "lucide-react";

interface RiskBreakdownProps {
  factors: ClimateFactorScore[];
}

const FACTOR_CONFIG = [
  { key: "Flood Probability",       icon: CloudRain,    color: "hsl(var(--chart-flood))",     shortName: "Flood" },
  { key: "Sea-Level Rise Exposure", icon: Waves,        color: "hsl(var(--chart-sea))",       shortName: "Sea Level" },
  { key: "Heat Stress Index",       icon: Thermometer,  color: "hsl(var(--chart-heat))",      shortName: "Heat Stress" },
  { key: "Water Scarcity Projection", icon: Droplets,   color: "hsl(var(--chart-water))",     shortName: "Water" },
];

function getScoreColor(score: number): string {
  if (score < 25) return "hsl(var(--risk-low))";
  if (score < 50) return "hsl(var(--risk-moderate))";
  if (score < 75) return "hsl(var(--risk-high))";
  return "hsl(var(--risk-severe))";
}

function getScoreLabel(score: number): string {
  if (score < 25) return "Low";
  if (score < 50) return "Moderate";
  if (score < 75) return "High";
  return "Severe";
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; score: number; weighted: number; weight: number } }> }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs">
        <div className="font-semibold text-foreground mb-1">{d.name}</div>
        <div className="text-muted-foreground">Raw Score: <span className="text-foreground font-mono">{d.score}/100</span></div>
        <div className="text-muted-foreground">Weight: <span className="text-foreground font-mono">{(d.weight * 100).toFixed(0)}%</span></div>
        <div className="text-muted-foreground">Contribution: <span className="text-foreground font-mono">{d.weighted}</span></div>
      </div>
    );
  }
  return null;
};

export function RiskBreakdownChart({ factors }: RiskBreakdownProps) {
  const chartData = factors.map((f, i) => ({
    name: FACTOR_CONFIG[i]?.shortName ?? f.factor,
    score: f.score,
    weighted: f.weighted_score,
    weight: f.weight,
    color: FACTOR_CONFIG[i]?.color ?? "hsl(var(--primary))",
  }));

  return (
    <div className="rounded-xl border border-border bg-card shadow-md overflow-hidden animate-slide-up">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Risk Factor Breakdown</h3>
          <p className="text-xs text-muted-foreground">Weighted scores across 4 climate dimensions</p>
        </div>
        <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
          IMD · IPCC AR6 · CWMI
        </span>
      </div>

      {/* Bar chart */}
      <div className="px-4 pt-4 pb-2">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickCount={5}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.5)" }} />
            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Factor cards */}
      <div className="px-6 pb-6 grid grid-cols-2 gap-3">
        {factors.map((factor, i) => {
          const cfg = FACTOR_CONFIG[i];
          const Icon = cfg?.icon ?? CloudRain;
          const color = cfg?.color ?? "hsl(var(--primary))";
          const scoreColor = getScoreColor(factor.score);
          const scoreLabel = getScoreLabel(factor.score);

          return (
            <div key={factor.factor} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${color}20` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                  </div>
                  <span className="text-xs font-semibold text-foreground">{cfg?.shortName ?? factor.factor}</span>
                </div>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ color: scoreColor, background: `${scoreColor}15` }}>
                  {scoreLabel}
                </span>
              </div>

              {/* Score bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Score</span>
                  <span className="font-mono font-semibold" style={{ color: scoreColor }}>{factor.score}/100</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${factor.score}%`, background: color }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Weight: {(factor.weight * 100).toFixed(0)}%</span>
                <span className="font-mono text-foreground">+{factor.weighted_score}</span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{factor.description}</p>
              <p className="text-xs text-muted-foreground/60 italic">{factor.data_source}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
