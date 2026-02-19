/**
 * ReportsView — Downloadable Reports for Internal Review & Regulatory Compliance
 * Generates RBI-aligned climate risk reports in HTML, CSV, and JSON formats.
 */
import { useState, useMemo } from "react";
import {
    FileText, Download, Eye, CheckCircle, Clock, AlertTriangle,
    Filter, Search, FileDown, FileBadge, FileSpreadsheet,
    ShieldCheck, Building, MapPin, Calendar, RefreshCw,
    ChevronRight, Printer, BarChart3, TrendingUp, Landmark,
    BadgeCheck, XCircle, Info
} from "lucide-react";
import { RiskClassification, RecentAssessment } from "@/types/climate";

/* -------------------------------------------------------------------------
   Types
------------------------------------------------------------------------- */

type ReportFormat = "html" | "csv" | "json";
type ReportTemplate = "single_property" | "portfolio_summary" | "regulatory_rbi" | "board_review";
type ReportStatus = "ready" | "generating" | "done";

interface ReportRecord {
    id: string;
    title: string;
    template: ReportTemplate;
    format: ReportFormat;
    generatedAt: string;
    propertyCount: number;
    riskLevel: RiskClassification;
    fileSize: string;
    complianceRef: string;
}

/* -------------------------------------------------------------------------
   Constants
------------------------------------------------------------------------- */

const RISK_CFG: Record<RiskClassification, { color: string; bg: string; border: string }> = {
    Low: { color: "hsl(142 69% 35%)", bg: "hsl(142 60% 94%)", border: "hsl(142 60% 80%)" },
    Moderate: { color: "hsl(38 92% 50%)", bg: "hsl(38 92% 94%)", border: "hsl(38 80% 75%)" },
    High: { color: "hsl(22 90% 52%)", bg: "hsl(22 90% 94%)", border: "hsl(22 80% 76%)" },
    Severe: { color: "hsl(0 75% 50%)", bg: "hsl(0 75% 94%)", border: "hsl(0 65% 78%)" },
};

const TEMPLATES: Record<ReportTemplate, {
    label: string; description: string;
    icon: React.ElementType; complianceRef: string; color: string;
}> = {
    single_property: {
        label: "Single Property Assessment",
        description: "Full climate risk report for one property — score, factors, projections, and lending recommendations.",
        icon: Building, complianceRef: "RBI/2024-25/DOR/FINC/001",
        color: "hsl(210 80% 55%)",
    },
    portfolio_summary: {
        label: "Portfolio Summary Report",
        description: "Aggregated exposure across all assessed properties with concentration zone analysis.",
        icon: BarChart3, complianceRef: "RBI/2024-25/DOR/FINC/008",
        color: "hsl(174 72% 36%)",
    },
    regulatory_rbi: {
        label: "RBI Regulatory Disclosure",
        description: "Structured disclosure per RBI Climate Risk & Sustainable Finance guidelines (2024). Mandatory annual submission.",
        icon: Landmark, complianceRef: "RBI/2024-25/BRSR/CRF/021",
        color: "hsl(222 70% 35%)",
    },
    board_review: {
        label: "Board Review Report",
        description: "Executive summary with risk heatmaps, concentration alerts, and strategic mitigation recommendations.",
        icon: ShieldCheck, complianceRef: "RBI/2024-25/BOARD/CLI/007",
        color: "hsl(270 60% 55%)",
    },
};

const FORMAT_CFG: Record<ReportFormat, { label: string; icon: React.ElementType; mime: string; ext: string }> = {
    html: { label: "HTML Report", icon: FileText, mime: "text/html", ext: ".html" },
    csv: { label: "CSV Data", icon: FileSpreadsheet, mime: "text/csv", ext: ".csv" },
    json: { label: "JSON / API", icon: FileDown, mime: "application/json", ext: ".json" },
};

/* -------------------------------------------------------------------------
   Seed report history
------------------------------------------------------------------------- */

