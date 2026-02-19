/**
 * PortfolioView — Aggregated Climate Exposure Across Multiple Loans
 * Identifies high-risk concentration zones across a lender's portfolio.
 */
import { useState, useCallback, useMemo } from "react";
import {
    Search, Building, MapPin, AlertTriangle, Briefcase, TrendingUp,
    Plus, X, RefreshCw, Flame, Droplets, Wind, Thermometer,
    ChevronDown, ChevronUp, ShieldAlert, Activity, DollarSign,
    BarChart3, PieChart, Eye, Filter
} from "lucide-react";
import { RecentAssessment, RiskClassification } from "@/types/climate";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface ZonePortfolio {
    locationId: string;
    locationName: string;
    region: string;
    lat: number;
    lng: number;
    totalProperties: number;
    averageRiskScore: number;
    totalExposure: number;     // ₹ Crore
    weightedRiskExposure: number; // exposure × risk score / 100
    riskDistribution: Record<RiskClassification, number>;
    dominantHazard: string;
    hazardScores: { flood: number; heat: number; water: number; sea: number };
    properties: RecentAssessment[];
    status: "loaded" | "loading" | "error";
    error?: string;
}

interface PortfolioSummary {
    totalZones: number;
    totalProperties: number;
    totalExposure: number;
    weightedAvgRisk: number;
    highRiskExposure: number;
    concentrationIndex: number; // HHI-like 0–100
    redZones: string[];
}

/* -------------------------------------------------------------------------- */
/*  Constants & Helpers                                                        */
/* -------------------------------------------------------------------------- */

const RISK_CONFIG: Record<RiskClassification, {
    color: string; bg: string; border: string; label: string; order: number;
}> = {
    Low: { color: "hsl(142 69% 35%)", bg: "hsl(142 60% 94%)", border: "hsl(142 60% 80%)", label: "Low", order: 0 },
    Moderate: { color: "hsl(38 92% 50%)", bg: "hsl(38 92% 94%)", border: "hsl(38 80% 75%)", label: "Moderate", order: 1 },
    High: { color: "hsl(22 90% 52%)", bg: "hsl(22 90% 94%)", border: "hsl(22 80% 76%)", label: "High", order: 2 },
    Severe: { color: "hsl(0 75% 50%)", bg: "hsl(0 75% 94%)", border: "hsl(0 65% 78%)", label: "Severe", order: 3 },
};

const ALL_LEVELS: RiskClassification[] = ["Low", "Moderate", "High", "Severe"];

function classifyByScore(score: number): RiskClassification {
    if (score >= 80) return "Severe";
    if (score >= 60) return "High";
    if (score >= 30) return "Moderate";
    return "Low";
}

function scoreColor(score: number): string {
    return RISK_CONFIG[classifyByScore(score)].color;
}

