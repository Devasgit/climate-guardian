/**
 * Main Dashboard Page — Climate Credit Risk Engine
 */
import { useState, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { AssessmentForm } from "@/components/AssessmentForm";
import { RiskScoreCard } from "@/components/RiskScoreCard";
import { RiskBreakdownChart } from "@/components/RiskBreakdownChart";
import { ProjectionChart } from "@/components/ProjectionChart";
import { LendingPanel } from "@/components/LendingPanel";
import { StatsBar } from "@/components/StatsBar";
import { RecentAssessments } from "@/components/RecentAssessments";
import { PortfolioView } from "@/components/PortfolioView";
import { ReportsView } from "@/components/ReportsView";
import { TrendsView } from "@/components/TrendsView";
import { OfficersView } from "@/components/OfficersView";
import { SettingsView } from "@/components/SettingsView";
import { PropertyAssessmentInput, ClimateRiskReport } from "@/types/climate";
import {
  calculateFactorScores,
  classifyRisk,
  generateProjections,
  generateLendingAdjustments,
  getRegionProfile,
  SEED_ASSESSMENTS,
} from "@/lib/climateEngine";
import { Bell, Search } from "lucide-react";
import climateHero from "@/assets/climate-hero.jpg";

// ─────────────────────────────────────────────────────────────
// Mock API call — simulates FastAPI backend response
// ─────────────────────────────────────────────────────────────
async function runClimateAssessment(input: PropertyAssessmentInput): Promise<ClimateRiskReport> {
  // Simulate network latency (200–800ms)
  await new Promise(r => setTimeout(r, 600 + Math.random() * 400));

  const factors = calculateFactorScores(input.latitude, input.longitude, input.property_type);
  const rawScore = factors.reduce((sum, f) => sum + f.weighted_score, 0);
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));
  const classification = classifyRisk(score);
  const profile = getRegionProfile(input.latitude, input.longitude);
  const projections = generateProjections(factors);
  const adjustments = generateLendingAdjustments(score, classification, input.property_type, factors);

  return {
    latitude: input.latitude,
    longitude: input.longitude,
    property_type: input.property_type,
    location_name: profile.name,
    region: profile.region,
    climate_risk_score: score,
    risk_classification: classification,
    confidence_level: 0.78 + Math.random() * 0.15,
    factors,
    projections,
    lending_adjustments: adjustments,
    assessment_date: new Date().toISOString(),
    model_version: "v2.1.0-beta",
    data_vintage: "IMD 2023 · IPCC AR6",
  };
}

// ─────────────────────────────────────────────────────────────
// Hero / Welcome screen
// ─────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <div className="relative rounded-2xl overflow-hidden h-48 mb-6">
      <img
        src={climateHero}
        alt="Climate risk heatmap"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0" style={{ background: "hsl(var(--primary) / 0.75)" }} />
      <div className="relative z-10 flex flex-col justify-end h-full p-6">
        <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "hsl(var(--secondary))" }}>
          RBI Climate Risk Framework · 2024
        </div>
        <h1 className="text-2xl font-bold text-white leading-tight">
          Climate Credit Risk Engine
        </h1>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--primary-foreground) / 0.7)" }}>
          Property-level climate risk assessment for loan approval decisions · Powered by IMD, IPCC AR6 &amp; CWMI datasets
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────
export default function Index() {
  const [activeTab, setActiveTab] = useState("assessment");
  const [report, setReport] = useState<ClimateRiskReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssessment = useCallback(async (input: PropertyAssessmentInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await runClimateAssessment(input);
      setReport(result);
    } catch {
      setError("Assessment failed. Please check your inputs and retry.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by location, loan ID…"
                className="pl-9 pr-4 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-1 w-64"
                style={{ "--tw-ring-color": "hsl(var(--secondary))" } as React.CSSProperties}
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
              Branch: Delhi · IFSC: RBID0001234
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
            <button className="relative w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold text-white" style={{ background: "hsl(var(--risk-severe))" }}>3</span>
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "hsl(var(--primary))" }}>
              RK
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === "assessment" && (
            <div className="max-w-[1400px] mx-auto space-y-6">
              <HeroSection />
              <StatsBar />

              <div className="grid grid-cols-12 gap-6">
                {/* Left column: form + history */}
                <div className="col-span-3 space-y-5">
                  <AssessmentForm onSubmit={handleAssessment} isLoading={isLoading} />
                  <RecentAssessments assessments={SEED_ASSESSMENTS} />
                </div>

                {/* Right column: results */}
                <div className="col-span-9 space-y-5">
                  {!report && !isLoading && (
                    <div className="rounded-xl border border-border bg-card flex flex-col items-center justify-center py-24 text-center">
                      <div className="w-16 h-16 rounded-full mb-5 flex items-center justify-center" style={{ background: "hsl(var(--muted))" }}>
                        <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 16l4.553-2.276A1 1 0 0021 19.382V8.618a1 1 0 00-.553-.894L15 5m0 0L9 7" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Ready for Assessment</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Enter property coordinates and type in the form to generate a comprehensive climate risk report using IMD, IPCC AR6, and CWMI data.
                      </p>
                    </div>
                  )}

                  {isLoading && (
                    <div className="rounded-xl border border-border bg-card flex flex-col items-center justify-center py-24">
                      <div className="w-12 h-12 border-4 rounded-full animate-spin mb-4" style={{ borderColor: "hsl(var(--muted))", borderTopColor: "hsl(var(--secondary))" }} />
                      <p className="text-sm font-medium text-foreground">Analyzing climate datasets…</p>
                      <p className="text-xs text-muted-foreground mt-1">Querying IMD · NATMO · IPCC AR6 · CWMI</p>
                    </div>
                  )}

                  {error && (
                    <div className="rounded-xl border p-5 text-sm" style={{ background: "hsl(var(--risk-severe-bg))", borderColor: "hsl(var(--risk-severe) / 0.3)", color: "hsl(var(--risk-severe))" }}>
                      {error}
                    </div>
                  )}

                  {report && !isLoading && (
                    <div className="stagger-children space-y-5">
                      <RiskScoreCard report={report} />
                      <div className="grid grid-cols-2 gap-5">
                        <RiskBreakdownChart factors={report.factors} />
                        <ProjectionChart projections={report.projections} />
                      </div>
                      <LendingPanel
                        adjustments={report.lending_adjustments}
                        loanAmount={150}
                        baseLine={8.5}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "dashboard" && (
            <div className="max-w-[1400px] mx-auto space-y-6">
              <HeroSection />
              <StatsBar />
              <div className="grid grid-cols-2 gap-6">
                <RecentAssessments assessments={SEED_ASSESSMENTS} />
                <div className="rounded-xl border border-border bg-card p-6 flex items-center justify-center text-muted-foreground text-sm">
                  Portfolio heatmap — connect backend to enable real data
                </div>
              </div>
            </div>
          )}

          {activeTab === "portfolio" && (
            <div className="max-w-[1400px] mx-auto">
              <PortfolioView />
            </div>
          )}

          {activeTab === "reports" && (
            <div className="max-w-[1400px] mx-auto">
              <ReportsView />
            </div>
          )}

          {activeTab === "trends" && (
            <div className="max-w-[1400px] mx-auto">
              <TrendsView />
            </div>
          )}

          {activeTab === "officers" && (
            <div className="max-w-[1400px] mx-auto">
              <OfficersView />
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-[1400px] mx-auto">
              <SettingsView />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