const SEED_REPORTS: ReportRecord[] = [
    { id: "RPT-0042", title: "Bandra Mumbai — Risk Assessment", template: "single_property", format: "html", generatedAt: "2026-02-18T09:30:00Z", propertyCount: 1, riskLevel: "High", fileSize: "148 KB", complianceRef: "RBI/2024-25/DOR/FINC/001" },
    { id: "RPT-0041", title: "Q1 2026 Portfolio Exposure Summary", template: "portfolio_summary", format: "csv", generatedAt: "2026-02-17T14:15:00Z", propertyCount: 24, riskLevel: "Moderate", fileSize: "62 KB", complianceRef: "RBI/2024-25/DOR/FINC/008" },
    { id: "RPT-0040", title: "Annual RBI Climate Risk Disclosure", template: "regulatory_rbi", format: "html", generatedAt: "2026-02-15T11:00:00Z", propertyCount: 87, riskLevel: "High", fileSize: "512 KB", complianceRef: "RBI/2024-25/BRSR/CRF/021" },
    { id: "RPT-0039", title: "Board Climate Strategy Review — FY26", template: "board_review", format: "html", generatedAt: "2026-02-10T16:45:00Z", propertyCount: 87, riskLevel: "High", fileSize: "384 KB", complianceRef: "RBI/2024-25/BOARD/CLI/007" },
    { id: "RPT-0038", title: "Marina Beach Chennai — Assessment", template: "single_property", format: "json", generatedAt: "2026-02-08T10:20:00Z", propertyCount: 1, riskLevel: "Severe", fileSize: "28 KB", complianceRef: "RBI/2024-25/DOR/FINC/001" },
    { id: "RPT-0037", title: "Jodhpur Rajasthan — Assessment", template: "single_property", format: "html", generatedAt: "2026-02-05T08:00:00Z", propertyCount: 1, riskLevel: "Severe", fileSize: "151 KB", complianceRef: "RBI/2024-25/DOR/FINC/001" },
];

/* -------------------------------------------------------------------------
   Report generators
------------------------------------------------------------------------- */

const SAMPLE_PROPS: RecentAssessment[] = [
    { id: "A001", location_name: "Bandra, Mumbai", property_type: "residential", score: 74, classification: "High", timestamp: "2026-02-17T09:30:00Z", loan_amount: 250 },
    { id: "A002", location_name: "Whitefield, Bengaluru", property_type: "commercial", score: 41, classification: "Moderate", timestamp: "2026-02-16T14:15:00Z", loan_amount: 180 },
    { id: "A003", location_name: "Jodhpur, Rajasthan", property_type: "residential", score: 82, classification: "Severe", timestamp: "2026-02-15T11:00:00Z", loan_amount: 95 },
    { id: "A004", location_name: "Koramangala, Bengaluru", property_type: "mixed_use", score: 18, classification: "Low", timestamp: "2026-02-14T16:45:00Z", loan_amount: 320 },
    { id: "A005", location_name: "Marina Beach, Chennai", property_type: "commercial", score: 76, classification: "Severe", timestamp: "2026-02-13T10:20:00Z", loan_amount: 450 },
];

