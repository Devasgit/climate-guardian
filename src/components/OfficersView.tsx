/**
 * OfficersView — Loan Officer Climate Risk Decision Panel
 * Helps bank officers review climate risk for a property before approving a loan.
 * Shows score, factor breakdown, AI lending suggestions, and one-click decisions.
 */
import { useState, useMemo } from "react";
import {
    User, MapPin, Building2, BadgeCheck, AlertTriangle, XCircle,
    ChevronRight, Droplets, Thermometer, Waves, Wind,
    TrendingUp, Shield, FileText, CheckCircle, Clock,
    BarChart3, Landmark, RefreshCw, Info, ArrowRight,
    CircleDot, Zap, Search,
} from "lucide-react";
import { calculateFactorScores, classifyRisk, generateProjections, generateLendingAdjustments } from "@/lib/climateEngine";
import { ClimateRiskReport, RiskClassification } from "@/types/climate";

/* -------------------------------------------------------------------------
   Types
------------------------------------------------------------------------- */

type Decision = "approve" | "approve_conditions" | "escalate" | "reject" | null;

interface OfficerProfile {
    id: string;
    name: string;
    branch: string;
    grade: string;
    quota: number;
    done: number;
}

interface LoanApplication {
    id: string;
    applicant: string;
    amount: number;           // ₹ Cr
    property: string;
    lat: number;
    lng: number;
    propertyType: string;
    purpose: string;
    tenure: number;           // years
    submitted: string;
    priority: "normal" | "urgent" | "escalated";
}

/* -------------------------------------------------------------------------
   Mock data
------------------------------------------------------------------------- */

const OFFICER: OfficerProfile = {
    id: "OFF-1042",
    name: "Rajesh Kumar",
    branch: "Delhi — Connaught Place",
    grade: "Senior Credit Officer",
    quota: 20,
    done: 13,
};

const QUEUE: LoanApplication[] = [
    { id: "LAP-8821", applicant: "Arjun Mehta", amount: 2.5, property: "Bandra West, Mumbai", lat: 19.06, lng: 72.83, propertyType: "residential", purpose: "Home Purchase", tenure: 20, submitted: "2026-02-19T06:30:00Z", priority: "urgent" },
    { id: "LAP-8822", applicant: "Priya Nair", amount: 4.8, property: "Marina Beach, Chennai", lat: 13.05, lng: 80.28, propertyType: "commercial", purpose: "Business Premises", tenure: 15, submitted: "2026-02-19T07:10:00Z", priority: "escalated" },
    { id: "LAP-8823", applicant: "Sunita Sharma", amount: 1.2, property: "Koramangala, Bengaluru", lat: 12.93, lng: 77.62, propertyType: "residential", purpose: "Home Purchase", tenure: 25, submitted: "2026-02-19T07:45:00Z", priority: "normal" },
    { id: "LAP-8824", applicant: "Vikas Rao", amount: 8.0, property: "Jodhpur, Rajasthan", lat: 26.29, lng: 73.02, propertyType: "mixed_use", purpose: "Development", tenure: 10, submitted: "2026-02-19T08:00:00Z", priority: "urgent" },
    { id: "LAP-8825", applicant: "Meera Iyer", amount: 3.3, property: "Whitefield, Bengaluru", lat: 12.97, lng: 77.75, propertyType: "commercial", purpose: "Office Space", tenure: 10, submitted: "2026-02-19T08:20:00Z", priority: "normal" },
    { id: "LAP-8826", applicant: "Rahul Verma", amount: 1.8, property: "Salt Lake City, Kolkata", lat: 22.57, lng: 88.41, propertyType: "residential", purpose: "Home Purchase", tenure: 20, submitted: "2026-02-19T08:50:00Z", priority: "normal" },
    { id: "LAP-8827", applicant: "Deepa Krishnan", amount: 6.5, property: "Vashi, Navi Mumbai", lat: 19.07, lng: 73.01, propertyType: "commercial", purpose: "Warehouse", tenure: 12, submitted: "2026-02-19T09:10:00Z", priority: "normal" },
];

