/**
 * SettingsView — Enterprise Settings for Climate Credit Risk Engine
 * Bank-grade configuration: RBAC, risk thresholds, compliance, AI calibration,
 * data sources, alerts, audit logs, privacy, and disaster scenario simulations.
 */
import { useState, useRef } from "react";
import {
    Shield, Users, Sliders, Globe, Brain, Bell, ClipboardList,
    Lock, Zap, ChevronRight, CheckCircle, AlertTriangle, Info,
    Save, RefreshCw, ToggleLeft, ToggleRight, Plus, Trash2,
    Eye, EyeOff, Download, Upload, DatabaseZap, Landmark,
    Network, SlidersHorizontal, ShieldAlert, Key, Server,
    Activity, BarChart3, Leaf, BookOpen, Settings,
} from "lucide-react";

/* -------------------------------------------------------------------------
   Types
------------------------------------------------------------------------- */

type SettingSection =
    | "rbac" | "thresholds" | "compliance" | "datasources"
    | "ai_model" | "scoring" | "alerts" | "audit" | "privacy" | "simulation";

interface RoleRow { id: string; name: string; permissions: string[]; color: string; count: number }
interface DataSourceRow { id: string; name: string; type: string; status: "active" | "inactive" | "error"; latency: string; lastSync: string; coverage: string }
interface AuditRow { id: string; user: string; action: string; resource: string; ts: string; ip: string; result: "success" | "fail" }

/* -------------------------------------------------------------------------
   Static seed data
------------------------------------------------------------------------- */

const ROLES: RoleRow[] = [
    { id: "admin", name: "System Administrator", permissions: ["All"], color: "hsl(222 70% 45%)", count: 2 },
    { id: "cro", name: "Chief Risk Officer", permissions: ["View All", "Override Thresholds", "Export Reports"], color: "hsl(0 75% 50%)", count: 3 },
    { id: "officer", name: "Loan Officer", permissions: ["Assess Property", "View Own Reports", "File Loans"], color: "hsl(38 92% 50%)", count: 24 },
    { id: "analyst", name: "Climate Analyst", permissions: ["Run Models", "Edit Data Sources", "View All"], color: "hsl(174 72% 36%)", count: 7 },
    { id: "auditor", name: "Compliance Auditor", permissions: ["View Audit Logs", "Export Compliance", "Read-Only"], color: "hsl(270 60% 55%)", count: 4 },
    { id: "readonly", name: "Branch Viewer", permissions: ["View Dashboard", "View Reports"], color: "hsl(210 30% 60%)", count: 51 },
];

const DATA_SOURCES: DataSourceRow[] = [
    { id: "imd", name: "IMD Gridded Rainfall API", type: "Meteorological", status: "active", latency: "142 ms", lastSync: "2 min ago", coverage: "Pan-India 1km² grid" },
    { id: "ipcc", name: "IPCC AR6 Projection Dataset", type: "Climate Model", status: "active", latency: "—", lastSync: "Daily", coverage: "Global SSP1/2/5" },
    { id: "natmo", name: "NATMO Flood Hazard Atlas", type: "Geospatial", status: "active", latency: "88 ms", lastSync: "5 min ago", coverage: "District-level" },
    { id: "cwmi", name: "CWMI Water Stress Index", type: "Hydrology", status: "active", latency: "210 ms", lastSync: "1 hr ago", coverage: "State-level" },
    { id: "sentinel", "name": "Sentinel-2 SAR Imagery", type: "Satellite", status: "active", latency: "1.2 s", lastSync: "6 hr ago", coverage: "10m resolution" },
    { id: "sebi", name: "SEBI BRSR Regulatory Feed", type: "Regulatory", status: "inactive", latency: "—", lastSync: "Manual", coverage: "Listed entities" },
    { id: "cgwb", name: "CGWB Groundwater Atlas", type: "Hydrology", status: "error", latency: "err", lastSync: "Failed", coverage: "District-level" },
];

const AUDIT_LOG: AuditRow[] = [
    { id: "AL-9041", user: "Rajesh Kumar", action: "Threshold Override", resource: "Flood Risk · Zone MUM-001", ts: "12:01 IST", ip: "10.0.4.21", result: "success" },
    { id: "AL-9040", user: "Aditi Singh", action: "Report Export", resource: "RPT-0042 · PDF", ts: "11:58 IST", ip: "10.0.4.34", result: "success" },
    { id: "AL-9039", user: "Meera Iyer", action: "AI Model Recalibration", resource: "SSP2-4.5 Weights", ts: "11:45 IST", ip: "10.0.2.88", result: "success" },
    { id: "AL-9038", user: "Unknown", action: "Login Attempt", resource: "admin@climaterisk.in", ts: "11:30 IST", ip: "182.73.1.4", result: "fail" },
    { id: "AL-9037", user: "Priya Nair", action: "Data Source Toggle", resource: "CGWB Groundwater Atlas", ts: "11:20 IST", ip: "10.0.4.55", result: "success" },
    { id: "AL-9036", user: "Rajesh Kumar", action: "Role Assignment", resource: "User: vikram.rao@bank.in", ts: "10:50 IST", ip: "10.0.4.21", result: "success" },
    { id: "AL-9035", user: "System", action: "Scheduled Model Rebuild", "resource": "Full Portfolio Re-score", ts: "06:00 IST", ip: "internal", result: "success" },
];

/* -------------------------------------------------------------------------
   Nav config
------------------------------------------------------------------------- */