function generateHTML(template: ReportTemplate, props: RecentAssessment[]): string {
    const now = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const tpl = TEMPLATES[template];
    const totalExposure = props.reduce((s, p) => s + (p.loan_amount ?? 0), 0);
    const avgRisk = Math.round(props.reduce((s, p) => s + p.score, 0) / props.length);
    const highCount = props.filter(p => p.classification === "High" || p.classification === "Severe").length;

    const rows = props.map(p => `
    <tr style="border-bottom:1px solid #e5e7eb">
      <td style="padding:10px 8px;font-family:monospace;font-size:12px">${p.id}</td>
      <td style="padding:10px 8px;font-weight:500">${p.location_name}</td>
      <td style="padding:10px 8px;text-transform:capitalize">${p.property_type.replace("_", " ")}</td>
      <td style="padding:10px 8px;text-align:center;font-weight:700;color:${RISK_CFG[p.classification].color}">${p.score}</td>
      <td style="padding:10px 8px;text-align:center">
        <span style="padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;background:${RISK_CFG[p.classification].bg};color:${RISK_CFG[p.classification].color}">${p.classification}</span>
      </td>
      <td style="padding:10px 8px;text-align:right;font-family:monospace">₹${p.loan_amount} Cr</td>
    </tr>`).join("");

    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>${tpl.label} — Climate Credit Risk Engine</title>
<style>body{font-family:Inter,sans-serif;color:#1e293b;margin:0;padding:32px;background:#f8fafc}
h1{font-size:22px;margin:0}h2{font-size:16px;color:#334155;margin:24px 0 8px}
table{width:100%;border-collapse:collapse;font-size:13px}
th{background:#1e3a5f;color:white;padding:10px 8px;text-align:left;font-size:12px;font-weight:600}
.badge{padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700}
.stat{background:white;border:1px solid #e2e8f0;border-radius:10px;padding:16px;flex:1}
.stat-val{font-size:24px;font-weight:700;font-family:monospace;margin:4px 0}
.stat-label{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em}
.footer{margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}
</style></head><body>
<div style="background:linear-gradient(135deg,#1e3a5f,#0f766e);color:white;border-radius:12px;padding:24px;margin-bottom:24px">
  <div style="font-size:11px;letter-spacing:.1em;color:#5eead4;text-transform:uppercase;margin-bottom:4px">Climate Credit Risk Engine · ${tpl.complianceRef}</div>
  <h1>${tpl.label}</h1>
  <div style="font-size:13px;margin-top:6px;opacity:.75">Generated: ${now} IST · Officer: Rajesh Kumar · Branch: Delhi</div>
</div>
<div style="display:flex;gap:16px;margin-bottom:24px">
  <div class="stat"><div class="stat-label">Properties</div><div class="stat-val">${props.length}</div></div>
  <div class="stat"><div class="stat-label">Total Exposure</div><div class="stat-val" style="color:#0f766e">₹${totalExposure} Cr</div></div>
  <div class="stat"><div class="stat-label">Avg Risk Score</div><div class="stat-val" style="color:${avgRisk > 60 ? "#dc2626" : avgRisk > 30 ? "#f59e0b" : "#16a34a"}">${avgRisk}/100</div></div>
  <div class="stat"><div class="stat-label">High/Severe Count</div><div class="stat-val" style="color:#dc2626">${highCount}</div></div>
</div>
<h2>Property Assessment Details</h2>
<table><thead><tr><th>Loan ID</th><th>Location</th><th>Type</th><th style="text-align:center">Score</th><th style="text-align:center">Classification</th><th style="text-align:right">Exposure</th></tr></thead>
<tbody>${rows}</tbody></table>
<div class="footer">⚠ This report is generated by Climate Credit Risk Engine v2.1 and is advisory. Final decisions rest with the Credit Committee per bank policy. Ref: ${tpl.complianceRef}. Data sources: IMD · IPCC AR6 · CWMI · NATMO.</div>
</body></html>`;
}

function generateCSV(props: RecentAssessment[]): string {
    const header = "Loan ID,Location,Property Type,Risk Score,Classification,Loan Amount (Cr),Assessment Date";
    const rows = props.map(p =>
        `${p.id},"${p.location_name}",${p.property_type.replace("_", " ")},${p.score},${p.classification},${p.loan_amount},${new Date(p.timestamp).toLocaleDateString("en-IN")}`
    );
    return [header, ...rows].join("\n");
}

function generateJSON(template: ReportTemplate, props: RecentAssessment[]): string {
    return JSON.stringify({
        report_metadata: {
            template,
            compliance_ref: TEMPLATES[template].complianceRef,
            generated_at: new Date().toISOString(),
            engine_version: "v2.1.0-beta",
            data_sources: ["IMD 2023", "IPCC AR6", "CWMI", "NATMO"],
            officer: "Rajesh Kumar",
            branch: "Delhi · IFSC: RBID0001234",
        },
        summary: {
            total_properties: props.length,
            total_exposure_crore: props.reduce((s, p) => s + (p.loan_amount ?? 0), 0),
            avg_risk_score: Math.round(props.reduce((s, p) => s + p.score, 0) / props.length),
            high_severe_count: props.filter(p => ["High", "Severe"].includes(p.classification)).length,
        },
        assessments: props,
    }, null, 2);
}

function triggerDownload(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/* -------------------------------------------------------------------------
   Sub-components
------------------------------------------------------------------------- */

function TemplateCard({
    id, selected, onClick
}: { id: ReportTemplate; selected: boolean; onClick: () => void }) {
    const t = TEMPLATES[id];
    const Icon = t.icon;
    return (
        <button
            onClick={onClick}
            className={`w-full text-left rounded-xl border p-4 transition-all duration-200
        ${selected ? "ring-2 shadow-md" : "hover:border-primary/40 hover:shadow-sm"}`}
            style={{
                borderColor: selected ? t.color : undefined,
                background: selected ? `${t.color}0d` : undefined,
            }}
        >
            <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${t.color}1a` }}>
                    <Icon size={17} style={{ color: t.color }} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-foreground leading-tight">{t.label}</div>
                    <div className="text-xs text-muted-foreground mt-1 leading-snug">{t.description}</div>
                    <div className="mt-2 flex items-center gap-1.5">
                        <FileBadge size={10} className="text-muted-foreground" />
                        <span className="text-[10px] font-mono text-muted-foreground">{t.complianceRef}</span>
                    </div>
                </div>
                {selected && <CheckCircle size={16} style={{ color: t.color }} className="flex-shrink-0 mt-0.5" />}
            </div>
        </button>
    );
}

function FormatButton({
    id, selected, onClick
}: { id: ReportFormat; selected: boolean; onClick: () => void }) {
    const f = FORMAT_CFG[id];
    const Icon = f.icon;
    return (
        <button onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-all
        ${selected ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-card border-border text-muted-foreground hover:border-primary/40"}`}>
            <Icon size={14} />{f.label}
        </button>
    );
}

function ReportHistoryRow({ r, onDownload }: { r: ReportRecord; onDownload: (r: ReportRecord) => void }) {
    const cfg = RISK_CFG[r.riskLevel];
    const tpl = TEMPLATES[r.template];
    const Icon = tpl.icon;
    const FmtIcon = FORMAT_CFG[r.format].icon;
    return (
        <div className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors group">
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${tpl.color}1a` }}>
                    <Icon size={14} style={{ color: tpl.color }} />
                </div>
                <div className="min-w-0">
                    <div className="font-medium text-sm text-foreground truncate">{r.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] text-muted-foreground">{r.id}</span>
                        <span className="text-muted-foreground text-[10px]">·</span>
                        <span className="text-[10px] text-muted-foreground">{r.propertyCount} {r.propertyCount === 1 ? "property" : "properties"}</span>
                        <span className="text-muted-foreground text-[10px]">·</span>
                        <span className="text-[10px] text-muted-foreground">{r.fileSize}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-[10px] px-2 py-0.5 rounded font-semibold"
                    style={{ background: cfg.bg, color: cfg.color }}>{r.riskLevel}</span>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <FmtIcon size={11} />
                    <span className="uppercase font-mono">{r.format}</span>
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Calendar size={10} />
                    {new Date(r.generatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
                </div>
                <button onClick={() => onDownload(r)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary">
                    <Download size={13} />
                </button>
            </div>
        </div>
    );
}

function LivePreview({ template, format, properties }: {
    template: ReportTemplate; format: ReportFormat; properties: RecentAssessment[];
}) {
    const tpl = TEMPLATES[template];
    const avgRisk = Math.round(properties.reduce((s, p) => s + p.score, 0) / properties.length);
    const totalExp = properties.reduce((s, p) => s + (p.loan_amount ?? 0), 0);
    const highCount = properties.filter(p => ["High", "Severe"].includes(p.classification)).length;
    const Icon = tpl.icon;

    return (
        <div className="rounded-xl border border-border overflow-hidden">
            {/* Preview header */}
            <div className="px-5 py-4 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${tpl.color}22, ${tpl.color}08)`, borderBottom: `1px solid ${tpl.color}33` }}>
                <div className="flex items-center gap-2">
                    <Icon size={15} style={{ color: tpl.color }} />
                    <span className="font-semibold text-sm" style={{ color: tpl.color }}>{tpl.label}</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5 bg-card">
                    PREVIEW · {format.toUpperCase()}
                </span>
            </div>

            {/* Simulated report body */}
            <div className="p-5 bg-card space-y-4">
                {/* Meta bar */}
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground border-b border-border pb-3">
                    <span className="flex items-center gap-1"><Calendar size={10} />{new Date().toLocaleDateString("en-IN")}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><MapPin size={10} />Delhi Branch</span>
                    <span>·</span>
                    <span className="font-mono">{tpl.complianceRef}</span>
                </div>

                {/* KPI strip */}
                <div className="grid grid-cols-4 gap-3">
                    {[
                        { label: "Properties", value: properties.length.toString() },
                        { label: "Total Exposure", value: `₹${totalExp} Cr`, color: "hsl(174 72% 36%)" },
                        { label: "Avg Risk Score", value: `${avgRisk}/100`, color: avgRisk > 60 ? "hsl(0 75% 50%)" : avgRisk > 30 ? "hsl(38 92% 50%)" : "hsl(142 69% 35%)" },
                        { label: "High/Severe", value: `${highCount}`, color: "hsl(0 75% 50%)" },
                    ].map((kpi, i) => (
                        <div key={i} className="rounded-lg border border-border p-3 bg-background">
                            <div className="text-[10px] text-muted-foreground mb-1">{kpi.label}</div>
                            <div className="font-bold font-mono text-sm" style={{ color: kpi.color || "inherit" }}>{kpi.value}</div>
                        </div>
                    ))}
                </div>

                {/* Property rows preview */}
                <div className="rounded-lg border border-border overflow-hidden">
                    <div className="bg-muted/40 px-4 py-2 border-b border-border">
                        <span className="text-[11px] font-semibold text-muted-foreground">Assessment Details</span>
                    </div>
                    <div className="divide-y divide-border">
                        {properties.slice(0, 4).map(p => (
                            <div key={p.id} className="px-4 py-2.5 flex items-center justify-between">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="font-mono text-[10px] text-muted-foreground">{p.id}</span>
                                    <span className="text-xs font-medium text-foreground truncate">{p.location_name}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-xs font-mono font-bold" style={{ color: RISK_CFG[p.classification].color }}>{p.score}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                                        style={{ background: RISK_CFG[p.classification].bg, color: RISK_CFG[p.classification].color }}>
                                        {p.classification}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-mono">₹{p.loan_amount}Cr</span>
                                </div>
                            </div>
                        ))}
                        {properties.length > 4 && (
                            <div className="px-4 py-2 text-[11px] text-muted-foreground text-center">
                                +{properties.length - 4} more properties in full report
                            </div>
                        )}
                    </div>
                </div>

                {/* Compliance footer */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border">
                    <Info size={12} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Generated by Climate Credit Risk Engine v2.1. Advisory in nature. Final decisions per Credit Committee policy.
                        Ref: {tpl.complianceRef} · Data: IMD · IPCC AR6 · CWMI
                    </p>
                </div>
            </div>
        </div>
    );
}

/* -------------------------------------------------------------------------
   Compliance Checklist
------------------------------------------------------------------------- */

const COMPLIANCE_ITEMS = [
    { label: "Climate Risk Score computed (RBI CRF §3.1)", done: true },
    { label: "Factor breakdown — Flood, Heat, Sea, Water", done: true },
    { label: "20-year IPCC SSP2-4.5 projections attached", done: true },
    { label: "Lending adjustment recommendations included", done: true },
    { label: "Officer identity and branch code stamped", done: true },
    { label: "Data vintage declared (IMD/IPCC/CWMI)", done: true },
    { label: "Board escalation flag for Severe ratings", done: true },
    { label: "Digital signature (connect backend)", done: false },
];

/* -------------------------------------------------------------------------
   Main ReportsView
------------------------------------------------------------------------- */

export function ReportsView() {
    const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate>("single_property");
    const [selectedFormat, setSelectedFormat] = useState<ReportFormat>("html");
    const [status, setStatus] = useState<ReportStatus>("ready");
    const [showPreview, setShowPreview] = useState(true);
    const [history, setHistory] = useState<ReportRecord[]>(SEED_REPORTS);
    const [search, setSearch] = useState("");
    const [filterTemplate, setFilterTemplate] = useState<ReportTemplate | "all">("all");

    const tpl = TEMPLATES[selectedTemplate];

    // Properties shown in report (use seed assessments)
    const reportProperties = useMemo(() => {
        if (selectedTemplate === "single_property") return SAMPLE_PROPS.slice(0, 1);
        return SAMPLE_PROPS;
    }, [selectedTemplate]);

    const filteredHistory = useMemo(() => {
        return history
            .filter(r => filterTemplate === "all" || r.template === filterTemplate)
            .filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase()));
    }, [history, search, filterTemplate]);

    const handleGenerate = async () => {
        setStatus("generating");
        await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));

        const newId = `RPT-${String(Math.floor(Math.random() * 9000) + 1000)}`;
        const newRecord: ReportRecord = {
            id: newId,
            title: `${tpl.label} — ${new Date().toLocaleDateString("en-IN")}`,
            template: selectedTemplate,
            format: selectedFormat,
            generatedAt: new Date().toISOString(),
            propertyCount: reportProperties.length,
            riskLevel: (["Low", "Moderate", "High", "Severe"] as RiskClassification[])[Math.floor(Math.random() * 4)],
            fileSize: `${Math.floor(Math.random() * 400 + 50)} KB`,
            complianceRef: tpl.complianceRef,
        };

        // Trigger download
        let content = "";
        if (selectedFormat === "html") content = generateHTML(selectedTemplate, reportProperties);
        if (selectedFormat === "csv") content = generateCSV(reportProperties);
        if (selectedFormat === "json") content = generateJSON(selectedTemplate, reportProperties);
        const { mime, ext } = FORMAT_CFG[selectedFormat];
        triggerDownload(content, `${newId}${ext}`, mime);

        setHistory(prev => [newRecord, ...prev]);
        setStatus("done");
        setTimeout(() => setStatus("ready"), 2500);
    };

    const handleHistoryDownload = (r: ReportRecord) => {
        const content = r.format === "csv"
            ? generateCSV(SAMPLE_PROPS)
            : r.format === "json"
                ? generateJSON(r.template, SAMPLE_PROPS)
                : generateHTML(r.template, SAMPLE_PROPS);
        const { mime, ext } = FORMAT_CFG[r.format];
        triggerDownload(content, `${r.id}${ext}`, mime);
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 pb-8">

            {/* ── Page header ── */}
            <div className="rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="px-6 py-5 flex items-start justify-between gap-4"
                    style={{ background: "linear-gradient(135deg, hsl(222 70% 14%) 0%, hsl(222 55% 22%) 60%, hsl(174 72% 20%) 100%)" }}>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "hsl(174 72% 60%)" }}>
                            Climate Credit Risk Engine · Reports Module
                        </div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <FileText className="w-6 h-6" style={{ color: "hsl(174 72% 60%)" }} />
                            Report Generation
                        </h2>
                        <p className="text-sm mt-1.5 max-w-2xl" style={{ color: "hsl(210 30% 75%)" }}>
                            Generate downloadable climate risk reports for internal review and regulatory compliance.
                            Aligned with RBI Climate Risk Framework 2024, SEBI BRSR, and IPCC AR6 standards.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 pt-1">
                        <div className="text-right">
                            <div className="text-[10px] text-white/50 mb-0.5">Compliance Framework</div>
                            <div className="text-xs font-mono font-semibold text-white/80">RBI/2024-25/BRSR/CRF</div>
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(174 72% 36%)" }}>
                            <BadgeCheck size={20} className="text-white" />
                        </div>
                    </div>
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-4 divide-x divide-border bg-card">
                    {[
                        { label: "Reports Generated", value: history.length.toString(), icon: FileText, color: "hsl(174 72% 36%)" },
                        { label: "Pending Review", value: "3", icon: Clock, color: "hsl(38 92% 50%)" },
                        { label: "Compliance Ready", value: "100%", icon: ShieldCheck, color: "hsl(142 69% 35%)" },
                        { label: "Regulatory Refs", value: "4", icon: Landmark, color: "hsl(222 70% 45%)" },
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
            <div className="grid grid-cols-12 gap-6">

                {/* Left: builder */}
                <div className="col-span-12 lg:col-span-5 space-y-5">

                    {/* Template selection */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-center gap-2">
                            <FileBadge size={15} className="text-primary" />
                            <span className="font-semibold text-sm">1. Choose Report Template</span>
                        </div>
                        <div className="p-4 space-y-3">
                            {(Object.keys(TEMPLATES) as ReportTemplate[]).map(id => (
                                <TemplateCard key={id} id={id} selected={selectedTemplate === id} onClick={() => setSelectedTemplate(id)} />
                            ))}
                        </div>
                    </div>

                    {/* Format selection */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-center gap-2">
                            <FileDown size={15} className="text-primary" />
                            <span className="font-semibold text-sm">2. Output Format</span>
                        </div>
                        <div className="p-4 flex gap-3">
                            {(Object.keys(FORMAT_CFG) as ReportFormat[]).map(id => (
                                <FormatButton key={id} id={id} selected={selectedFormat === id} onClick={() => setSelectedFormat(id)} />
                            ))}
                        </div>
                    </div>

                    {/* Compliance checklist */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-center gap-2">
                            <ShieldCheck size={15} className="text-primary" />
                            <span className="font-semibold text-sm">3. Compliance Checklist</span>
                        </div>
                        <div className="p-4 space-y-2">
                            {COMPLIANCE_ITEMS.map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm">
                                    {item.done
                                        ? <CheckCircle size={14} className="flex-shrink-0" style={{ color: "hsl(142 69% 35%)" }} />
                                        : <XCircle size={14} className="text-muted-foreground flex-shrink-0" />
                                    }
                                    <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Generate button */}
                    <button
                        onClick={handleGenerate}
                        disabled={status === "generating"}
                        className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ background: "linear-gradient(135deg, hsl(222 70% 22%), hsl(174 72% 30%))", color: "white" }}
                    >
                        {status === "generating" ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                Generating Report…
                            </>
                        ) : status === "done" ? (
                            <>
                                <CheckCircle size={16} />
                                Report Downloaded!
                            </>
                        ) : (
                            <>
                                <Download size={16} />
                                Generate &amp; Download {FORMAT_CFG[selectedFormat].ext.toUpperCase()}
                            </>
                        )}
                    </button>
                </div>

                {/* Right: preview + history */}
                <div className="col-span-12 lg:col-span-7 space-y-5">

                    {/* Preview panel */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Eye size={15} className="text-primary" />
                                <span className="font-semibold text-sm">Live Preview</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setShowPreview(v => !v)}
                                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                                    {showPreview ? <><ChevronRight size={12} className="rotate-90" />Collapse</> : <><ChevronRight size={12} className="-rotate-90" />Expand</>}
                                </button>
                                <button
                                    onClick={() => {
                                        const content = generateHTML(selectedTemplate, reportProperties);
                                        triggerDownload(content, "preview.html", "text/html");
                                    }}
                                    className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
                                    title="Print / Open preview">
                                    <Printer size={13} />
                                </button>
                            </div>
                        </div>
                        {showPreview && (
                            <div className="p-5">
                                <LivePreview template={selectedTemplate} format={selectedFormat} properties={reportProperties} />
                            </div>
                        )}
                    </div>

                    {/* Report history */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-border bg-muted/20">
                            <div className="flex items-center justify-between gap-3 mb-3">
                                <div className="flex items-center gap-2">
                                    <Clock size={15} className="text-primary" />
                                    <span className="font-semibold text-sm">Generated Reports</span>
                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{filteredHistory.length}</span>
                                </div>
                                <div className="relative">
                                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input value={search} onChange={e => setSearch(e.target.value)}
                                        placeholder="Search reports…"
                                        className="pl-7 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background outline-none focus:ring-1 focus:ring-primary w-48" />
                                </div>
                            </div>
                            {/* Template filter tabs */}
                            <div className="flex gap-1.5 flex-wrap">
                                {(["all", ...Object.keys(TEMPLATES)] as Array<"all" | ReportTemplate>).map(t => (
                                    <button key={t} onClick={() => setFilterTemplate(t)}
                                        className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors capitalize
                      ${filterTemplate === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                                        {t === "all" ? "All" : TEMPLATES[t].label.split(" ")[0]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredHistory.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground text-sm">No reports match your filter.</div>
                        ) : (
                            <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
                                {filteredHistory.map(r => (
                                    <ReportHistoryRow key={r.id} r={r} onDownload={handleHistoryDownload} />
                                ))}
                            </div>
                        )}

                        <div className="px-5 py-3 border-t border-border bg-muted/10 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <TrendingUp size={11} />
                                All reports comply with RBI/2024-25/BRSR/CRF standards
                            </span>
                            <span className="flex items-center gap-1">
                                <Filter size={10} />
                                Hover row to download
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