const RISK_CFG: Record<RiskClassification, {
    color: string; bg: string; border: string; label: string;
    icon: React.ElementType; textColor: string;
}> = {
    Low: { color: "hsl(142 69% 35%)", bg: "hsl(142 60% 95%)", border: "hsl(142 60% 82%)", label: "Low Risk", icon: CheckCircle, textColor: "text-emerald-700" },
    Moderate: { color: "hsl(38 92% 50%)", bg: "hsl(38 92% 95%)", border: "hsl(38 80% 78%)", label: "Moderate Risk", icon: Info, textColor: "text-amber-600" },
    High: { color: "hsl(22 90% 52%)", bg: "hsl(22 90% 95%)", border: "hsl(22 80% 78%)", label: "High Risk", icon: AlertTriangle, textColor: "text-orange-600" },
    Severe: { color: "hsl(0 75% 50%)", bg: "hsl(0 75% 95%)", border: "hsl(0 65% 80%)", label: "Severe Risk", icon: XCircle, textColor: "text-red-700" },
};

const HAZARD_META = [
    { key: "Flood Probability", icon: Droplets, color: "hsl(210 80% 55%)", short: "Flood" },
    { key: "Sea-Level Rise Exposure", icon: Waves, color: "hsl(200 75% 45%)", short: "Sea" },
    { key: "Heat Stress Index", icon: Thermometer, color: "hsl(22 90% 52%)", short: "Heat" },
    { key: "Water Scarcity Projection", icon: Wind, color: "hsl(270 60% 55%)", short: "Water" },
];

/* -------------------------------------------------------------------------
   AI suggestion engine
------------------------------------------------------------------------- */

function aiSuggestions(report: ClimateRiskReport, app: LoanApplication): {
    verdict: Decision;
    headline: string;
    rationale: string;
    conditions: string[];
    rateAdj: number;        // bps
    insuranceFlag: boolean;
    ltv: number;            // recommended LTV %
} {
    const s = report.climate_risk_score;
    const c = report.risk_classification;

    if (c === "Low") return {
        verdict: "approve",
        headline: "Approve — Minimal Climate Risk",
        rationale: `Score ${s}/100 is well below risk thresholds. No material climate hazard identified for this property.`,
        conditions: ["Standard collateral valuation sufficient", "Include property in annual climate review cycle"],
        rateAdj: 0, insuranceFlag: false, ltv: 80,
    };
    if (c === "Moderate") return {
        verdict: "approve_conditions",
        headline: "Approve with Standard Conditions",
        rationale: `Score ${s}/100 indicates moderate exposure. Loan approvable with enhanced monitoring and marginal rate adjustment.`,
        conditions: [
            "Climate rider clause to be added to loan agreement",
            "Annual climate reassessment at loan anniversary",
            "Standard flood insurance mandatory (if applicable zone)",
        ],
        rateAdj: 25, insuranceFlag: false, ltv: 75,
    };
    if (c === "High") return {
        verdict: "approve_conditions",
        headline: "Conditional Approval — Risk Mitigation Required",
        rationale: `Score ${s}/100 crosses the High risk threshold. Lending is permissible under RBI CRF §4.2 with mandatory safeguards.`,
        conditions: [
            "Mandatory climate-linked insurance cover (flood + sea-level)",
            `Interest rate adjustment of +${Math.round((s - 50) * 1.2)} bps over base rate`,
            "LTV capped at 70% with enhanced appraisal",
            "Borrower to acknowledge Climate Risk Disclosure (RBI/2024-25/DOR/FINC/001)",
            "Trigger covenant: reassess if annual score rises >5 pts",
        ],
        rateAdj: Math.round((s - 50) * 1.2), insuranceFlag: true, ltv: 70,
    };
    // Severe
    return {
        verdict: "escalate",
        headline: "Escalate to Credit Committee",
        rationale: `Score ${s}/100 is Severe. RBI CRF §4.5 mandates Board-level review before approval. Loan may proceed only with executive sign-off.`,
        conditions: [
            "Cannot be approved at Officer level — must go to Credit Committee",
            "Mandatory third-party climate stress report (independent)",
            "Climate-linked insurance across all hazard categories required",
            "LTV hard-cap at 60% regardless of collateral",
            "Full RBI BRSR climate disclosure to borrower",
        ],
        rateAdj: Math.round((s - 60) * 1.8), insuranceFlag: true, ltv: 60,
    };
}

/* -------------------------------------------------------------------------
   Helpers
------------------------------------------------------------------------- */

