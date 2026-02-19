/**
 * TrendsView — Climate Risk Exposure Over Time
 * Long-term trajectory analysis across scenarios and hazard types.
 * Enables strategic planning, regulatory stress-testing and capital provisioning.
 */
import { useState, useMemo } from "react";
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, ReferenceLine, ReferenceDot,
} from "recharts";
import {
    TrendingUp, TrendingDown, Minus, Droplets, Thermometer,
    Waves, Wind, Activity, AlertTriangle, Calendar,
    BarChart3, Layers, Target, ChevronRight, Info,
    ArrowUpRight, ArrowDownRight, Zap,
} from "lucide-react";

/* -------------------------------------------------------------------------
   Types & constants
------------------------------------------------------------------------- */

type Scenario = "ssp1" | "ssp2" | "ssp5";
type Horizon = 10 | 20 | 30;
type HazardKey = "flood_risk" | "heat_stress" | "sea_level_rise" | "water_scarcity" | "composite_risk";

interface ProjectionPoint {
    year: number;
    flood_risk: number;
    heat_stress: number;
    sea_level_rise: number;
    water_scarcity: number;
    composite_risk: number;
    exposure_crore: number;
    high_risk_count: number;
}

interface ScenarioMeta {
    id: Scenario;
    label: string;
    shortLabel: string;
    description: string;
    color: string;
    accel: number; // trajectory acceleration multiplier
}

const SCENARIOS: ScenarioMeta[] = [
    { id: "ssp1", label: "SSP1-1.9  (Optimistic)", shortLabel: "SSP1", description: "Strong mitigation — global warming limited to ~1.5°C by 2100. Steep emissions reductions post-2030.", color: "hsl(142 69% 38%)", accel: 0.6 },
    { id: "ssp2", label: "SSP2-4.5  (Middle Road)", shortLabel: "SSP2", description: "Moderate mitigation — warming of ~2.5°C by 2100. Most likely baseline scenario for Indian lenders.", color: "hsl(38 92% 50%)", accel: 1.0 },
    { id: "ssp5", label: "SSP5-8.5  (High Emission)", shortLabel: "SSP5", description: "No mitigation — warming of ~4°C+ by 2100. Stress-test / worst-case scenario for capital planning.", color: "hsl(0 75% 50%)", accel: 1.7 },
];

const HAZARDS: Array<{ key: HazardKey; label: string; color: string; icon: React.ElementType; unit: string }> = [
    { key: "flood_risk", label: "Flood Risk", color: "hsl(210 80% 55%)", icon: Droplets, unit: "score" },
    { key: "heat_stress", label: "Heat Stress", color: "hsl(22 90% 52%)", icon: Thermometer, unit: "score" },
    { key: "sea_level_rise", label: "Sea-Level Rise", color: "hsl(200 75% 45%)", icon: Waves, unit: "score" },
    { key: "water_scarcity", label: "Water Scarcity", color: "hsl(270 60% 55%)", icon: Wind, unit: "score" },
    { key: "composite_risk", label: "Composite Risk", color: "hsl(174 72% 36%)", icon: Activity, unit: "score" },
];

const HORIZON_OPTIONS: Horizon[] = [10, 20, 30];

/* -------------------------------------------------------------------------
   Data generation
------------------------------------------------------------------------- */

// Base 2026 portfolio snapshot that all scenarios branch from
const BASE = {
    flood_risk: 58, heat_stress: 62, sea_level_rise: 44,
    water_scarcity: 51, composite_risk: 55, exposure_crore: 1240,
    high_risk_count: 18,
};