function formatCrore(val: number): string {
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K Cr`;
    return `₹${val} Cr`;
}

/* -------------------------------------------------------------------------- */
/*  Mock backend — returns deterministic zone data from a location ID         */
/* -------------------------------------------------------------------------- */

async function fetchZonePortfolio(locationId: string): Promise<ZonePortfolio> {
    await new Promise(r => setTimeout(r, 700 + Math.random() * 600));
    if (!locationId.trim()) throw new Error("Empty location ID");

    const seed = locationId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const count = 6 + (seed % 12);

    const REGION_MAP: Record<string, { name: string; region: string; lat: number; lng: number }> = {
        MUM: { name: "Mumbai Central", region: "Maharashtra Coast", lat: 18.96, lng: 72.82 },
        CHN: { name: "Chennai Metro", region: "Tamil Nadu Coast", lat: 13.08, lng: 80.27 },
        DEL: { name: "Delhi NCR", region: "Indo-Gangetic Plain", lat: 28.61, lng: 77.21 },
        KOL: { name: "Kolkata Port", region: "West Bengal Delta", lat: 22.57, lng: 88.36 },
        HYD: { name: "Hyderabad", region: "Deccan Plateau", lat: 17.39, lng: 78.49 },
        BLR: { name: "Bangalore Urban", region: "Karnataka Plateau", lat: 12.97, lng: 77.59 },
        AHM: { name: "Ahmedabad", region: "Gujarat Lowlands", lat: 23.02, lng: 72.57 },
        PUN: { name: "Pune", region: "Western Ghats Edge", lat: 18.52, lng: 73.86 },
    };

    const prefix = locationId.toUpperCase().slice(0, 3);
    const geoKey = Object.keys(REGION_MAP).find(k => prefix.startsWith(k)) || "DEL";
    const geo = REGION_MAP[geoKey] || REGION_MAP["DEL"];

    const hazard = {
        flood: Math.round(20 + (seed * 7) % 60),
        heat: Math.round(15 + (seed * 13) % 65),
        water: Math.round(10 + (seed * 11) % 55),
        sea: Math.round(5 + (seed * 3) % 40),
    };

    const dominantKey = Object.entries(hazard).sort(([, a], [, b]) => b - a)[0][0];
    const hazardLabels: Record<string, string> = { flood: "Flood Risk", heat: "Heat Stress", water: "Water Scarcity", sea: "Sea-Level Rise" };

    const properties: RecentAssessment[] = Array.from({ length: count }).map((_, i) => {
        const baseScore = (seed * 7 + i * 13) % 95;
        const noise = Math.floor(Math.random() * 10 - 5);
        const score = Math.max(5, Math.min(99, baseScore + noise));
        const classification = classifyByScore(score);
        const propTypes = ["residential", "commercial", "industrial", "agricultural", "mixed_use"] as const;
        return {
            id: `${prefix}-${(1000 + seed % 900 + i).toString().padStart(4, "0")}`,
            location_name: `${geo.name} — Block ${String.fromCharCode(65 + (i % 26))}${i + 1}`,
            property_type: propTypes[i % propTypes.length],
            score,
            classification,
            timestamp: new Date(Date.now() - i * 3 * 86400000).toISOString(),
            loan_amount: Math.round(80 + (seed % 200) + i * 15 + Math.random() * 30),
        };
    });

    const totalExposure = properties.reduce((s, p) => s + (p.loan_amount ?? 0), 0);
    const averageRiskScore = Math.round(properties.reduce((s, p) => s + p.score, 0) / count);

    const riskDistribution: Record<RiskClassification, number> = { Low: 0, Moderate: 0, High: 0, Severe: 0 };
    properties.forEach(p => { riskDistribution[p.classification]++; });

    const weightedRiskExposure = properties.reduce((s, p) => s + (p.loan_amount ?? 0) * (p.score / 100), 0);

    return {
        locationId,
        locationName: geo.name,
        region: geo.region,
        lat: geo.lat + (Math.random() - 0.5) * 0.5,
        lng: geo.lng + (Math.random() - 0.5) * 0.5,
        totalProperties: count,
        averageRiskScore,
        totalExposure,
        weightedRiskExposure: Math.round(weightedRiskExposure),
        riskDistribution,
        dominantHazard: hazardLabels[dominantKey],
        hazardScores: hazard,
        properties,
        status: "loaded",
    };
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                             */
/* -------------------------------------------------------------------------- */

/** Animated circular risk gauge */
function MiniGauge({ score, size = 48 }: { score: number; size?: number }) {
    const r = (size - 6) / 2;
    const circ = r * 2 * Math.PI;
    const arc = circ * 0.75;
    const filled = arc * (score / 100);
    const color = scoreColor(score);
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(135deg)" }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(220 15% 88%)" strokeWidth={5}
                strokeDasharray={`${arc} ${circ}`} strokeLinecap="round" />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={5}
                strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
                style={{ transition: "stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)" }} />
        </svg>
    );
}

/** Stacked bar for risk distribution */
function RiskStackBar({ dist, total }: { dist: Record<RiskClassification, number>; total: number }) {
    return (
        <div className="w-full h-2.5 rounded-full overflow-hidden flex">
            {ALL_LEVELS.map(level => {
                const pct = (dist[level] / total) * 100;
                if (pct === 0) return null;
                return (
                    <div key={level} style={{ width: `${pct}%`, background: RISK_CONFIG[level].color }}
                        className="h-full transition-all duration-700" title={`${level}: ${dist[level]}`} />
                );
            })}
        </div>
    );
}

/** Hazard icon mapping */
function HazardIcon({ type, size = 14 }: { type: string; size?: number }) {
    const map: Record<string, React.ElementType> = {
        "Flood Risk": Droplets,
        "Heat Stress": Thermometer,
        "Water Scarcity": Wind,
        "Sea-Level Rise": Activity,
    };
    const Icon = map[type] ?? Flame;
    return <Icon size={size} />;
}

/** Zone card in the portfolio grid */
function ZoneCard({
    zone, selected, onSelect, onRemove
}: {
    zone: ZonePortfolio;
    selected: boolean;
    onSelect: () => void;
    onRemove: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const cls = classifyByScore(zone.averageRiskScore);
    const cfg = RISK_CONFIG[cls];
    const highRiskPct = Math.round(
        ((zone.riskDistribution.High + zone.riskDistribution.Severe) / zone.totalProperties) * 100
    );

    if (zone.status === "loading") {
        return (
            <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-3" />
                <div className="h-3 bg-muted rounded w-1/2 mb-6" />
                <div className="h-16 bg-muted rounded mb-3" />
                <div className="h-3 bg-muted rounded w-2/3" />
            </div>
        );
    }

    if (zone.status === "error") {
        return (
            <div className="bg-card border border-destructive/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-destructive">{zone.locationId}</span>
                    <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors"><X size={14} /></button>
                </div>
                <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertTriangle size={14} />
                    <span>{zone.error ?? "Failed to load zone data"}</span>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={onSelect}
            className={`bg-card border rounded-xl overflow-hidden cursor-pointer transition-all duration-200
        ${selected
                    ? "border-primary shadow-lg ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40 hover:shadow-md"
                }`}
        >
            {/* Card header gradient */}
            <div className="px-5 py-4 relative" style={{ background: `linear-gradient(135deg, ${cfg.bg} 0%, hsl(220 15% 98%) 100%)` }}>
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded"
                                style={{ background: cfg.border, color: cfg.color }}>{zone.locationId}</span>
                            {highRiskPct > 50 && (
                                <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                    style={{ background: "hsl(0 75% 94%)", color: "hsl(0 75% 40%)" }}>
                                    <ShieldAlert size={9} />
                                    HIGH CONC.
                                </span>
                            )}
                        </div>
                        <h3 className="font-semibold text-sm text-foreground leading-tight truncate">{zone.locationName}</h3>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin size={9} />{zone.region}
                        </p>
                    </div>
                    <div className="relative ml-2 flex-shrink-0">
                        <MiniGauge score={zone.averageRiskScore} size={46} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold font-mono" style={{ color: cfg.color }}>{zone.averageRiskScore}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Card body */}
            <div className="px-5 py-3 space-y-3">
                {/* Exposure + properties */}
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                        <div className="text-[10px] text-muted-foreground font-medium">Exposure</div>
                        <div className="text-xs font-bold font-mono text-foreground">{formatCrore(zone.totalExposure)}</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-muted-foreground font-medium">Loans</div>
                        <div className="text-xs font-bold font-mono text-foreground">{zone.totalProperties}</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-muted-foreground font-medium">High Risk</div>
                        <div className="text-xs font-bold font-mono" style={{ color: highRiskPct > 50 ? "hsl(0 75% 50%)" : "hsl(22 90% 52%)" }}>
                            {highRiskPct}%
                        </div>
                    </div>
                </div>

                {/* Risk distribution bar */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-muted-foreground font-medium">Risk Distribution</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                            style={{ background: cfg.bg, color: cfg.color }}>{cls}</span>
                    </div>
                    <RiskStackBar dist={zone.riskDistribution} total={zone.totalProperties} />
                    <div className="flex gap-3 mt-1.5">
                        {ALL_LEVELS.map(lv => zone.riskDistribution[lv] > 0 && (
                            <span key={lv} className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: RISK_CONFIG[lv].color }} />
                                {zone.riskDistribution[lv]}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Dominant hazard */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/60">
                    <span className="text-muted-foreground flex items-center gap-1">
                        <HazardIcon type={zone.dominantHazard} />
                        {zone.dominantHazard}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
                            className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5"
                        >
                            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            <span className="text-[10px]">Details</span>
                        </button>
                        <button
                            onClick={e => { e.stopPropagation(); onRemove(); }}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                            <X size={12} />
                        </button>
                    </div>
                </div>

                {/* Expanded detail: property list */}
                {expanded && (
                    <div className="border-t border-border/60 pt-2 space-y-1.5 max-h-40 overflow-y-auto">
                        {zone.properties.slice(0, 8).map(p => (
                            <div key={p.id} className="flex items-center justify-between text-[10px]">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: RISK_CONFIG[p.classification].color }} />
                                    <span className="truncate text-muted-foreground">{p.location_name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <span className="font-mono font-bold" style={{ color: RISK_CONFIG[p.classification].color }}>{p.score}</span>
                                    <span className="text-muted-foreground">₹{p.loan_amount}Cr</span>
                                </div>
                            </div>
                        ))}
                        {zone.properties.length > 8 && (
                            <p className="text-[10px] text-muted-foreground text-center">+{zone.properties.length - 8} more properties</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/** Bubble chart — zones plotted by exposure vs risk score */
function ConcentrationBubbleChart({ zones }: { zones: ZonePortfolio[] }) {
    const loaded = zones.filter(z => z.status === "loaded");
    if (loaded.length === 0) return null;

    const maxExposure = Math.max(...loaded.map(z => z.totalExposure));
    const W = 540, H = 300, PAD = 40;

    return (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-primary" />
                    Concentration Risk Matrix
                </h3>
                <span className="text-[10px] text-muted-foreground">Bubble size = total exposure</span>
            </div>

            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 280 }}>
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map(pct => {
                    const x = PAD + (pct / 100) * (W - PAD * 2);
                    return (
                        <g key={pct}>
                            <line x1={x} y1={PAD} x2={x} y2={H - PAD} stroke="hsl(220 15% 90%)" strokeWidth={1} />
                            <text x={x} y={H - PAD + 14} fontSize={9} fill="hsl(220 15% 55%)" textAnchor="middle">{pct}</text>
                        </g>
                    );
                })}
                {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
                    const y = PAD + frac * (H - PAD * 2);
                    const val = formatCrore(maxExposure * (1 - frac));
                    return (
                        <g key={i}>
                            <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="hsl(220 15% 90%)" strokeWidth={1} />
                            <text x={PAD - 5} y={y + 3} fontSize={9} fill="hsl(220 15% 55%)" textAnchor="end">{val}</text>
                        </g>
                    );
                })}

                {/* Risk zone background shading */}
                <rect x={PAD} y={PAD} width={(W - PAD * 2) * 0.3} height={H - PAD * 2} fill="hsl(142 60% 94% / 0.5)" />
                <rect x={PAD + (W - PAD * 2) * 0.3} y={PAD} width={(W - PAD * 2) * 0.3} height={H - PAD * 2} fill="hsl(38 92% 94% / 0.5)" />
                <rect x={PAD + (W - PAD * 2) * 0.6} y={PAD} width={(W - PAD * 2) * 0.2} height={H - PAD * 2} fill="hsl(22 90% 94% / 0.5)" />
                <rect x={PAD + (W - PAD * 2) * 0.8} y={PAD} width={(W - PAD * 2) * 0.2} height={H - PAD * 2} fill="hsl(0 75% 94% / 0.5)" />

                {/* Axis labels */}
                <text x={W / 2} y={H - 5} fontSize={10} fill="hsl(220 15% 45%)" textAnchor="middle" fontWeight={500}>
                    Average Risk Score
                </text>
                <text x={12} y={H / 2} fontSize={10} fill="hsl(220 15% 45%)" textAnchor="middle"
                    transform={`rotate(-90, 12, ${H / 2})`} fontWeight={500}>Exposure</text>

                {/* Bubbles */}
                {loaded.map(zone => {
                    const x = PAD + (zone.averageRiskScore / 100) * (W - PAD * 2);
                    const y = PAD + (1 - zone.totalExposure / maxExposure) * (H - PAD * 2);
                    const r = Math.max(10, Math.min(32, Math.sqrt(zone.totalExposure / maxExposure) * 32));
                    const cls = classifyByScore(zone.averageRiskScore);
                    const color = RISK_CONFIG[cls].color;
                    const bgColor = RISK_CONFIG[cls].bg;

                    return (
                        <g key={zone.locationId}>
                            <circle cx={x} cy={y} r={r + 4} fill={bgColor} opacity={0.4} />
                            <circle cx={x} cy={y} r={r} fill={color} opacity={0.85} />
                            <text x={x} y={y + 3} fontSize={8} fill="white" textAnchor="middle" fontWeight={700}>
                                {zone.locationId.slice(0, 3)}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-2 justify-center">
                {ALL_LEVELS.map(lv => (
                    <div key={lv} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="w-3 h-3 rounded-full" style={{ background: RISK_CONFIG[lv].color }} />
                        {lv}
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Hazard breakdown heatmap across all zones */
function HazardHeatmapTable({ zones }: { zones: ZonePortfolio[] }) {
    const loaded = zones.filter(z => z.status === "loaded");
    if (loaded.length === 0) return null;

    const hazards: Array<{ key: keyof ZonePortfolio["hazardScores"]; label: string; Icon: React.ElementType }> = [
        { key: "flood", label: "Flood", Icon: Droplets },
        { key: "heat", label: "Heat", Icon: Thermometer },
        { key: "water", label: "Water", Icon: Wind },
        { key: "sea", label: "Sea", Icon: Activity },
    ];

    function cellBg(score: number) {
        if (score >= 70) return "hsl(0 75% 94%)";
        if (score >= 50) return "hsl(22 90% 94%)";
        if (score >= 30) return "hsl(38 92% 94%)";
        return "hsl(142 60% 94%)";
    }
    function cellColor(score: number) {
        if (score >= 70) return "hsl(0 75% 40%)";
        if (score >= 50) return "hsl(22 90% 40%)";
        if (score >= 30) return "hsl(38 80% 35%)";
        return "hsl(142 69% 30%)";
    }

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="font-semibold text-sm">Hazard Concentration Heatmap</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="px-4 py-2 text-left text-muted-foreground font-medium">Zone</th>
                            {hazards.map(h => (
                                <th key={h.key} className="px-3 py-2 text-center text-muted-foreground font-medium">
                                    <div className="flex items-center gap-1 justify-center">
                                        <h.Icon size={11} />{h.label}
                                    </div>
                                </th>
                            ))}
                            <th className="px-3 py-2 text-center text-muted-foreground font-medium">Avg</th>
                            <th className="px-4 py-2 text-right text-muted-foreground font-medium">Exposure</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loaded.sort((a, b) => b.averageRiskScore - a.averageRiskScore).map(zone => {
                            const avg = Math.round(
                                (zone.hazardScores.flood + zone.hazardScores.heat + zone.hazardScores.water + zone.hazardScores.sea) / 4
                            );
                            return (
                                <tr key={zone.locationId} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-2.5">
                                        <div className="font-semibold text-foreground">{zone.locationName}</div>
                                        <div className="text-[10px] text-muted-foreground font-mono">{zone.locationId}</div>
                                    </td>
                                    {hazards.map(h => {
                                        const val = zone.hazardScores[h.key];
                                        return (
                                            <td key={h.key} className="px-3 py-2.5 text-center">
                                                <span className="inline-block px-2 py-0.5 rounded font-bold font-mono"
                                                    style={{ background: cellBg(val), color: cellColor(val) }}>
                                                    {val}
                                                </span>
                                            </td>
                                        );
                                    })}
                                    <td className="px-3 py-2.5 text-center">
                                        <span className="inline-block px-2 py-0.5 rounded font-bold font-mono"
                                            style={{ background: cellBg(avg), color: cellColor(avg) }}>{avg}</span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-mono font-semibold text-foreground">
                                        {formatCrore(zone.totalExposure)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/** KPI summary strip across the top */
function PortfolioKPIBar({ summary }: { summary: PortfolioSummary }) {
    const kpis = [
        {
            icon: <Building size={16} className="text-primary" />,
            label: "Total Zones",
            value: summary.totalZones.toString(),
            sub: "Location clusters",
        },
        {
            icon: <DollarSign size={16} className="text-secondary" />,
            label: "Total Exposure",
            value: formatCrore(summary.totalExposure),
            sub: "Outstanding loans",
        },
        {
            icon: <BarChart3 size={16} style={{ color: scoreColor(summary.weightedAvgRisk) }} />,
            label: "Portfolio Risk",
            value: `${summary.weightedAvgRisk}/100`,
            sub: "Weighted avg score",
            valueStyle: { color: scoreColor(summary.weightedAvgRisk) },
        },
        {
            icon: <AlertTriangle size={16} className="text-orange-500" />,
            label: "At-Risk Exposure",
            value: formatCrore(summary.highRiskExposure),
            sub: "In High/Severe zones",
            valueStyle: { color: summary.highRiskExposure / summary.totalExposure > 0.4 ? "hsl(0 75% 50%)" : "hsl(22 90% 52%)" },
        },
        {
            icon: <Activity size={16} className="text-purple-500" />,
            label: "Concentration Index",
            value: `${summary.concentrationIndex}%`,
            sub: "Portfolio HHI score",
            valueStyle: { color: summary.concentrationIndex > 60 ? "hsl(0 75% 50%)" : summary.concentrationIndex > 40 ? "hsl(22 90% 52%)" : "hsl(142 69% 35%)" },
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {kpis.map((kpi, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                        {kpi.icon}
                        <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                    </div>
                    <div className="text-xl font-bold font-mono" style={kpi.valueStyle}>{kpi.value}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{kpi.sub}</div>
                </div>
            ))}
        </div>
    );
}

/** High-risk concentration alert banner */
function ConcentrationAlerts({ zones, summary }: { zones: ZonePortfolio[]; summary: PortfolioSummary }) {
    const alerts = zones
        .filter(z => z.status === "loaded")
        .filter(z => {
            const highPct = (z.riskDistribution.High + z.riskDistribution.Severe) / z.totalProperties;
            return highPct > 0.5 || z.averageRiskScore > 65;
        })
        .sort((a, b) => b.averageRiskScore - a.averageRiskScore);

    if (alerts.length === 0) return null;

    return (
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm" style={{ borderColor: "hsl(0 75% 80%)" }}>
            <div className="px-5 py-3 flex items-center gap-2" style={{ background: "hsl(0 75% 96%)" }}>
                <ShieldAlert size={16} style={{ color: "hsl(0 75% 45%)" }} />
                <span className="font-semibold text-sm" style={{ color: "hsl(0 75% 35%)" }}>
                    {alerts.length} High-Risk Concentration Zone{alerts.length > 1 ? "s" : ""} Detected
                </span>
            </div>
            <div className="divide-y" style={{ borderColor: "hsl(0 75% 90%)" }}>
                {alerts.map(zone => {
                    const highPct = Math.round(
                        ((zone.riskDistribution.High + zone.riskDistribution.Severe) / zone.totalProperties) * 100
                    );
                    return (
                        <div key={zone.locationId} className="px-5 py-3 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: "hsl(0 75% 94%)" }}>
                                    <AlertTriangle size={14} style={{ color: "hsl(0 75% 45%)" }} />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm text-foreground">{zone.locationName}</div>
                                    <div className="text-[11px] text-muted-foreground">
                                        {zone.totalProperties} loans · {formatCrore(zone.totalExposure)} exposure ·&nbsp;
                                        <span style={{ color: "hsl(0 75% 45%)" }}>{highPct}% in High/Severe</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <div className="text-right">
                                    <div className="text-[10px] text-muted-foreground">Risk Score</div>
                                    <div className="font-bold font-mono text-sm" style={{ color: scoreColor(zone.averageRiskScore) }}>
                                        {zone.averageRiskScore}/100
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-muted-foreground">At-Risk</div>
                                    <div className="font-bold font-mono text-sm" style={{ color: "hsl(0 75% 45%)" }}>
                                        {formatCrore(zone.weightedRiskExposure)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/** Main sort/filter toolbar */
function PortfolioToolbar({
    sortKey, setSortKey, filterLevel, setFilterLevel, count
}: {
    sortKey: string; setSortKey: (k: string) => void;
    filterLevel: string; setFilterLevel: (l: string) => void;
    count: number;
}) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Filter size={13} /> Showing <span className="font-bold text-foreground">{count}</span> zones
            </div>
            <div className="flex items-center gap-1 ml-auto">
                <span className="text-xs text-muted-foreground mr-1">Sort:</span>
                {["risk", "exposure", "name"].map(k => (
                    <button key={k}
                        onClick={() => setSortKey(k)}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors capitalize
              ${sortKey === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                        {k}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground mr-1">Filter:</span>
                {["All", ...ALL_LEVELS].map(lv => (
                    <button key={lv}
                        onClick={() => setFilterLevel(lv)}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors
              ${filterLevel === lv
                                ? lv === "All"
                                    ? "bg-primary text-primary-foreground"
                                    : ""
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                        style={filterLevel === lv && lv !== "All"
                            ? { background: RISK_CONFIG[lv as RiskClassification].bg, color: RISK_CONFIG[lv as RiskClassification].color }
                            : {}
                        }>
                        {lv}
                    </button>
                ))}
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Main PortfolioView                                                         */
/* -------------------------------------------------------------------------- */

export function PortfolioView() {
    const [inputValue, setInputValue] = useState("");
    const [zones, setZones] = useState<ZonePortfolio[]>([]);
    const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
    const [sortKey, setSortKey] = useState("risk");
    const [filterLevel, setFilterLevel] = useState("All");
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

    /* --- Add a new zone --- */
    const addZone = useCallback(async (id: string) => {
        const trimmed = id.trim().toUpperCase();
        if (!trimmed) return;
        if (zones.some(z => z.locationId === trimmed)) return;

        // Placeholder while loading
        const placeholder: ZonePortfolio = {
            locationId: trimmed, locationName: trimmed, region: "",
            lat: 0, lng: 0, totalProperties: 0, averageRiskScore: 0,
            totalExposure: 0, weightedRiskExposure: 0,
            riskDistribution: { Low: 0, Moderate: 0, High: 0, Severe: 0 },
            dominantHazard: "", hazardScores: { flood: 0, heat: 0, water: 0, sea: 0 },
            properties: [], status: "loading",
        };
        setZones(prev => [...prev, placeholder]);
        setInputValue("");

        try {
            const data = await fetchZonePortfolio(trimmed);
            setZones(prev => prev.map(z => z.locationId === trimmed ? data : z));
        } catch {
            setZones(prev => prev.map(z => z.locationId === trimmed
                ? { ...placeholder, status: "error", error: "Zone not found or unavailable" }
                : z
            ));
        }
    }, [zones]);

    const removeZone = useCallback((id: string) => {
        setZones(prev => prev.filter(z => z.locationId !== id));
        if (selectedZoneId === id) setSelectedZoneId(null);
    }, [selectedZoneId]);

    const addQuick = (id: string) => addZone(id);

    /* --- Derived portfolio summary --- */
    const summary = useMemo<PortfolioSummary>(() => {
        const loaded = zones.filter(z => z.status === "loaded");
        if (loaded.length === 0) return {
            totalZones: 0, totalProperties: 0, totalExposure: 0,
            weightedAvgRisk: 0, highRiskExposure: 0, concentrationIndex: 0, redZones: [],
        };
        const totalExposure = loaded.reduce((s, z) => s + z.totalExposure, 0);
        const totalProperties = loaded.reduce((s, z) => s + z.totalProperties, 0);
        const weightedAvgRisk = Math.round(
            loaded.reduce((s, z) => s + z.averageRiskScore * z.totalExposure, 0) / totalExposure
        );
        const highRiskExposure = Math.round(
            loaded.reduce((s, z) => {
                const hFrac = (z.riskDistribution.High + z.riskDistribution.Severe) / z.totalProperties;
                return s + z.totalExposure * hFrac;
            }, 0)
        );
        // Concentration index: HHI-like (sum of squares of exposure shares)
        const shares = loaded.map(z => z.totalExposure / totalExposure);
        const hhi = shares.reduce((s, sh) => s + sh * sh, 0);
        const concentrationIndex = Math.round(hhi * 100);
        const redZones = loaded.filter(z => z.averageRiskScore >= 60).map(z => z.locationId);
        return { totalZones: loaded.length, totalProperties, totalExposure, weightedAvgRisk, highRiskExposure, concentrationIndex, redZones };
    }, [zones]);

    /* --- Filtered & sorted zone list --- */
    const displayedZones = useMemo(() => {
        let list = [...zones];
        if (filterLevel !== "All") {
            list = list.filter(z => {
                if (z.status !== "loaded") return true;
                return classifyByScore(z.averageRiskScore) === filterLevel;
            });
        }
        if (sortKey === "risk") list.sort((a, b) =>
            (b.status === "loaded" ? b.averageRiskScore : -1) - (a.status === "loaded" ? a.averageRiskScore : -1));
        if (sortKey === "exposure") list.sort((a, b) =>
            (b.status === "loaded" ? b.totalExposure : -1) - (a.status === "loaded" ? a.totalExposure : -1));
        if (sortKey === "name") list.sort((a, b) => a.locationId.localeCompare(b.locationId));
        return list;
    }, [zones, sortKey, filterLevel]);

    const QUICK_IDS = ["MUM-001", "CHN-042", "DEL-007", "KOL-019", "BLR-033"];

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 pb-8">

            {/* ── Header ── */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm"
                style={{ background: "linear-gradient(135deg, hsl(222 70% 14%) 0%, hsl(222 60% 22%) 60%, hsl(174 72% 20%) 100%)" }}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "hsl(174 72% 60%)" }}>
                            Climate Credit Risk Engine · Portfolio Module
                        </div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Briefcase className="w-6 h-6" style={{ color: "hsl(174 72% 60%)" }} />
                            Portfolio Climate Exposure
                        </h2>
                        <p className="text-sm mt-1.5 max-w-xl" style={{ color: "hsl(210 30% 75%)" }}>
                            Aggregate climate risk across your entire loan book. Add location zone IDs to visualize
                            exposure concentration, identify high-risk clusters, and prioritize mitigation.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-lg border transition-colors ${viewMode === "grid" ? "bg-white/20 border-white/30 text-white" : "border-white/10 text-white/50 hover:text-white"}`}
                        >
                            <Eye size={15} />
                        </button>
                        <button
                            onClick={() => setViewMode("table")}
                            className={`p-2 rounded-lg border transition-colors ${viewMode === "table" ? "bg-white/20 border-white/30 text-white" : "border-white/10 text-white/50 hover:text-white"}`}
                        >
                            <BarChart3 size={15} />
                        </button>
                    </div>
                </div>

                {/* Zone search input */}
                <div className="mt-5 flex gap-3 max-w-lg">
                    <div className="relative flex-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && addZone(inputValue)}
                            placeholder="Add Zone ID  e.g. MUM-001, CHN-042…"
                            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                            style={{
                                background: "hsl(222 70% 10% / 0.6)",
                                border: "1px solid hsl(174 72% 40% / 0.4)",
                                color: "white",
                            }}
                        />
                    </div>
                    <button
                        onClick={() => addZone(inputValue)}
                        disabled={!inputValue.trim()}
                        className="px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-40"
                        style={{ background: "hsl(174 72% 36%)", color: "white" }}
                    >
                        <Plus size={15} /> Add Zone
                    </button>
                    {zones.length > 0 && (
                        <button
                            onClick={() => { setZones([]); setSelectedZoneId(null); }}
                            className="px-3 py-2.5 rounded-lg border transition-colors"
                            style={{ border: "1px solid hsl(174 72% 40% / 0.3)", color: "white" }}
                            title="Clear all zones"
                        >
                            <RefreshCw size={14} />
                        </button>
                    )}
                </div>

                {/* Quick-add chips */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wide">Quick add:</span>
                    {QUICK_IDS.map(id => (
                        <button
                            key={id}
                            onClick={() => addQuick(id)}
                            disabled={zones.some(z => z.locationId === id)}
                            className="text-[11px] px-2.5 py-1 rounded-full transition-all disabled:opacity-30 font-mono font-semibold"
                            style={{ background: "hsl(174 72% 40% / 0.2)", color: "hsl(174 72% 70%)", border: "1px solid hsl(174 72% 40% / 0.3)" }}
                        >
                            {id}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Empty state ── */}
            {zones.length === 0 && (
                <div className="text-center py-20">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md"
                        style={{ background: "linear-gradient(135deg, hsl(222 70% 22%) 0%, hsl(174 72% 28%) 100%)" }}>
                        <Briefcase className="w-9 h-9 text-white/80" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">No Zones Added Yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                        Add one or more location zone IDs to begin aggregating climate exposure data across your loan portfolio.
                        Use the quick-add chips above to load sample zones instantly.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {QUICK_IDS.map(id => (
                            <button key={id} onClick={() => addQuick(id)}
                                className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-mono">
                                {id}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── KPI Summary Bar ── */}
            {summary.totalZones > 0 && (
                <div className="animate-slide-up">
                    <PortfolioKPIBar summary={summary} />
                </div>
            )}

            {/* ── Concentration Alerts ── */}
            {summary.totalZones > 0 && (
                <ConcentrationAlerts zones={zones} summary={summary} />
            )}

            {/* ── Zone Grid or Bubble Chart + Heatmap ── */}
            {zones.length > 0 && (
                <div className="space-y-6">
                    {/* Toolbar */}
                    <PortfolioToolbar
                        sortKey={sortKey} setSortKey={setSortKey}
                        filterLevel={filterLevel} setFilterLevel={setFilterLevel}
                        count={displayedZones.length}
                    />

                    {viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
                            {displayedZones.map(zone => (
                                <ZoneCard
                                    key={zone.locationId}
                                    zone={zone}
                                    selected={selectedZoneId === zone.locationId}
                                    onSelect={() => setSelectedZoneId(prev => prev === zone.locationId ? null : zone.locationId)}
                                    onRemove={() => removeZone(zone.locationId)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <ConcentrationBubbleChart zones={zones} />
                            <HazardHeatmapTable zones={zones} />
                        </div>
                    )}

                    {/* Both charts always visible on grid mode if zones loaded */}
                    {viewMode === "grid" && summary.totalZones >= 2 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ConcentrationBubbleChart zones={zones} />
                            <HazardHeatmapTable zones={zones} />
                        </div>
                    )}

                    {viewMode === "grid" && summary.totalZones === 1 && (
                        <HazardHeatmapTable zones={zones} />
                    )}
                </div>
            )}
        </div>
    );
}