const SECTIONS: Array<{ id: SettingSection; label: string; icon: React.ElementType; badge?: string }> = [
    { id: "rbac", label: "Access Control", icon: Users, badge: "RBAC" },
    { id: "thresholds", label: "Risk Thresholds", icon: Sliders, badge: "Core" },
    { id: "compliance", label: "Regulatory Compliance", icon: Landmark, badge: "RBI · ESG" },
    { id: "datasources", label: "Data Sources", icon: DatabaseZap, badge: "7 APIs" },
    { id: "ai_model", label: "AI Model Calibration", icon: Brain, badge: "ML" },
    { id: "scoring", label: "Scoring Customization", icon: SlidersHorizontal },
    { id: "alerts", label: "Alerts & Notifications", icon: Bell },
    { id: "audit", label: "Audit Logs", icon: ClipboardList, badge: "Compliance" },
    { id: "privacy", label: "Privacy & Encryption", icon: Lock, badge: "AES-256" },
    { id: "simulation", label: "Disaster Simulations", icon: Zap, badge: "Stress Test" },
];

/* -------------------------------------------------------------------------
   Reusable primitives
------------------------------------------------------------------------- */

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
    const Icon = on ? ToggleRight : ToggleLeft;
    return (
        <button onClick={() => onChange(!on)}
            className="flex items-center gap-2 group"
            aria-pressed={on}>
            <Icon size={26} className="transition-colors" style={{ color: on ? "hsl(174 72% 36%)" : "hsl(var(--muted-foreground))" }} />
            {label && <span className="text-sm" style={{ color: on ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}>{label}</span>}
        </button>
    );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-6 py-4 border-b border-border last:border-0">
            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">{label}</div>
                {desc && <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</div>}
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">{children}</div>
        </div>
    );
}