function generateSeries(scenario: Scenario, horizonYears: Horizon): ProjectionPoint[] {
    const meta = SCENARIOS.find(s => s.id === scenario)!;
    const a = meta.accel;
    const baseYear = 2026;
    const steps = horizonYears / 2 + 1; // biennial

    return Array.from({ length: steps }, (_, i) => {
        const year = baseYear + i * 2;
        const t = i / (steps - 1); // 0 → 1

        // Non-linear IPCC-style trajectories: slow start → acceleration
        const ac = (base: number, rate: number, curve: number) =>
            Math.min(100, parseFloat((base + t * rate * a + t * t * curve * a).toFixed(1)));

        const flood_risk = ac(BASE.flood_risk, 14, 6);
        const heat_stress = ac(BASE.heat_stress, 12, 8);
        const sea_level_rise = ac(BASE.sea_level_rise, 18, 5);
        const water_scarcity = ac(BASE.water_scarcity, 10, 5);
        const composite_risk = parseFloat(
            (flood_risk * 0.35 + sea_level_rise * 0.25 + heat_stress * 0.25 + water_scarcity * 0.15).toFixed(1)
        );

        // exposure grows with risk (more high-risk loans proportionally more exposed)
        const exposure_crore = Math.round(BASE.exposure_crore * (1 + t * 0.4 * a));
        const high_risk_count = Math.min(87, Math.round(BASE.high_risk_count * (1 + t * 0.9 * a)));

        return { year, flood_risk, heat_stress, sea_level_rise, water_scarcity, composite_risk, exposure_crore, high_risk_count };
    });
}

// YoY portfolio snapshot data (historical + projected)
const PORTFOLIO_HISTORY = [
    { year: 2022, exposure: 820, avg_risk: 44, high_pct: 18 },
    { year: 2023, exposure: 960, avg_risk: 48, high_pct: 21 },
    { year: 2024, exposure: 1080, avg_risk: 52, high_pct: 26 },
    { year: 2025, exposure: 1180, avg_risk: 55, high_pct: 29 },
    { year: 2026, exposure: 1240, avg_risk: 58, high_pct: 33 },
    { year: 2027, exposure: 1310, avg_risk: 61, high_pct: 37, projected: true },
    { year: 2028, exposure: 1380, avg_risk: 63, high_pct: 40, projected: true },
    { year: 2029, exposure: 1450, avg_risk: 66, high_pct: 44, projected: true },
    { year: 2030, exposure: 1520, avg_risk: 69, high_pct: 48, projected: true },
];

// Strategic milestones
const MILESTONES = [
    { year: 2026, label: "RBI CRF v1 Baseline", desc: "Climate risk framework baseline established.", color: "hsl(222 70% 45%)", icon: Target },
    { year: 2028, label: "BRSR Mandatory Filing", desc: "SEBI mandates full climate disclosure for all banks.", color: "hsl(38 92% 50%)", icon: AlertTriangle },
    { year: 2030, label: "Net Zero Pledge Target", desc: "India's Paris Agreement interim commitment deadline.", color: "hsl(142 69% 35%)", icon: Zap },
    { year: 2035, label: "Stress Capital Review", desc: "RBI mandated climate stress test under SSP5 scenario.", color: "hsl(0 75% 50%)", icon: BarChart3 },
    { year: 2046, label: "20-yr Horizon End", desc: "End of standard 20-year mortgage cycle assessment.", color: "hsl(174 72% 36%)", icon: Calendar },
];

/* -------------------------------------------------------------------------
   Tooltip helpers
------------------------------------------------------------------------- */

function ChartTooltip({ active, payload, label, unit = "" }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
    label?: string | number;
    unit?: string;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border border-border rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[170px]">
            <div className="font-bold text-foreground border-b border-border pb-1.5 mb-1">{label}</div>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                        <span style={{ color: "hsl(var(--muted-foreground))" }}>{p.name}</span>
                    </span>
                    <span className="font-mono font-semibold text-foreground">{typeof p.value === "number" ? p.value.toFixed(1) : p.value}{unit}</span>
                </div>
            ))}
        </div>
    );
}

/* -------------------------------------------------------------------------
   Section heading
------------------------------------------------------------------------- */

