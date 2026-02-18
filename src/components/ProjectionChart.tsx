/**
 * 10–20 Year Climate Projection Chart
 * Line chart showing trajectory of each risk factor over time
 */
import { ProjectionDataPoint } from "@/types/climate";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine
} from "recharts";

interface ProjectionChartProps {
  projections: ProjectionDataPoint[];
}

const LINES = [
  { key: "composite_risk", label: "Composite Risk", color: "hsl(var(--chart-composite))", strokeWidth: 3 },
  { key: "flood_risk",     label: "Flood Risk",     color: "hsl(var(--chart-flood))",     strokeWidth: 1.5 },
  { key: "sea_level_rise", label: "Sea Level Rise", color: "hsl(var(--chart-sea))",       strokeWidth: 1.5 },
  { key: "heat_stress",    label: "Heat Stress",    color: "hsl(var(--chart-heat))",      strokeWidth: 1.5 },
  { key: "water_scarcity", label: "Water Scarcity", color: "hsl(var(--chart-water))",     strokeWidth: 1.5 },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-xs space-y-1 min-w-[160px]">
        <div className="font-semibold text-foreground mb-2">{label}</div>
        {payload.map((p) => (
          <div key={p.name} className="flex justify-between gap-4">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="font-mono font-semibold text-foreground">{p.value.toFixed(1)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function ProjectionChart({ projections }: ProjectionChartProps) {
  const currentYear = new Date().getFullYear();
  const finalScore = projections[projections.length - 1]?.composite_risk ?? 0;
  const initialScore = projections[0]?.composite_risk ?? 0;
  const delta = (finalScore - initialScore).toFixed(1);

  return (
    <div className="rounded-xl border border-border bg-card shadow-md overflow-hidden animate-slide-up">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground">20-Year Climate Risk Projection</h3>
            <p className="text-xs text-muted-foreground mt-0.5">SSP2-4.5 trajectory · IPCC AR6 scenarios</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Risk Delta ({currentYear}→{currentYear + 20})</div>
            <div className="text-lg font-bold font-mono" style={{ color: parseFloat(delta) > 15 ? "hsl(var(--risk-severe))" : parseFloat(delta) > 8 ? "hsl(var(--risk-high))" : "hsl(var(--risk-moderate))" }}>
              +{delta}pts
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Risk thresholds legend */}
        <div className="flex gap-4 mb-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-8 h-0.5 inline-block" style={{ background: "hsl(var(--risk-high))", opacity: 0.4 }} />
            High threshold (75)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-8 h-0.5 inline-block" style={{ background: "hsl(var(--risk-moderate))", opacity: 0.4 }} />
            Moderate threshold (50)
          </span>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={projections} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickCount={6}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
              formatter={(value) => <span style={{ color: "hsl(var(--muted-foreground))" }}>{value}</span>}
            />
            {/* Threshold lines */}
            <ReferenceLine y={75} stroke="hsl(var(--risk-high))" strokeDasharray="4 4" strokeOpacity={0.4} />
            <ReferenceLine y={50} stroke="hsl(var(--risk-moderate))" strokeDasharray="4 4" strokeOpacity={0.4} />
            <ReferenceLine y={25} stroke="hsl(var(--risk-low))" strokeDasharray="4 4" strokeOpacity={0.3} />
            {LINES.map(line => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.label}
                stroke={line.color}
                strokeWidth={line.strokeWidth}
                dot={false}
                activeDot={{ r: 4, fill: line.color }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Milestone table */}
      <div className="px-6 pb-6">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Key Milestones</div>
        <div className="grid grid-cols-3 gap-3">
          {[0, 5, 10].map(i => {
            const pt = projections[i];
            if (!pt) return null;
            return (
              <div key={i} className="data-cell">
                <div className="text-xs text-muted-foreground">{pt.year}</div>
                <div className="text-lg font-bold font-mono" style={{ color: pt.composite_risk > 75 ? "hsl(var(--risk-severe))" : pt.composite_risk > 50 ? "hsl(var(--risk-high))" : pt.composite_risk > 25 ? "hsl(var(--risk-moderate))" : "hsl(var(--risk-low))" }}>
                  {pt.composite_risk.toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground">Composite</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