function SectionCard({ title, icon: Icon, color = "hsl(var(--primary))", children }: {
    title: string; icon: React.ElementType; color?: string; children: React.ReactNode;
}) {
    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}18` }}>
                    <Icon size={16} style={{ color }} />
                </div>
                <span className="font-semibold text-sm">{title}</span>
            </div>
            <div className="px-5 py-1">{children}</div>
        </div>
    );
}

function SliderInput({ label, value, min, max, step = 1, unit = "", onChange, color }: {
    label: string; value: number; min: number; max: number;
    step?: number; unit?: string; color?: string;
    onChange: (v: number) => void;
}) {
    return (
        <div>
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-mono font-bold" style={{ color: color || "hsl(var(--foreground))" }}>{value}{unit}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: color || "hsl(var(--primary))" }} />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                <span>{min}{unit}</span><span>{max}{unit}</span>
            </div>
        </div>
    );
}

function StatusDot({ status }: { status: "active" | "inactive" | "error" }) {
    const cfg = {
        active: { color: "hsl(142 69% 35%)", label: "Active" },
        inactive: { color: "hsl(210 30% 60%)", label: "Inactive" },
        error: { color: "hsl(0 75% 50%)", label: "Error" },
    }[status];
    return (
        <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: cfg.color }} />
            <span className="text-[11px] font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
        </div>
    );
}

function SaveBar({ dirty, onSave, onReset }: { dirty: boolean; onSave: () => void; onReset: () => void }) {
    if (!dirty) return null;
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border border-primary/30 bg-card">
            <AlertTriangle size={14} className="text-amber-500" />
            <span className="text-sm font-medium text-foreground">You have unsaved changes</span>
            <button onClick={onReset} className="text-sm text-muted-foreground hover:text-foreground underline">Reset</button>
            <button onClick={onSave}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold text-white shadow-sm"
                style={{ background: "hsl(174 72% 30%)" }}>
                <Save size={13} /> Save Changes
            </button>
        </div>
    );
}

/* -------------------------------------------------------------------------
   Section panels
------------------------------------------------------------------------- */

function RBACSection() {
    return (
        <div className="space-y-5">
            <SectionCard title="Role-Based Access Control" icon={Users} color="hsl(222 70% 45%)">
                <div className="py-1">
                    {ROLES.map(r => (
                        <div key={r.id} className="flex items-center justify-between gap-4 py-3.5 border-b border-border last:border-0">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                    style={{ background: r.color }}>
                                    {r.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-semibold text-sm text-foreground">{r.name}</div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {r.permissions.map(p => (
                                            <span key={p} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{p}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-[11px] text-muted-foreground font-mono">{r.count} users</span>
                                <button className="text-xs text-primary hover:underline">Edit</button>
                            </div>
                        </div>
                    ))}

                    <div className="pt-4 pb-2">
                        <button className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline">
                            <Plus size={13} /> Add Custom Role
                        </button>
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Session & Authentication Policy" icon={Key} color="hsl(222 70% 45%)">
                <SettingRow label="Session Timeout" desc="Automatically log out idle sessions. Recommended: 30 min for high-security deployments.">
                    <select className="text-xs border border-input rounded-lg px-2 py-1 bg-background text-foreground">
                        <option>15 minutes</option>
                        <option selected>30 minutes</option>
                        <option>60 minutes</option>
                    </select>
                </SettingRow>
                <SettingRow label="Multi-Factor Authentication (MFA)" desc="Required for CRO, Admin, and Compliance Auditor roles per RBI IT guidelines.">
                    <Toggle on={true} onChange={() => { }} />
                </SettingRow>
                <SettingRow label="IP Allowlisting" desc="Restrict access to approved branch network CIDRs only.">
                    <Toggle on={true} onChange={() => { }} />
                </SettingRow>
                <SettingRow label="Single Sign-On (SSO / SAML 2.0)" desc="Integrate with bank's Active Directory via SAML 2.0 or OAuth 2.0.">
                    <Toggle on={false} onChange={() => { }} />
                </SettingRow>
            </SectionCard>
        </div>
    );
}

function ThresholdsSection({ dirty, setDirty }: { dirty: boolean; setDirty: (v: boolean) => void }) {
    const [thresholds, setThresholds] = useState({
        low_max: 25, moderate_max: 50, high_max: 75,
        flood_weight: 35, sea_weight: 25, heat_weight: 25, water_weight: 15,
        ltv_high: 70, ltv_severe: 60, rate_adj_per_unit: 1.2,
    });

    const update = (key: keyof typeof thresholds, val: number) => {
        setThresholds(p => ({ ...p, [key]: val }));
        setDirty(true);
    };

    return (
        <div className="space-y-5">
            <SectionCard title="Risk Classification Thresholds" icon={Sliders} color="hsl(22 90% 52%)">
                <div className="py-4 space-y-5">
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { key: "low_max" as const, label: "Low → Moderate boundary", color: "hsl(142 69% 38%)" },
                            { key: "moderate_max" as const, label: "Moderate → High boundary", color: "hsl(38 92% 50%)" },
                            { key: "high_max" as const, label: "High → Severe boundary", color: "hsl(0 75% 50%)" },
                        ].map(t => (
                            <SliderInput key={t.key} label={t.label} value={thresholds[t.key]}
                                min={10} max={90} color={t.color} onChange={v => update(t.key, v)} />
                        ))}
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border text-[11px] text-muted-foreground">
                        <Info size={12} className="flex-shrink-0" />
                        Thresholds cascade: Low ≤ {thresholds.low_max} · Moderate ≤ {thresholds.moderate_max} · High ≤ {thresholds.high_max} · Severe &gt; {thresholds.high_max}.
                        Changing thresholds triggers an automatic portfolio re-score during next nightly batch.
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Hazard Factor Weights" icon={SlidersHorizontal} color="hsl(22 90% 52%)">
                <div className="py-4 space-y-5">
                    <div className="grid grid-cols-2 gap-6">
                        {[
                            { key: "flood_weight" as const, label: "Flood Probability", color: "hsl(210 80% 55%)" },
                            { key: "sea_weight" as const, label: "Sea-Level Rise Exposure", color: "hsl(200 75% 45%)" },
                            { key: "heat_weight" as const, label: "Heat Stress Index", color: "hsl(22 90% 52%)" },
                            { key: "water_weight" as const, label: "Water Scarcity Projection", color: "hsl(270 60% 55%)" },
                        ].map(w => (
                            <SliderInput key={w.key} label={w.label} value={thresholds[w.key]}
                                min={5} max={60} unit="%" color={w.color} onChange={v => update(w.key, v)} />
                        ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 border border-border">
                        <span>Current total weight</span>
                        <span className={`font-mono font-bold ${thresholds.flood_weight + thresholds.sea_weight + thresholds.heat_weight + thresholds.water_weight === 100
                                ? "text-emerald-600" : "text-red-500"}`}>
                            {thresholds.flood_weight + thresholds.sea_weight + thresholds.heat_weight + thresholds.water_weight}%
                            {thresholds.flood_weight + thresholds.sea_weight + thresholds.heat_weight + thresholds.water_weight !== 100 && " ⚠ Must equal 100%"}
                        </span>
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Lending Parameters" icon={BarChart3} color="hsl(22 90% 52%)">
                <div className="py-4 space-y-5">
                    <SliderInput label="LTV cap for High-risk loans" value={thresholds.ltv_high}
                        min={50} max={85} unit="%" color="hsl(38 92% 50%)" onChange={v => update("ltv_high", v)} />
                    <SliderInput label="LTV cap for Severe-risk loans" value={thresholds.ltv_severe}
                        min={40} max={75} unit="%" color="hsl(0 75% 50%)" onChange={v => update("ltv_severe", v)} />
                    <SliderInput label="Rate adjustment per risk point (bps)" value={thresholds.rate_adj_per_unit}
                        min={0.5} max={5} step={0.1} unit=" bps" color="hsl(174 72% 36%)"
                        onChange={v => update("rate_adj_per_unit", v)} />
                </div>
            </SectionCard>
        </div>
    );
}

function ComplianceSection({ dirty, setDirty }: { dirty: boolean; setDirty: (v: boolean) => void }) {
    const [flags, setFlags] = useState({
        rbi_crf: true, brsr: true, sdg13: true, ifrs9: false,
        tcfd: true, sebi_esg: false, pcaf: false, auto_escalate: true,
        rbi_report_auto: true, gdpr_mode: false,
    });

    const toggle = (k: keyof typeof flags) => { setFlags(p => ({ ...p, [k]: !p[k] })); setDirty(true); };

    const items: Array<{ key: keyof typeof flags; label: string; desc: string; badge?: string }> = [
        { key: "rbi_crf", label: "RBI Climate Risk Framework 2024", desc: "Enforce RBI/2024-25/DOR/FINC scoring rules and mandatory officer escalation for Severe ratings.", badge: "Mandatory" },
        { key: "brsr", label: "SEBI BRSR Climate Disclosure", desc: "Auto-generate BRSR Section D climate risk tables in all annual portfolio exports.", badge: "Mandatory" },
        { key: "sdg13", label: "UN SDG 13 Alignment Tracking", desc: "Tag each green property loan against SDG 13 (Climate Action) targets for ESG reporting.", badge: "ESG" },
        { key: "ifrs9", label: "IFRS 9 Climate-Adjusted ECL Provisioning", desc: "Apply climate risk multipliers to Expected Credit Loss calculations per IFRS 9 Forward-Looking Adj.", badge: "IFRS" },
        { key: "tcfd", label: "TCFD Scenario Narrative Generation", desc: "Generate automated TCFD-formatted physical and transition risk narratives for board disclosures.", badge: "TCFD" },
        { key: "sebi_esg", label: "SEBI ESG Rating Feed Integration", desc: "Sync borrower ESG ratings from SEBI-accredited providers for blended risk scoring.", badge: "ESG" },
        { key: "pcaf", label: "PCAF Financed Emissions Attribution", desc: "Calculate and attribute Scope 3 financed emissions per PCAF standard for green bond reporting.", badge: "PCAF" },
        { key: "auto_escalate", label: "Auto-Escalate Severe Loans to CRO", desc: "Automatically route Severe-rated applications to CRO queue without officer action.", badge: "RBI §4.5" },
        { key: "rbi_report_auto", label: "Scheduled RBI Regulatory Report", desc: "Generate and email quarterly climate risk disclosure report to compliance officer automatically.", },
        { key: "gdpr_mode", label: "Data Minimisation Mode (PDPB / GDPR)", desc: "Mask PII in audit logs and reports after 90 days per India PDPB 2023 retention rules.", },
    ];

    return (
        <SectionCard title="Regulatory & Compliance Controls" icon={Landmark} color="hsl(222 70% 45%)">
            {items.map(item => (
                <SettingRow key={item.key} label={
                    <span className="flex items-center gap-2">
                        {item.label}
                        {item.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{item.badge}</span>
                        )}
                    </span> as unknown as string
                } desc={item.desc}>
                    <Toggle on={flags[item.key]} onChange={() => toggle(item.key)} />
                </SettingRow>
            ))}
        </SectionCard>
    );
}

function DataSourcesSection() {
    return (
        <SectionCard title="External Data Source Management" icon={DatabaseZap} color="hsl(174 72% 36%)">
            <div className="py-1">
                {DATA_SOURCES.map(ds => (
                    <div key={ds.id} className="flex items-center gap-4 py-3.5 border-b border-border last:border-0">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-foreground truncate">{ds.name}</span>
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground flex-shrink-0">{ds.type}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
                                <span>Coverage: {ds.coverage}</span>
                                <span>·</span>
                                <span>Latency: <strong className="font-mono">{ds.latency}</strong></span>
                                <span>·</span>
                                <span>Synced: {ds.lastSync}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <StatusDot status={ds.status} />
                            <button className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary transition-colors">
                                <RefreshCw size={12} />
                            </button>
                            <button className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    </div>
                ))}
                <div className="pt-4 pb-2">
                    <button className="flex items-center gap-2 text-xs font-semibold text-primary hover:underline">
                        <Plus size={13} /> Register New Data Source
                    </button>
                </div>
            </div>
        </SectionCard>
    );
}

function AIModelSection({ dirty, setDirty }: { dirty: boolean; setDirty: (v: boolean) => void }) {
    const [settings, setSettings] = useState({
        scenario: "ssp2", rebuild_freq: "weekly",
        confidence_threshold: 0.75, noise_factor: 12,
        explainability: true, shadow_mode: false,
        drift_alert: true, ensemble_voting: true,
    });

    const upd = (k: keyof typeof settings, v: unknown) => { setSettings(p => ({ ...p, [k]: v })); setDirty(true); };

    return (
        <div className="space-y-5">
            <SectionCard title="Model Configuration" icon={Brain} color="hsl(270 60% 55%)">
                <SettingRow label="Default IPCC Scenario" desc="Baseline scenario used for all new property assessments. SSP2-4.5 recommended per RBI CRF.">
                    <select className="text-xs border border-input rounded-lg px-2 py-1.5 bg-background text-foreground"
                        value={settings.scenario} onChange={e => upd("scenario", e.target.value)}>
                        <option value="ssp1">SSP1-1.9 (Optimistic)</option>
                        <option value="ssp2">SSP2-4.5 (Baseline — RBI)</option>
                        <option value="ssp5">SSP5-8.5 (Stress Test)</option>
                    </select>
                </SettingRow>
                <SettingRow label="Model Rebuild Frequency" desc="How often the full portfolio is re-scored when new climate data arrives.">
                    <select className="text-xs border border-input rounded-lg px-2 py-1.5 bg-background text-foreground"
                        value={settings.rebuild_freq} onChange={e => upd("rebuild_freq", e.target.value)}>
                        <option value="daily">Daily (Recommended)</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="manual">Manual Only</option>
                    </select>
                </SettingRow>
                <SettingRow label="Explainability Mode (XAI)" desc="Attach SHAP-style factor attribution to every assessment for officer transparency and RBI auditability.">
                    <Toggle on={settings.explainability} onChange={v => upd("explainability", v)} />
                </SettingRow>
                <SettingRow label="Shadow Deployment Mode" desc="Run new model version in parallel (scores not returned to users) for comparison before go-live.">
                    <Toggle on={settings.shadow_mode} onChange={v => upd("shadow_mode", v)} />
                </SettingRow>
                <SettingRow label="Model Drift Alerts" desc="Alert compliance officer if predicted vs. actual default rates diverge by > 0.5% over 60 days.">
                    <Toggle on={settings.drift_alert} onChange={v => upd("drift_alert", v)} />
                </SettingRow>
                <SettingRow label="Ensemble Voting (5-Model Consensus)" desc="Average scores across IMD, IPCC, NATMO, CWMI and satellite models instead of using a single source.">
                    <Toggle on={settings.ensemble_voting} onChange={v => upd("ensemble_voting", v)} />
                </SettingRow>
            </SectionCard>

            <SectionCard title="Precision & Uncertainty" icon={Activity} color="hsl(270 60% 55%)">
                <div className="py-4 space-y-5">
                    <SliderInput label="Minimum confidence threshold to display score" value={Math.round(settings.confidence_threshold * 100)}
                        min={50} max={95} unit="%" color="hsl(270 60% 55%)"
                        onChange={v => upd("confidence_threshold", v / 100)} />
                    <SliderInput label="Stochastic noise factor (simulated data variance)" value={settings.noise_factor}
                        min={0} max={30} unit="%" color="hsl(270 60% 55%)"
                        onChange={v => upd("noise_factor", v)} />
                    <div className="p-3 rounded-lg bg-muted/30 border border-border text-[11px] text-muted-foreground">
                        <Info size={11} className="inline mr-1.5" />
                        Noise factor simulates real-world geospatial data uncertainty. Set to 0 for deterministic outputs in demo/dev environments.
                    </div>
                </div>
            </SectionCard>
        </div>
    );
}

function ScoringSection({ dirty, setDirty }: { dirty: boolean; setDirty: (v: boolean) => void }) {
    const [s, setS] = useState({
        tenure_adj: true, loan_size_adj: true, property_type_adj: true,
        coastal_multiplier: 1.15, arid_multiplier: 1.10,
        delta_multiplier: 1.20, govt_infra_discount: 0.90,
    });
    const upd = (k: keyof typeof s, v: unknown) => { setS(p => ({ ...p, [k]: v })); setDirty(true); };

    return (
        <div className="space-y-5">
            <SectionCard title="Score Modifiers" icon={SlidersHorizontal} color="hsl(38 92% 50%)">
                <SettingRow label="Loan Tenure Adjustment" desc="Longer tenures amplify climate risk scores (mortgages carry more long-horizon exposure).">
                    <Toggle on={s.tenure_adj} onChange={v => upd("tenure_adj", v)} />
                </SettingRow>
                <SettingRow label="Loan Size Adjustment" desc="Larger loan amounts receive marginally higher scrutiny multipliers for portfolio concentration risk.">
                    <Toggle on={s.loan_size_adj} onChange={v => upd("loan_size_adj", v)} />
                </SettingRow>
                <SettingRow label="Property Type Modifier" desc="Apply RBI-specified risk modifiers per property type: industrial +10%, agricultural +15%, residential baseline.">
                    <Toggle on={s.property_type_adj} onChange={v => upd("property_type_adj", v)} />
                </SettingRow>
            </SectionCard>

            <SectionCard title="Regional Zone Multipliers" icon={Globe} color="hsl(38 92% 50%)">
                <div className="py-4 space-y-5">
                    {[
                        { key: "coastal_multiplier" as const, label: "Coastal Zone Multiplier", min: 1.0, max: 1.5, step: 0.01 },
                        { key: "arid_multiplier" as const, label: "Arid / Desert Zone Multiplier", min: 1.0, max: 1.5, step: 0.01 },
                        { key: "delta_multiplier" as const, label: "River Delta / Flood-prone Multiplier", min: 1.0, max: 1.6, step: 0.01 },
                        { key: "govt_infra_discount" as const, label: "Govt. Climate Infrastructure Discount", min: 0.7, max: 1.0, step: 0.01 },
                    ].map(item => (
                        <SliderInput key={item.key} label={item.label}
                            value={s[item.key]} min={item.min} max={item.max} step={item.step}
                            color="hsl(38 92% 50%)" onChange={v => upd(item.key, v)} />
                    ))}
                </div>
            </SectionCard>
        </div>
    );
}

function AlertsSection({ dirty, setDirty }: { dirty: boolean; setDirty: (v: boolean) => void }) {
    const [a, setA] = useState({
        email: true, sms: false, slack: true, webhook: false,
        threshold_cross: true, new_severe: true, model_drift: true,
        monthly_digest: true, regulatory_deadline: true, data_source_fail: true,
    });
    const toggle = (k: keyof typeof a) => { setA(p => ({ ...p, [k]: !p[k] })); setDirty(true); };

    return (
        <div className="space-y-5">
            <SectionCard title="Notification Channels" icon={Bell} color="hsl(174 72% 36%)">
                <SettingRow label="Email Alerts" desc="Send alert emails to officer, branch manager, and compliance inbox.">
                    <Toggle on={a.email} onChange={() => toggle("email")} />
                </SettingRow>
                <SettingRow label="SMS Alerts (Critical Only)" desc="SMS for Severe-rated loan decisions and regulatory deadline reminders.">
                    <Toggle on={a.sms} onChange={() => toggle("sms")} />
                </SettingRow>
                <SettingRow label="Slack / MS Teams Integration" desc="Post risk alerts and AI decision summaries to a configured Slack/Teams channel.">
                    <Toggle on={a.slack} onChange={() => toggle("slack")} />
                </SettingRow>
                <SettingRow label="Outbound Webhook (REST)" desc="Push structured JSON alert payloads to your CBS (Core Banking System) or SIEM.">
                    <Toggle on={a.webhook} onChange={() => toggle("webhook")} />
                </SettingRow>
            </SectionCard>

            <SectionCard title="Alert Triggers" icon={ShieldAlert} color="hsl(174 72% 36%)">
                {[
                    { key: "threshold_cross" as const, label: "Risk Threshold Crossed", desc: "Alert when a loan application crosses from Moderate to High or High to Severe." },
                    { key: "new_severe" as const, label: "New Severe Rating Detected", desc: "Immediate alert for any property scoring > 75 (Severe) in the system." },
                    { key: "model_drift" as const, label: "AI Model Performance Drift", desc: "Alert when predicted vs. actual default rate divergence exceeds 0.5%." },
                    { key: "monthly_digest" as const, label: "Monthly Portfolio Digest", desc: "Summarised climate exposure report sent on the 1st of each month." },
                    { key: "regulatory_deadline" as const, label: "Regulatory Filing Deadlines", desc: "Reminders 14 and 3 days before RBI BRSR and SEBI ESG filing deadlines." },
                    { key: "data_source_fail" as const, label: "Data Source Failure", desc: "Alert when an external data provider (IMD, NATMO, etc.) returns errors." },
                ].map(item => (
                    <SettingRow key={item.key} label={item.label} desc={item.desc}>
                        <Toggle on={a[item.key]} onChange={() => toggle(item.key)} />
                    </SettingRow>
                ))}
            </SectionCard>
        </div>
    );
}

function AuditSection() {
    return (
        <div className="space-y-5">
            <SectionCard title="Audit Log" icon={ClipboardList} color="hsl(222 70% 45%)">
                <div className="py-1">
                    <div className="flex items-center justify-between py-3 border-b border-border">
                        <span className="text-xs text-muted-foreground">Showing last 24 hours · {AUDIT_LOG.length} events</span>
                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-1.5 text-xs text-primary hover:underline"><Download size={11} />Export CSV</button>
                            <button className="flex items-center gap-1.5 text-xs text-primary hover:underline"><Upload size={11} />Push to SIEM</button>
                        </div>
                    </div>

                    {AUDIT_LOG.map(row => (
                        <div key={row.id}
                            className={`flex items-start gap-4 py-3 border-b border-border last:border-0 ${row.result === "fail" ? "bg-red-50/40" : ""}`}>
                            <div className="flex-shrink-0 mt-0.5">
                                {row.result === "success"
                                    ? <CheckCircle size={13} className="text-emerald-600" />
                                    : <AlertTriangle size={13} className="text-red-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-xs text-foreground">{row.action}</span>
                                    <span className="text-[10px] text-muted-foreground">·</span>
                                    <span className="text-[10px] text-muted-foreground truncate">{row.resource}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                                    <span className="font-semibold" style={{ color: row.result === "fail" ? "hsl(0 75% 50%)" : "inherit" }}>{row.user}</span>
                                    <span>·</span><span className="font-mono">{row.ip}</span>
                                    <span>·</span><span>{row.ts}</span>
                                    <span className="ml-auto font-mono text-[9px] text-muted-foreground/60">{row.id}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>

            <SectionCard title="Audit Retention & Transparency" icon={BookOpen} color="hsl(222 70% 45%)">
                <SettingRow label="Log Retention Period" desc="RBI IT guidelines mandate minimum 7-year audit trail for credit decisions.">
                    <select className="text-xs border border-input rounded-lg px-2 py-1.5 bg-background">
                        <option>3 years</option>
                        <option>5 years</option>
                        <option selected>7 years (RBI Minimum)</option>
                        <option>10 years</option>
                    </select>
                </SettingRow>
                <SettingRow label="Immutable Log Ledger" desc="Write audit logs to an append-only ledger (WORM storage) to prevent tampering.">
                    <Toggle on={true} onChange={() => { }} />
                </SettingRow>
                <SettingRow label="Officer Decision Justification Required" desc="Officers must enter a text rationale for every decision that diverges from AI recommendation.">
                    <Toggle on={true} onChange={() => { }} />
                </SettingRow>
                <SettingRow label="Real-Time SIEM Integration" desc="Stream audit events in CEF format to Splunk / IBM QRadar for central SOC monitoring.">
                    <Toggle on={false} onChange={() => { }} />
                </SettingRow>
            </SectionCard>
        </div>
    );
}

function PrivacySection({ dirty, setDirty }: { dirty: boolean; setDirty: (v: boolean) => void }) {
    const [show, setShow] = useState(false);
    const [p, setP] = useState({
        aes256: true, tls13: true, field_level_enc: true,
        pii_masking: true, right_to_forget: false,
        anonymize_exports: true, key_rotation: 90,
    });
    const upd = (k: keyof typeof p, v: unknown) => { setP(prev => ({ ...prev, [k]: v })); setDirty(true); };

    return (
        <div className="space-y-5">
            <SectionCard title="Encryption & Data Security" icon={Lock} color="hsl(270 60% 55%)">
                <SettingRow label="AES-256 Data Encryption at Rest" desc="All stored climate scores, reports and PII encrypted at rest using AES-256-GCM.">
                    <Toggle on={p.aes256} onChange={v => upd("aes256", v)} />
                </SettingRow>
                <SettingRow label="TLS 1.3 In-Transit Encryption" desc="All API calls and browser sessions use TLS 1.3. Downgrade attacks rejected.">
                    <Toggle on={p.tls13} onChange={v => upd("tls13", v)} />
                </SettingRow>
                <SettingRow label="Field-Level Encryption (PAN / Aadhaar)" desc="Encrypt Aadhaar-derived identifiers at field level separately from row-level storage encryption.">
                    <Toggle on={p.field_level_enc} onChange={v => upd("field_level_enc", v)} />
                </SettingRow>
                <SettingRow label="Encryption Key Rotation (days)">
                    <select className="text-xs border border-input rounded-lg px-2 py-1.5 bg-background"
                        value={p.key_rotation} onChange={e => upd("key_rotation", Number(e.target.value))}>
                        <option value={30}>30 days</option>
                        <option value={60}>60 days</option>
                        <option value={90}>90 days (Recommended)</option>
                        <option value={180}>180 days</option>
                    </select>
                </SettingRow>
                <SettingRow label="Database Master Key" desc="HSM-protected master key used for KMS operations.">
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{show ? "arn:aws:kms:ap-south-1:****:key/abc123" : "••••••••••••••••••••"}</span>
                        <button onClick={() => setShow(v => !v)} className="text-muted-foreground hover:text-primary">
                            {show ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                    </div>
                </SettingRow>
            </SectionCard>

            <SectionCard title="Privacy Controls (PDPB 2023)" icon={Server} color="hsl(270 60% 55%)">
                <SettingRow label="PII Masking in Reports" desc="Mask applicant name, Aadhaar, PAN in all exported reports — show only property ID.">
                    <Toggle on={p.pii_masking} onChange={v => upd("pii_masking", v)} />
                </SettingRow>
                <SettingRow label="Right to Erasure (Data Subject Request)" desc="Enable Officer to flag a loan file for full data deletion within 30 days per PDPB 2023 §17.">
                    <Toggle on={p.right_to_forget} onChange={v => upd("right_to_forget", v)} />
                </SettingRow>
                <SettingRow label="Anonymise Bulk Exports" desc="Strip all PII from CSV / JSON bulk exports used for analytics or third-party processing.">
                    <Toggle on={p.anonymize_exports} onChange={v => upd("anonymize_exports", v)} />
                </SettingRow>
                <SettingRow label="Data Localisation Policy" desc="All data stored exclusively in AWS ap-south-1 (Mumbai) — no cross-border transfer.">
                    <Toggle on={true} onChange={() => { }} />
                </SettingRow>
            </SectionCard>
        </div>
    );
}

function SimulationSection({ dirty, setDirty }: { dirty: boolean; setDirty: (v: boolean) => void }) {
    const [running, setRunning] = useState<string | null>(null);
    const [completed, setCompleted] = useState<string[]>([]);

    const scenarios = [
        { id: "cyclone", label: "Cyclone Biparjoy — Category 4 Landfall", desc: "Simulate Gujarat & Maharashtra coastal portfolio impact (flood inundation, 12 hr storm surge).", icon: Zap, color: "hsl(0 75% 50%)" },
        { id: "monsoon", label: "Extreme Monsoon Failure (2 Consecutive Years)", desc: "CWMI stress test: simulate worst-case water scarcity across Rajasthan, Maharashtra, UP belts.", icon: Activity, color: "hsl(270 60% 55%)" },
        { id: "heatwave", label: "Wet-Bulb 35°C Sustained Heatwave", desc: "IPCC AR6 SSP5 tail event — test habitability thresholds across Indo-Gangetic portfolio.", icon: Activity, color: "hsl(22 90% 52%)" },
        { id: "sealevel", label: "+0.5m Sea-Level Rise by 2040 (Accelerated)", desc: "Accelerated SLR scenario for coastal cities: Chennai, Mumbai, Kolkata, Kochi. LTV re-assessment triggered.", icon: Network, color: "hsl(200 75% 45%)" },
        { id: "flood100", label: "1-in-100-Year Flood Event — Brahmaputra", desc: "Northeast India delta and Assam floodplain worst-case. Cross-portfolio NPA impact estimation.", icon: DatabaseZap, color: "hsl(210 80% 55%)" },
        { id: "combined", label: "Compound Risk Event (Flood + Heat + Scarcity)", "desc": "Simultaneous multi-hazard stress test. Most extreme capital adequacy scenario for Board review.", icon: ShieldAlert, color: "hsl(0 75% 50%)" },
    ];

    const run = async (id: string) => {
        if (running) return;
        setRunning(id);
        setDirty(true);
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 1500));
        setRunning(null);
        setCompleted(p => [...p, id]);
    };

    return (
        <SectionCard title="Disaster Scenario Simulation Engine" icon={Zap} color="hsl(0 75% 50%)">
            <div className="py-1">
                <div className="py-3 border-b border-border flex items-start gap-3">
                    <AlertTriangle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Simulations run against the current portfolio in a read-only sandbox. No loan decisions are modified.
                        Results are appendended to the Audit Log and emailed to the CRO inbox. Run times: 2–15 minutes depending on portfolio size.
                    </p>
                </div>

                {scenarios.map(sc => {
                    const Icon = sc.icon;
                    const done = completed.includes(sc.id);
                    const active = running === sc.id;
                    return (
                        <div key={sc.id} className="flex items-start justify-between gap-4 py-4 border-b border-border last:border-0">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ background: `${sc.color}18` }}>
                                    <Icon size={14} style={{ color: sc.color }} />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm text-foreground leading-tight">{sc.label}</div>
                                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{sc.desc}</div>
                                </div>
                            </div>
                            <div className="flex-shrink-0">
                                {done ? (
                                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                                        <CheckCircle size={12} />Completed
                                    </div>
                                ) : (
                                    <button onClick={() => run(sc.id)}
                                        disabled={!!running}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                      ${active ? "opacity-70 cursor-wait" : "hover:opacity-90"}
                      ${running && !active ? "opacity-30 cursor-not-allowed" : ""}`}
                                        style={{ background: sc.color, color: "white" }}>
                                        {active ? <><RefreshCw size={11} className="animate-spin" />Running…</> : <><Zap size={11} />Run Simulation</>}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </SectionCard>
    );
}