function SectionHeading({ icon: Icon, title, subtitle, badge }: {
    icon: React.ElementType; title: string; subtitle: string; badge?: string;
}) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "hsl(var(--primary) / 0.1)" }}>
                    <Icon size={17} className="text-primary" />
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">{title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
                </div>
            </div>
            {badge && (
                <span className="text-[10px] font-mono text-muted-foreground border border-border rounded px-2 py-1 bg-muted/30 flex-shrink-0">
                    {badge}
                </span>
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------
   KPI delta card
------------------------------------------------------------------------- */

function DeltaCard({ label, from, to, unit = "", invert = false }: {
    label: string; from: number; to: number; unit?: string; invert?: boolean;
}) {
    const delta = to - from;
    const pct = Math.round((delta / from) * 100);
    const up = delta > 0;
    const bad = invert ? !up : up;
    const color = bad ? "hsl(0 75% 50%)" : "hsl(142 69% 35%)";
    const Arrow = up ? ArrowUpRight : ArrowDownRight;
    return (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2 font-medium">{label}</div>
            <div className="flex items-end justify-between gap-2">
                <div>
                    <div className="text-xl font-bold font-mono text-foreground">{to.toFixed(0)}{unit}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">from {from.toFixed(0)}{unit}</div>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                    style={{ background: `${color}18`, color }}>
                    <Arrow size={12} />{Math.abs(pct)}%
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------
   Active hazard toggles
------------------------------------------------------------------------- */

function HazardToggle({ hazards, active, onToggle }: {
    hazards: typeof HAZARDS;
    active: Set<HazardKey>;
    onToggle: (k: HazardKey) => void;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {hazards.map(h => {
                const on = active.has(h.key);
                const Icon = h.icon;
                return (
                    <button key={h.key} onClick={() => onToggle(h.key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150
              ${on ? "shadow-sm" : "opacity-40 hover:opacity-70"}`}
                        style={on
                            ? { background: `${h.color}18`, borderColor: `${h.color}60`, color: h.color }
                            : { background: "hsl(var(--muted))", borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
                        }>
                        <Icon size={11} />{h.label}
                    </button>
                );
            })}
        </div>
    );
}

/* -------------------------------------------------------------------------
   Milestone Timeline
------------------------------------------------------------------------- */

function MilestoneTimeline({ milestones, startYear, endYear }: {
    milestones: typeof MILESTONES; startYear: number; endYear: number;
}) {
    const range = endYear - startYear;
    const visible = milestones.filter(m => m.year >= startYear && m.year <= endYear);

    return (
        <div className="relative">
            {/* track */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-border rounded-full" />
            <div className="flex justify-between relative">
                {visible.map((m, i) => {
                    const pct = ((m.year - startYear) / range) * 100;
                    const Icon = m.icon;
                    return (
                        <div key={i} className="group flex flex-col items-center gap-2"
                            style={{ position: "absolute", left: `${pct}%`, transform: "translateX(-50%)" }}>
                            {/* dot */}
                            <div className="w-8 h-8 rounded-full border-2 border-card flex items-center justify-center z-10 shadow-sm transition-transform group-hover:scale-110"
                                style={{ background: m.color }}>
                                <Icon size={13} className="text-white" />
                            </div>
                            {/* label card — alternating above/below */}
                            <div className={`absolute ${i % 2 === 0 ? "top-10" : "-top-16"} w-36 bg-card border border-border rounded-lg p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none`}>
                                <div className="text-[10px] font-bold" style={{ color: m.color }}>{m.year}</div>
                                <div className="text-[10px] font-semibold text-foreground leading-tight">{m.label}</div>
                                <div className="text-[9px] text-muted-foreground leading-tight mt-0.5">{m.desc}</div>
                            </div>
                            {/* always-visible year */}
                            <div className={`absolute ${i % 2 === 0 ? "top-9" : "-top-5"} text-[9px] font-mono font-semibold whitespace-nowrap`}
                                style={{ color: m.color }}>{m.year}</div>
                        </div>
                    );
                })}
            </div>
            <div className="h-16" /> {/* spacer for dots */}
            {/* legend below */}
            <div className="mt-4 flex flex-wrap gap-3">
                {visible.map((m, i) => {
                    const Icon = m.icon;
                    return (
                        <div key={i} className="flex items-center gap-2 text-xs">
                            <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                                style={{ background: m.color }}>
                                <Icon size={10} className="text-white" />
                            </div>
                            <span className="text-muted-foreground"><span className="font-semibold text-foreground">{m.year}</span> · {m.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------
   Scenario comparator strip
------------------------------------------------------------------------- */

function ScenarioComparator({ series, horizon }: {
    series: Record<Scenario, ProjectionPoint[]>;
    horizon: Horizon;
}) {
    return (
        <div className="grid grid-cols-3 gap-4">
            {SCENARIOS.map(sc => {
                const pts = series[sc.id];
                const last = pts[pts.length - 1];
                const first = pts[0];
                const delta = (last.composite_risk - first.composite_risk).toFixed(1);
                const atRisk = Math.round((last.high_risk_count / 87) * 100);
                return (
                    <div key={sc.id} className="rounded-xl border border-border p-4 bg-card hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ background: `${sc.color}18`, color: sc.color }}>{sc.shortLabel}</span>
                            <span className="text-[10px] text-muted-foreground">{horizon}yr view</span>
                        </div>
                        <div className="text-2xl font-bold font-mono" style={{ color: sc.color }}>
                            {last.composite_risk.toFixed(0)}
                        </div>
                        <div className="text-[10px] text-muted-foreground mb-3">Composite risk in {last.year}</div>
                        <div className="space-y-1.5 text-[11px]">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Risk delta</span>
                                <span className="font-mono font-semibold" style={{ color: sc.color }}>+{delta} pts</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Exposure</span>
                                <span className="font-mono font-semibold text-foreground">₹{last.exposure_crore} Cr</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">High/Severe loans</span>
                                <span className="font-mono font-semibold" style={{ color: atRisk > 50 ? "hsl(0 75% 50%)" : "hsl(38 92% 50%)" }}>
                                    {atRisk}%
                                </span>
                            </div>
                        </div>
                        {/* mini progress bar for composite risk */}
                        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${last.composite_risk}%`, background: sc.color }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/* -------------------------------------------------------------------------
   Main TrendsView
------------------------------------------------------------------------- */

export function TrendsView() {
    const [activeScenario, setActiveScenario] = useState<Scenario>("ssp2");
    const [compareMode, setCompareMode] = useState(false);
    const [horizon, setHorizon] = useState<Horizon>(20);
    const [activeHazards, setActiveHazards] = useState<Set<HazardKey>>(
        new Set(["flood_risk", "heat_stress", "sea_level_rise", "composite_risk"])
    );

    const toggleHazard = (k: HazardKey) =>
        setActiveHazards(prev => {
            const next = new Set(prev);
            if (next.has(k)) { if (next.size > 1) next.delete(k); }
            else next.add(k);
            return next;
        });

    const allSeries = useMemo<Record<Scenario, ProjectionPoint[]>>(
        () => ({
            ssp1: generateSeries("ssp1", horizon),
            ssp2: generateSeries("ssp2", horizon),
            ssp5: generateSeries("ssp5", horizon),
        }), [horizon]
    );

    const activeSeries = allSeries[activeScenario];
    const first = activeSeries[0];
    const last = activeSeries[activeSeries.length - 1];
    const endYear = last.year;
    const scMeta = SCENARIOS.find(s => s.id === activeScenario)!;

    // For compare mode: all 3 scenarios' composite merged by year
    const compareData = useMemo(() => {
        const ssp1 = allSeries.ssp1;
        return ssp1.map((_, i) => ({
            year: allSeries.ssp2[i]?.year,
            SSP1: allSeries.ssp1[i]?.composite_risk,
            SSP2: allSeries.ssp2[i]?.composite_risk,
            SSP5: allSeries.ssp5[i]?.composite_risk,
        }));
    }, [allSeries]);

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 pb-10">

            {/* ── Page header ── */}
            <div className="rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="px-6 py-5"
                    style={{ background: "linear-gradient(135deg, hsl(222 70% 14%) 0%, hsl(222 55% 22%) 55%, hsl(174 72% 20%) 100%)" }}>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <div className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "hsl(174 72% 60%)" }}>
                                Climate Credit Risk Engine · Trends Module
                            </div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                <TrendingUp className="w-6 h-6" style={{ color: "hsl(174 72% 60%)" }} />
                                Climate Risk Trends
                            </h2>
                            <p className="text-sm mt-1.5 max-w-2xl" style={{ color: "hsl(210 30% 75%)" }}>
                                Track how climate risk exposure evolves over your loan portfolio horizon.
                                Switch between IPCC scenarios for stress-testing and long-term capital planning.
                            </p>
                        </div>
                        {/* Controls */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                            {/* Horizon picker */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-white/50 mr-1">Horizon</span>
                                {HORIZON_OPTIONS.map(h => (
                                    <button key={h} onClick={() => setHorizon(h)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                      ${horizon === h ? "bg-white/20 border-white/30 text-white" : "border-white/10 text-white/50 hover:text-white"}`}>
                                        {h}yr
                                    </button>
                                ))}
                            </div>
                            {/* Compare toggle */}
                            <button onClick={() => setCompareMode(v => !v)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                  ${compareMode ? "bg-white/20 border-white/30 text-white" : "border-white/10 text-white/50 hover:text-white"}`}>
                                <Layers size={13} />
                                {compareMode ? "Scenario Compare: ON" : "Compare Scenarios"}
                            </button>
                        </div>
                    </div>

                    {/* Scenario tabs (only in single mode) */}
                    {!compareMode && (
                        <div className="mt-4 flex gap-2 flex-wrap">
                            {SCENARIOS.map(sc => (
                                <button key={sc.id} onClick={() => setActiveScenario(sc.id)}
                                    className={`flex-1 min-w-[140px] text-left px-4 py-3 rounded-xl border transition-all duration-200
                    ${activeScenario === sc.id ? "bg-white/10 border-white/25 shadow-sm" : "border-white/8 hover:bg-white/5 hover:border-white/15"}`}>
                                    <div className="font-semibold text-sm" style={{ color: sc.color }}>{sc.shortLabel}</div>
                                    <div className="text-[11px] text-white/70 mt-0.5 leading-tight">{sc.label.split("(")[1]?.replace(")", "") || sc.label}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* KPI delta strip */}
                {!compareMode && (
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border bg-card">
                        {[
                            { label: `Composite Risk ${first.year}→${endYear}`, from: first.composite_risk, to: last.composite_risk, unit: "pt", invert: false },
                            { label: `Flood Risk ${first.year}→${endYear}`, from: first.flood_risk, to: last.flood_risk, unit: "pt", invert: false },
                            { label: `Heat Stress ${first.year}→${endYear}`, from: first.heat_stress, to: last.heat_stress, unit: "pt", invert: false },
                            { label: `Exposure ${first.year}→${endYear}`, from: first.exposure_crore, to: last.exposure_crore, unit: " Cr", invert: false },
                        ].map((kpi, i) => {
                            const delta = kpi.to - kpi.from;
                            const pct = Math.round((delta / kpi.from) * 100);
                            const bad = delta > 0 && kpi.label.includes("Exposure") ? false : delta > 0;
                            const color = i === 3 ? "hsl(174 72% 36%)" : bad ? "hsl(0 75% 50%)" : "hsl(142 69% 35%)";
                            const Arrow = delta > 0 ? ArrowUpRight : ArrowDownRight;
                            return (
                                <div key={i} className="px-5 py-4 flex items-center justify-between gap-2">
                                    <div>
                                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{kpi.label}</div>
                                        <div className="text-xl font-bold font-mono text-foreground">{kpi.to.toFixed(0)}{kpi.unit}</div>
                                        <div className="text-[10px] text-muted-foreground">from {kpi.from.toFixed(0)}{kpi.unit}</div>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg"
                                        style={{ background: `${color}15`, color }}>
                                        <Arrow size={12} />{Math.abs(pct)}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Scenario comparator (compare mode) ── */}
            {compareMode && (
                <div className="animate-slide-up">
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm mb-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Layers size={15} className="text-primary" />
                            <span className="font-semibold text-sm">Scenario Comparison — {horizon}-Year Outlook</span>
                        </div>
                        <ScenarioComparator series={allSeries} horizon={horizon} />
                    </div>
                </div>
            )}

            {/* ── Main chart block ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Multi-hazard trend chart — takes 2/3 */}
                <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-border">
                        <SectionHeading
                            icon={Activity}
                            title={compareMode ? "Composite Risk — All Scenarios" : `Hazard Trend Lines · ${scMeta.shortLabel}`}
                            subtitle={compareMode
                                ? "Side-by-side composite risk trajectory for SSP1, SSP2, SSP5"
                                : `${scMeta.label} — ${scMeta.description}`}
                            badge={`IPCC AR6 · ${horizon}yr`}
                        />
                        {!compareMode && (
                            <div className="mt-3">
                                <HazardToggle hazards={HAZARDS} active={activeHazards} onToggle={toggleHazard} />
                            </div>
                        )}
                    </div>
                    <div className="p-5">
                        <ResponsiveContainer width="100%" height={360}>
                            {compareMode ? (
                                <AreaChart data={compareData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                                    <defs>
                                        {SCENARIOS.map(sc => (
                                            <linearGradient key={sc.id} id={`grad-${sc.id}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={sc.color} stopOpacity={0.3} />
                                                <stop offset="100%" stopColor={sc.color} stopOpacity={0.03} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[30, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickCount={6} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
                                        formatter={v => <span style={{ color: "hsl(var(--muted-foreground))" }}>{v}</span>} />
                                    <ReferenceLine y={75} stroke="hsl(var(--risk-severe))" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: "Severe", fontSize: 9, fill: "hsl(var(--risk-severe))" }} />
                                    <ReferenceLine y={50} stroke="hsl(var(--risk-high))" strokeDasharray="4 4" strokeOpacity={0.35} />
                                    {SCENARIOS.map(sc => (
                                        <Area key={sc.id} type="monotone" dataKey={sc.shortLabel} stroke={sc.color}
                                            strokeWidth={2.5} fill={`url(#grad-${sc.id})`}
                                            dot={false} activeDot={{ r: 4 }} />
                                    ))}
                                </AreaChart>
                            ) : (
                                <LineChart data={activeSeries} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                                    <YAxis domain={[20, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickCount={6} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }}
                                        formatter={v => <span style={{ color: "hsl(var(--muted-foreground))" }}>{v}</span>} />
                                    <ReferenceLine y={75} stroke="hsl(var(--risk-severe))" strokeDasharray="4 4" strokeOpacity={0.4} />
                                    <ReferenceLine y={50} stroke="hsl(var(--risk-high))" strokeDasharray="4 4" strokeOpacity={0.35} />
                                    <ReferenceLine y={25} stroke="hsl(var(--risk-low))" strokeDasharray="4 4" strokeOpacity={0.25} />
                                    {/* Annotate today */}
                                    <ReferenceDot x={2026} y={first.composite_risk} r={5}
                                        fill={scMeta.color} stroke="white" strokeWidth={2} label={{ value: "Now", fontSize: 9, position: "top", fill: scMeta.color }} />
                                    {HAZARDS.filter(h => activeHazards.has(h.key)).map(h => (
                                        <Line key={h.key} type="monotone" dataKey={h.key} name={h.label}
                                            stroke={h.color}
                                            strokeWidth={h.key === "composite_risk" ? 3 : 1.5}
                                            strokeDasharray={h.key === "composite_risk" ? undefined : "0"}
                                            dot={false} activeDot={{ r: 4, fill: h.color }} />
                                    ))}
                                </LineChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Exposure & high-risk count — 1/3 */}
                <div className="space-y-4">
                    {/* Exposure bar chart */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-border">
                            <h4 className="font-semibold text-sm text-foreground">Portfolio Exposure Trend</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">₹ Crore · {horizon}yr {scMeta.shortLabel}</p>
                        </div>
                        <div className="p-4">
                            <ResponsiveContainer width="100%" height={170}>
                                <BarChart data={activeSeries.filter((_, i) => i % 2 === 0)}
                                    margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis dataKey="year" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickCount={4} />
                                    <Tooltip content={<ChartTooltip unit=" Cr" />} />
                                    <Bar dataKey="exposure_crore" name="Exposure (₹Cr)" radius={[3, 3, 0, 0]}>
                                        {activeSeries.filter((_, i) => i % 2 === 0).map((entry, i) => (
                                            <Cell key={i}
                                                fill={entry.composite_risk > 75 ? "hsl(0 75% 55%)"
                                                    : entry.composite_risk > 50 ? "hsl(22 90% 55%)"
                                                        : entry.composite_risk > 25 ? "hsl(38 92% 55%)"
                                                            : "hsl(174 72% 42%)"}
                                                opacity={0.85} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* High-risk loan count */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-border">
                            <h4 className="font-semibold text-sm text-foreground">High/Severe Loan Count</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">Properties needing intervention</p>
                        </div>
                        <div className="p-4">
                            <ResponsiveContainer width="100%" height={140}>
                                <AreaChart data={activeSeries} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="gradHigh" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="hsl(0 75% 50%)" stopOpacity={0.35} />
                                            <stop offset="100%" stopColor="hsl(0 75% 50%)" stopOpacity={0.03} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="year" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickCount={4} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Area type="monotone" dataKey="high_risk_count" name="High/Severe count"
                                        stroke="hsl(0 75% 50%)" strokeWidth={2}
                                        fill="url(#gradHigh)" dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Quick stat pills */}
                    <div className="grid grid-cols-2 gap-3">
                        <DeltaCard label="Composite Risk" from={first.composite_risk} to={last.composite_risk} />
                        <DeltaCard label="High Risk Loans" from={first.high_risk_count} to={last.high_risk_count} />
                    </div>
                </div>
            </div>

            {/* ── Historical YoY portfolio trend ── */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-border">
                    <SectionHeading
                        icon={BarChart3}
                        title="Historical + Projected Portfolio Risk"
                        subtitle="Observed YoY data (2022–2026) blended with SSP2 near-term projections (2027–2030)"
                        badge="Historical · SSP2 Baseline"
                    />
                </div>
                <div className="p-5">
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={PORTFOLIO_HISTORY} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickCount={5} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickCount={5} domain={[0, 100]} />
                            <Tooltip content={<ChartTooltip />} />
                            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                                formatter={v => <span style={{ color: "hsl(var(--muted-foreground))" }}>{v}</span>} />
                            <Bar yAxisId="left" dataKey="exposure" name="Exposure ₹Cr" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                {PORTFOLIO_HISTORY.map((d, i) => (
                                    <Cell key={i} fill={(d as { projected?: boolean }).projected ? "hsl(174 72% 42% / 0.5)" : "hsl(174 72% 42%)"} />
                                ))}
                            </Bar>
                            <Line yAxisId="right" type="monotone" dataKey="avg_risk" name="Avg Risk Score"
                                stroke="hsl(22 90% 52%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(22 90% 52%)", stroke: "white", strokeWidth: 2 }}
                                strokeDasharray="0" />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "hsl(174 72% 42%)" }} /> Observed
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm inline-block opacity-50" style={{ background: "hsl(174 72% 42%)" }} /> Projected (SSP2)
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Strategic milestones timeline ── */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-border">
                    <SectionHeading
                        icon={Calendar}
                        title="Strategic Planning Milestones"
                        subtitle="Regulatory deadlines, stress-test windows, and policy inflection points — hover dots for detail"
                        badge="RBI · SEBI · Paris Agreement"
                    />
                </div>
                <div className="px-6 pt-6 pb-4">
                    <MilestoneTimeline milestones={MILESTONES} startYear={2026} endYear={endYear} />
                </div>
            </div>

            {/* ── Scenario info footer ── */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className="flex items-start gap-3 mb-4">
                    <Info size={15} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                        <div className="font-semibold text-sm text-foreground mb-1">About IPCC Scenarios</div>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
                            Trajectories are derived from IPCC AR6 Shared Socioeconomic Pathways (SSPs), calibrated to Indian regional climate models
                            (IMD, INCOIS, CWMI). SSP2-4.5 is the regulatory baseline recommended by RBI's Climate Risk Framework (2024). Use SSP5-8.5
                            for capital adequacy stress-testing and SSP1-1.9 for green finance incentive modeling.
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {SCENARIOS.map(sc => (
                        <div key={sc.id} className="rounded-lg border border-border p-3 flex items-start gap-3">
                            <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: sc.color }} />
                            <div>
                                <div className="text-xs font-semibold text-foreground">{sc.label}</div>
                                <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{sc.description}</div>
                            </div>
                            <ChevronRight size={13} className="text-muted-foreground flex-shrink-0 mt-0.5 ml-auto" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