function priorityBadge(p: LoanApplication["priority"]) {
    const cfg = {
        normal: { label: "Normal", color: "hsl(210 30% 60%)", bg: "hsl(210 30% 95%)" },
        urgent: { label: "Urgent", color: "hsl(38 92% 50%)", bg: "hsl(38 92% 94%)" },
        escalated: { label: "Escalated", color: "hsl(0 75% 50%)", bg: "hsl(0 75% 94%)" },
    }[p];
    return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
    );
}

function ScoreGauge({ score, classification }: { score: number; classification: RiskClassification }) {
    const cfg = RISK_CFG[classification];
    const r = 52, cx = 64, cy = 64;
    const circ = 2 * Math.PI * r;
    const dash = circ * (score / 100);

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-32 h-32">
                <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="10" />
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke={cfg.color}
                        strokeWidth="10" strokeDasharray={`${dash} ${circ}`}
                        strokeLinecap="round" style={{ transition: "stroke-dasharray 1s ease" }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold font-mono" style={{ color: cfg.color }}>{score}</div>
                    <div className="text-[9px] text-muted-foreground">/ 100</div>
                </div>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                {cfg.label}
            </div>
        </div>
    );
}

function HazardBar({ label, score, icon: Icon, color }: {
    label: string; score: number; icon: React.ElementType; color: string;
}) {
    const cls = score < 25 ? "Low" : score < 50 ? "Moderate" : score < 75 ? "High" : "Severe";
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon size={11} style={{ color }} />{label}
                </div>
                <span className="text-xs font-mono font-bold" style={{ color: RISK_CFG[cls as RiskClassification].color }}>{score}/100</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${score}%`, background: color }} />
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------
   Map placeholder (SVG proxy — no real map API needed)
------------------------------------------------------------------------- */

function MapProxy({ lat, lng, classification, name }: {
    lat: number; lng: number; classification: RiskClassification; name: string;
}) {
    const cfg = RISK_CFG[classification];
    // Normalize India bounding box approx 8–37°N, 68–97°E
    const px = Math.round(((lng - 68) / (97 - 68)) * 100);
    const py = Math.round(((37 - lat) / (37 - 8)) * 100);

    return (
        <div className="relative w-full h-52 rounded-xl overflow-hidden border border-border bg-gradient-to-br from-[hsl(210_40%_96%)] to-[hsl(200_50%_92%)]">
            {/* Grid lines to look like a map */}
            <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                {Array.from({ length: 8 }).map((_, i) => (
                    <line key={`v${i}`} x1={`${(i + 1) * 12.5}%`} y1="0" x2={`${(i + 1) * 12.5}%`} y2="100%" stroke="hsl(210 50% 60%)" strokeWidth="0.5" />
                ))}
                {Array.from({ length: 6 }).map((_, i) => (
                    <line key={`h${i}`} x1="0" y1={`${(i + 1) * 16.6}%`} x2="100%" y2={`${(i + 1) * 16.6}%`} stroke="hsl(210 50% 60%)" strokeWidth="0.5" />
                ))}
                {/* India silhouette hint — very rough polygon */}
                <polygon points="40,5 55,2 70,8 78,15 82,25 85,40 80,55 75,65 70,80 60,90 50,95 38,88 28,75 22,60 20,45 25,30 32,18"
                    fill="none" stroke="hsl(210 50% 60%)" strokeWidth="1.2" opacity="0.5" />
            </svg>

            {/* Hazard heatmap blobs */}
            {[
                { cx: px, cy: py, r: 22, opacity: 0.18 },
                { cx: px - 8, cy: py + 6, r: 14, opacity: 0.12 },
                { cx: px + 6, cy: py - 5, r: 10, opacity: 0.10 },
            ].map((b, i) => (
                <div key={i} className="absolute rounded-full transition-all"
                    style={{
                        left: `${b.cx}%`, top: `${b.cy}%`,
                        width: `${b.r * 2}px`, height: `${b.r * 2}px`,
                        transform: "translate(-50%,-50%)",
                        background: cfg.color,
                        opacity: b.opacity,
                        filter: "blur(8px)",
                    }} />
            ))}

            {/* Pin */}
            <div className="absolute z-10 flex flex-col items-center"
                style={{ left: `${px}%`, top: `${py}%`, transform: "translate(-50%,-100%)" }}>
                <div className="w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                    style={{ background: cfg.color }}>
                    <MapPin size={13} className="text-white" />
                </div>
                <div className="w-0.5 h-3 mt-0 bg-white/60" />
            </div>

            {/* Label */}
            <div className="absolute z-10 px-2 py-1 rounded-lg text-[10px] font-semibold shadow"
                style={{
                    left: `${Math.min(Math.max(px, 5), 75)}%`,
                    top: `${Math.min(Math.max(py - 18, 2), 80)}%`,
                    background: cfg.color, color: "white",
                    transform: "translateY(-100%) translateX(-50%)",
                    marginTop: "-24px",
                }}>
                {name.split(",")[0]}
            </div>

            {/* Coords */}
            <div className="absolute bottom-2 right-2 text-[9px] font-mono bg-white/70 rounded px-1.5 py-0.5 text-slate-600">
                {lat.toFixed(2)}°N {lng.toFixed(2)}°E
            </div>

            {/* Compass */}
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/70 flex items-center justify-center text-[9px] font-bold text-slate-600">N</div>

            {/* Risk overlay tag */}
            <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg text-[10px] font-bold shadow"
                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                {cfg.label}
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------
   Decision buttons
------------------------------------------------------------------------- */

function DecisionPanel({ suggestion, onDecide, decided }: {
    suggestion: ReturnType<typeof aiSuggestions>;
    onDecide: (d: Decision) => void;
    decided: Decision;
}) {
    const ACTIONS: Array<{
        id: Decision; label: string; icon: React.ElementType;
        style: string; desc: string;
    }> = [
            { id: "approve", label: "Approve", icon: CheckCircle, style: "bg-emerald-600 hover:bg-emerald-700 text-white", desc: "Approve without conditions" },
            { id: "approve_conditions", label: "Approve w/ Conditions", icon: Shield, style: "bg-amber-500 hover:bg-amber-600 text-white", desc: "Approve with safeguards" },
            { id: "escalate", label: "Escalate", icon: TrendingUp, style: "bg-orange-600 hover:bg-orange-700 text-white", desc: "Send to Credit Committee" },
            { id: "reject", label: "Decline", icon: XCircle, style: "bg-red-600 hover:bg-red-700 text-white", desc: "Decline application" },
        ];

    if (decided) {
        const a = ACTIONS.find(a => a.id === decided)!;
        const Icon = a.icon;
        return (
            <div className="rounded-xl border border-border p-4 flex items-center gap-3 bg-muted/30">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: decided === "approve" ? "hsl(142 60% 94%)" : decided === "reject" ? "hsl(0 75% 94%)" : "hsl(38 92% 94%)" }}>
                    <Icon size={18} style={{ color: decided === "approve" ? "hsl(142 69% 35%)" : decided === "reject" ? "hsl(0 75% 50%)" : "hsl(38 92% 42%)" }} />
                </div>
                <div>
                    <div className="font-semibold text-sm text-foreground">Decision recorded: <span className="capitalize">{a.label}</span></div>
                    <div className="text-xs text-muted-foreground">{new Date().toLocaleString("en-IN")}</div>
                </div>
                <button onClick={() => onDecide(null)} className="ml-auto text-xs text-muted-foreground hover:text-primary underline">Revise</button>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* AI suggestion banner */}
            <div className="rounded-xl border p-3 flex items-start gap-3"
                style={{
                    background: suggestion.verdict === "approve" ? "hsl(142 60% 95%)"
                        : suggestion.verdict === "escalate" || suggestion.verdict === "reject" ? "hsl(0 75% 95%)"
                            : "hsl(38 92% 95%)",
                    borderColor: suggestion.verdict === "approve" ? "hsl(142 60% 82%)"
                        : suggestion.verdict === "escalate" || suggestion.verdict === "reject" ? "hsl(0 65% 80%)"
                            : "hsl(38 80% 78%)",
                }}>
                <Zap size={14} className="flex-shrink-0 mt-0.5"
                    style={{ color: suggestion.verdict === "approve" ? "hsl(142 69% 35%)" : suggestion.verdict === "escalate" ? "hsl(22 90% 52%)" : "hsl(38 92% 42%)" }} />
                <div>
                    <div className="text-xs font-bold text-foreground">{suggestion.headline}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{suggestion.rationale}</div>
                </div>
            </div>

            {/* 4 action buttons */}
            <div className="grid grid-cols-2 gap-2">
                {ACTIONS.map(a => {
                    const Icon = a.icon;
                    const isAI = a.id === suggestion.verdict;
                    return (
                        <button key={a.id} onClick={() => onDecide(a.id)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm
                ${a.style} ${isAI ? "ring-2 ring-offset-1 ring-white/60 scale-105" : "opacity-80 hover:opacity-100"}`}>
                            <Icon size={14} className="flex-shrink-0" />
                            <span className="text-left leading-tight text-xs">{a.label}</span>
                            {isAI && <span className="ml-auto text-[9px] bg-white/25 rounded px-1 py-0.5">AI</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------
   Application queue row
------------------------------------------------------------------------- */

function QueueRow({ app, active, onClick }: {
    app: LoanApplication; active: boolean; onClick: () => void;
}) {
    return (
        <button onClick={onClick}
            className={`w-full text-left px-4 py-3 border-b border-border last:border-0 transition-colors flex items-start gap-3
        ${active ? "bg-primary/8 border-l-2 border-l-primary" : "hover:bg-muted/40"}`}>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">{app.id}</span>
                    {priorityBadge(app.priority)}
                </div>
                <div className="font-semibold text-sm text-foreground mt-0.5 truncate">{app.applicant}</div>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                    <MapPin size={9} />{app.property.split(",")[0]}
                </div>
            </div>
            <div className="flex-shrink-0 text-right">
                <div className="font-mono font-bold text-sm text-foreground">₹{app.amount}Cr</div>
                <div className="text-[10px] text-muted-foreground">{app.tenure}yr</div>
            </div>
            <ChevronRight size={13} className={`flex-shrink-0 mt-1 ${active ? "text-primary" : "text-muted-foreground"}`} />
        </button>
    );
}

/* -------------------------------------------------------------------------
   Main OfficersView
------------------------------------------------------------------------- */

export function OfficersView() {
    const [activeId, setActiveId] = useState<string>(QUEUE[0].id);
    const [decisions, setDecisions] = useState<Record<string, Decision>>({});
    const [search, setSearch] = useState("");

    const app = QUEUE.find(q => q.id === activeId)!;

    // Build a ClimateRiskReport from the engine functions
    const report = useMemo<ClimateRiskReport>(() => {
        const factors = calculateFactorScores(app.lat, app.lng, app.propertyType);
        const rawScore = factors.reduce((s, f) => s + f.weighted_score, 0);
        const score = Math.round(rawScore);
        const classification = classifyRisk(score);
        const projections = generateProjections(factors);
        const lending_adjustments = generateLendingAdjustments(score, classification, app.propertyType, factors);
        return {
            latitude: app.lat,
            longitude: app.lng,
            property_type: app.propertyType as ClimateRiskReport["property_type"],
            location_name: app.property,
            region: "",
            climate_risk_score: score,
            risk_classification: classification,
            confidence_level: 0.85,
            factors,
            projections,
            lending_adjustments,
            assessment_date: new Date().toISOString(),
            model_version: "v2.1.0-beta",
            data_vintage: "IMD 2023 · IPCC AR6 · CWMI",
        };
    }, [app]);

    const suggestion = useMemo(() => aiSuggestions(report, app), [report, app]);
    const cfg = RISK_CFG[report.risk_classification];
    const StatusIcon = cfg.icon;

    const filteredQueue = QUEUE.filter(q =>
        !search || q.applicant.toLowerCase().includes(search.toLowerCase())
        || q.id.toLowerCase().includes(search.toLowerCase())
        || q.property.toLowerCase().includes(search.toLowerCase())
    );

    const pending = QUEUE.filter(q => !decisions[q.id]).length;
    const approved = Object.values(decisions).filter(d => d === "approve" || d === "approve_conditions").length;
    const escalated = Object.values(decisions).filter(d => d === "escalate").length;

    return (
        <div className="max-w-[1400px] mx-auto pb-10 space-y-5">

            {/* ── Header ── */}
            <div className="rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="px-6 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    style={{ background: "linear-gradient(135deg, hsl(222 70% 14%) 0%, hsl(222 55% 22%) 55%, hsl(174 72% 20%) 100%)" }}>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "hsl(174 72% 60%)" }}>
                            Climate Credit Risk Engine · Officers Module
                        </div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <User className="w-6 h-6" style={{ color: "hsl(174 72% 60%)" }} />
                            Loan Review Dashboard
                        </h2>
                        <p className="text-sm mt-1.5 max-w-2xl" style={{ color: "hsl(210 30% 75%)" }}>
                            Review climate risk scores and AI-assisted recommendations before approving, conditioning, or escalating each application.
                        </p>
                    </div>
                    {/* Officer card */}
                    <div className="flex-shrink-0 flex items-center gap-3 bg-white/8 rounded-xl px-4 py-3 border border-white/10">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                            style={{ background: "hsl(174 72% 36%)" }}>
                            {OFFICER.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                            <div className="font-semibold text-white text-sm">{OFFICER.name}</div>
                            <div className="text-[11px] text-white/60">{OFFICER.grade}</div>
                            <div className="text-[10px] text-white/50 mt-0.5">{OFFICER.branch} · {OFFICER.id}</div>
                        </div>
                    </div>
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-4 divide-x divide-border bg-card">
                    {[
                        { label: "Today's Queue", value: QUEUE.length.toString(), icon: FileText, color: "hsl(210 80% 55%)" },
                        { label: "Pending Review", value: pending.toString(), icon: Clock, color: "hsl(38 92% 50%)" },
                        { label: "Approved Today", value: approved.toString(), icon: BadgeCheck, color: "hsl(142 69% 35%)" },
                        { label: "Escalated", value: escalated.toString(), icon: TrendingUp, color: "hsl(0 75% 50%)" },
                    ].map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <div key={i} className="px-5 py-4 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: `${s.color}1a` }}>
                                    <Icon size={15} style={{ color: s.color }} />
                                </div>
                                <div>
                                    <div className="text-lg font-bold font-mono text-foreground">{s.value}</div>
                                    <div className="text-[10px] text-muted-foreground">{s.label}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Main layout ── */}
            <div className="grid grid-cols-12 gap-5">

                {/* Left — Application queue */}
                <div className="col-span-12 lg:col-span-3 bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="px-4 py-3 border-b border-border bg-muted/20">
                        <div className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <BarChart3 size={14} className="text-primary" />
                            Application Queue
                            <span className="ml-auto text-[10px] bg-muted rounded-full px-2 py-0.5 text-muted-foreground">{filteredQueue.length}</span>
                        </div>
                        <div className="relative">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search applicants…"
                                className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background outline-none focus:ring-1 focus:ring-primary" />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {filteredQueue.map(q => (
                            <div key={q.id} className="relative">
                                <QueueRow app={q} active={q.id === activeId} onClick={() => setActiveId(q.id)} />
                                {decisions[q.id] && (
                                    <div className="absolute top-2 right-8 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                        style={{
                                            background: decisions[q.id] === "approve" || decisions[q.id] === "approve_conditions" ? "hsl(142 60% 94%)" : "hsl(38 92% 94%)",
                                            color: decisions[q.id] === "approve" || decisions[q.id] === "approve_conditions" ? "hsl(142 69% 35%)" : "hsl(38 92% 42%)",
                                        }}>
                                        {decisions[q.id] === "approve" ? "✓ Approved" : decisions[q.id] === "approve_conditions" ? "✓ Conditional" : decisions[q.id] === "escalate" ? "↑ Escalated" : "✕ Declined"}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {/* Progress bar */}
                    <div className="px-4 py-3 border-t border-border bg-muted/10">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>Officer quota</span>
                            <span className="font-mono">{OFFICER.done + Object.keys(decisions).length}/{OFFICER.quota}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all duration-500"
                                style={{ width: `${((OFFICER.done + Object.keys(decisions).length) / OFFICER.quota) * 100}%` }} />
                        </div>
                    </div>
                </div>

                {/* Right — Detail panel */}
                <div className="col-span-12 lg:col-span-9 space-y-4">

                    {/* Application meta */}
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono text-xs text-muted-foreground">{app.id}</span>
                                    {priorityBadge(app.priority)}
                                    {decisions[app.id] && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Decision Recorded</span>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-foreground">{app.applicant}</h3>
                                <div className="flex items-center gap-4 mt-1.5 flex-wrap text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><MapPin size={11} />{app.property}</span>
                                    <span className="flex items-center gap-1"><Building2 size={11} />{app.propertyType.replace("_", " ")}</span>
                                    <span className="flex items-center gap-1"><Landmark size={11} />{app.tenure} yr · {app.purpose}</span>
                                    <span className="flex items-center gap-1"><Clock size={11} />
                                        Submitted {new Date(app.submitted).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold font-mono text-foreground">₹{app.amount} Cr</div>
                                <div className="text-xs text-muted-foreground">Loan Amount Requested</div>
                            </div>
                        </div>
                    </div>

                    {/* 3-col detail grid */}
                    <div className="grid grid-cols-12 gap-4">

                        {/* Score + map — 5 cols */}
                        <div className="col-span-12 md:col-span-5 space-y-4">

                            {/* Score card */}
                            <div className="bg-card border border-border rounded-xl p-5 shadow-sm"
                                style={{ borderTopColor: cfg.color, borderTopWidth: "3px" }}>
                                <div className="flex items-center gap-2 mb-4">
                                    <StatusIcon size={15} style={{ color: cfg.color }} />
                                    <span className="font-semibold text-sm">Climate Risk Score</span>
                                    <span className="ml-auto text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5">
                                        IPCC AR6 · IMD
                                    </span>
                                </div>
                                <div className="flex items-center gap-6">
                                    <ScoreGauge score={report.climate_risk_score} classification={report.risk_classification} />
                                    <div className="flex-1 space-y-3">
                                        {report.factors.map((f, i) => {
                                            const meta = HAZARD_META.find(h => h.key === f.factor) ?? HAZARD_META[i % 4];
                                            return (
                                                <HazardBar key={f.factor}
                                                    label={meta.short}
                                                    score={f.score}
                                                    icon={meta.icon}
                                                    color={meta.color} />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Property map */}
                            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <MapPin size={14} className="text-primary" />
                                    <span className="font-semibold text-sm">Property Location</span>
                                </div>
                                <MapProxy lat={app.lat} lng={app.lng} classification={report.risk_classification} name={app.property} />
                            </div>
                        </div>

                        {/* AI suggestions + decision — 7 cols */}
                        <div className="col-span-12 md:col-span-7 space-y-4">

                            {/* AI Lending Conditions */}
                            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <Zap size={14} className="text-primary" />
                                    <span className="font-semibold text-sm">AI Lending Recommendations</span>
                                    <span className="ml-auto text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5 font-semibold">RBI CRF §4</span>
                                </div>

                                {/* Rate + LTV + Insurance */}
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    {[
                                        {
                                            label: "Rate Adjustment",
                                            value: suggestion.rateAdj === 0 ? "No change" : `+${suggestion.rateAdj} bps`,
                                            color: suggestion.rateAdj === 0 ? "hsl(142 69% 35%)" : suggestion.rateAdj > 50 ? "hsl(0 75% 50%)" : "hsl(38 92% 50%)",
                                            icon: TrendingUp,
                                        },
                                        {
                                            label: "Recommended LTV",
                                            value: `${suggestion.ltv}%`,
                                            color: suggestion.ltv >= 80 ? "hsl(142 69% 35%)" : suggestion.ltv >= 70 ? "hsl(38 92% 50%)" : "hsl(0 75% 50%)",
                                            icon: BarChart3,
                                        },
                                        {
                                            label: "Climate Insurance",
                                            value: suggestion.insuranceFlag ? "Required" : "Standard",
                                            color: suggestion.insuranceFlag ? "hsl(0 75% 50%)" : "hsl(142 69% 35%)",
                                            icon: Shield,
                                        },
                                    ].map((kpi, i) => {
                                        const Icon = kpi.icon;
                                        return (
                                            <div key={i} className="rounded-lg border border-border p-3">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <Icon size={11} style={{ color: kpi.color }} />
                                                    <span className="text-[10px] text-muted-foreground">{kpi.label}</span>
                                                </div>
                                                <div className="font-bold text-sm font-mono" style={{ color: kpi.color }}>{kpi.value}</div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Conditions list */}
                                <div className="space-y-2">
                                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                        Conditions ({suggestion.conditions.length})
                                    </div>
                                    {suggestion.conditions.map((c, i) => (
                                        <div key={i} className="flex items-start gap-2.5 text-xs">
                                            <ArrowRight size={11} className="flex-shrink-0 mt-0.5 text-primary" />
                                            <span className="text-foreground leading-snug">{c}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 20-yr Projection thumbnail */}
                            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <TrendingUp size={14} className="text-primary" />
                                    <span className="font-semibold text-sm">20-Year Risk Trajectory</span>
                                    <span className="ml-auto text-[10px] text-muted-foreground font-mono">SSP2-4.5</span>
                                </div>
                                {/* SVG mini chart */}
                                <svg viewBox="0 0 280 80" className="w-full" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <linearGradient id="proj-grad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={cfg.color} stopOpacity="0.25" />
                                            <stop offset="100%" stopColor={cfg.color} stopOpacity="0.02" />
                                        </linearGradient>
                                    </defs>
                                    {/* Grid */}
                                    {[0, 25, 50, 75].map(y => (
                                        <line key={y} x1="0" y1={80 - y} x2="280" y2={80 - y} stroke="hsl(var(--border))" strokeWidth="0.5" />
                                    ))}
                                    {/* Plot points from report projections */}
                                    {report.projections.length > 1 && (() => {
                                        const pts = report.projections.slice(0, 11); // up to 20 years biennial
                                        const xs = pts.map((_, i) => (i / (pts.length - 1)) * 270 + 5);
                                        const ys = pts.map(p => 78 - (p.composite_risk / 100) * 68);
                                        const path = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`).join(" ");
                                        const area = `${path} L ${xs[xs.length - 1]} 80 L ${xs[0]} 80 Z`;
                                        return (
                                            <>
                                                <path d={area} fill="url(#proj-grad)" />
                                                <path d={path} fill="none" stroke={cfg.color} strokeWidth="2" strokeLinejoin="round" />
                                                {/* Dots at milestone years */}
                                                {[0, 5, 10].map(idx => {
                                                    if (!pts[idx]) return null;
                                                    return <circle key={idx} cx={xs[idx]} cy={ys[idx]} r="3" fill={cfg.color} stroke="white" strokeWidth="1.5" />;
                                                })}
                                                {/* Threshold line at 75 */}
                                                <line x1="0" y1={78 - (75 / 100) * 68} x2="280" y2={78 - (75 / 100) * 68}
                                                    stroke="hsl(0 75% 50%)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
                                            </>
                                        );
                                    })()}
                                    {/* Year labels */}
                                    {[2026, 2031, 2036, 2041, 2046].map((yr, i) => (
                                        <text key={yr} x={5 + (i / 4) * 270} y={79} fontSize="7" fill="hsl(var(--muted-foreground))" textAnchor="middle">{yr}</text>
                                    ))}
                                </svg>
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2">
                                    <span>Start: <strong style={{ color: cfg.color }}>{report.climate_risk_score}</strong></span>
                                    <span>Projected end: <strong style={{ color: cfg.color }}>{report.projections[report.projections.length - 1]?.composite_risk?.toFixed(0) ?? "—"}</strong></span>
                                </div>
                            </div>

                            {/* Decision panel */}
                            <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <CircleDot size={14} className="text-primary" />
                                    <span className="font-semibold text-sm">Officer Decision</span>
                                    <span className="ml-auto text-[10px] text-muted-foreground">{OFFICER.name} · {new Date().toLocaleDateString("en-IN")}</span>
                                </div>
                                <DecisionPanel
                                    suggestion={suggestion}
                                    decided={decisions[app.id] ?? null}
                                    onDecide={d => {
                                        if (d === null) {
                                            setDecisions(prev => { const n = { ...prev }; delete n[app.id]; return n; });
                                        } else {
                                            setDecisions(prev => ({ ...prev, [app.id]: d }));
                                        }
                                    }}
                                />
                            </div>

                            {/* Compliance note */}
                            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/30 border border-border">
                                <Info size={12} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    All decisions are logged per <strong>RBI/2024-25/DOR/FINC/001</strong>. Severe-rated properties require Credit Committee escalation under RBI CRF §4.5.
                                    Climate score computed from IMD · IPCC AR6 SSP2-4.5 · CWMI · NATMO data.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