/* -------------------------------------------------------------------------
   Main SettingsView
------------------------------------------------------------------------- */

export function SettingsView() {
    const [activeSection, setActiveSection] = useState<SettingSection>("rbac");
    const [dirty, setDirty] = useState(false);

    const handleSave = () => { setDirty(false); };
    const handleReset = () => { setDirty(false); };

    const sectionMeta = SECTIONS.find(s => s.id === activeSection)!;
    const SectionIcon = sectionMeta.icon;

    return (
        <div className="max-w-[1400px] mx-auto pb-16 space-y-5">

            {/* Header */}
            <div className="rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="px-6 py-5 flex items-start justify-between gap-4"
                    style={{ background: "linear-gradient(135deg, hsl(222 70% 14%) 0%, hsl(222 55% 22%) 55%, hsl(174 72% 20%) 100%)" }}>
                    <div>
                        <div className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "hsl(174 72% 60%)" }}>
                            Climate Credit Risk Engine · System Settings
                        </div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Settings className="w-6 h-6" style={{ color: "hsl(174 72% 60%)" }} />
                            Enterprise Settings
                        </h2>
                        <p className="text-sm mt-1.5 max-w-2xl" style={{ color: "hsl(210 30% 75%)" }}>
                            Enterprise-grade configuration for RBAC, risk thresholds, regulatory compliance, AI calibration,
                            data sources, alerts, audit controls, privacy, and disaster scenario stress-testing.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0 text-right">
                        <div className="text-[10px] text-white/50">Platform Version</div>
                        <div className="text-sm font-mono font-semibold text-white/90">v2.1.0-beta</div>
                        <div className="text-[10px] text-white/50 mt-1">Last config change</div>
                        <div className="text-xs font-mono text-white/80">Today 11:45 IST</div>
                    </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-4 divide-x divide-border bg-card">
                    {[
                        { label: "Active Users", value: "91", icon: Users, color: "hsl(222 70% 45%)" },
                        { label: "Data Sources", value: "7", icon: DatabaseZap, color: "hsl(174 72% 36%)" },
                        { label: "Compliance Rules", value: "10", icon: Landmark, color: "hsl(142 69% 35%)" },
                        { label: "Audit Events 24h", value: AUDIT_LOG.length.toString(), icon: ClipboardList, color: "hsl(38 92% 50%)" },
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

            {/* Main layout */}
            <div className="grid grid-cols-12 gap-5">

                {/* Left nav */}
                <div className="col-span-12 lg:col-span-3 bg-card border border-border rounded-xl overflow-hidden shadow-sm self-start">
                    <div className="px-4 py-3 border-b border-border bg-muted/20">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Configuration Areas</span>
                    </div>
                    <nav className="p-2">
                        {SECTIONS.map(s => {
                            const Icon = s.icon;
                            const active = s.id === activeSection;
                            return (
                                <button key={s.id} onClick={() => setActiveSection(s.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm transition-all
                    ${active ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>
                                    <Icon size={14} className="flex-shrink-0" />
                                    <span className="flex-1 text-left">{s.label}</span>
                                    {s.badge && (
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0
                      ${active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                                            {s.badge}
                                        </span>
                                    )}
                                    <ChevronRight size={12} className={`flex-shrink-0 transition-transform ${active ? "rotate-90 text-primary" : ""}`} />
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Right content */}
                <div className="col-span-12 lg:col-span-9">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: "hsl(var(--primary) / 0.1)" }}>
                            <SectionIcon size={17} className="text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">{sectionMeta.label}</h3>
                            {sectionMeta.badge && (
                                <span className="text-[10px] font-mono text-muted-foreground">{sectionMeta.badge}</span>
                            )}
                        </div>
                    </div>

                    <div className="animate-slide-up" key={activeSection}>
                        {activeSection === "rbac" && <RBACSection />}
                        {activeSection === "thresholds" && <ThresholdsSection dirty={dirty} setDirty={setDirty} />}
                        {activeSection === "compliance" && <ComplianceSection dirty={dirty} setDirty={setDirty} />}
                        {activeSection === "datasources" && <DataSourcesSection />}
                        {activeSection === "ai_model" && <AIModelSection dirty={dirty} setDirty={setDirty} />}
                        {activeSection === "scoring" && <ScoringSection dirty={dirty} setDirty={setDirty} />}
                        {activeSection === "alerts" && <AlertsSection dirty={dirty} setDirty={setDirty} />}
                        {activeSection === "audit" && <AuditSection />}
                        {activeSection === "privacy" && <PrivacySection dirty={dirty} setDirty={setDirty} />}
                        {activeSection === "simulation" && <SimulationSection dirty={dirty} setDirty={setDirty} />}
                    </div>
                </div>
            </div>

            <SaveBar dirty={dirty} onSave={handleSave} onReset={handleReset} />
        </div>
    );
}
