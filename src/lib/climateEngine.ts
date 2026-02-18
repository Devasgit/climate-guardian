/**
 * Climate Risk Engine — Mock Data
 * 
 * Simulates datasets from:
 * - IMD (Indian Meteorological Department)
 * - NATMO flood zone maps
 * - IPCC sea-level projections (AR6)
 * - CWMI (Composite Water Management Index)
 * - NIUA heat stress index
 *
 * In production, these would be fetched from the FastAPI backend
 * which ingests real geospatial data via PostGIS + GEE.
 */

import { ClimateFactorScore, LendingAdjustment, ProjectionDataPoint, RiskClassification } from "@/types/climate";

// ─────────────────────────────────────────────────────────────
// Regional climate zone mapping (simplified grid for India)
// ─────────────────────────────────────────────────────────────

interface RegionProfile {
  name: string;
  region: string;
  flood_base: number;
  sea_level_base: number;
  heat_base: number;
  water_scarcity_base: number;
}

/**
 * Returns a regional profile based on lat/lng.
 * Covers major Indian climate zones.
 */
export function getRegionProfile(lat: number, lng: number): RegionProfile {
  // Coastal zones (high flood + sea-level risk)
  if (lng >= 79 && lng <= 80.5 && lat >= 8 && lat <= 13) {
    return { name: "Chennai Metropolitan Region", region: "Tamil Nadu Coast", flood_base: 72, sea_level_base: 68, heat_base: 75, water_scarcity_base: 62 };
  }
  if (lng >= 72 && lng <= 73.5 && lat >= 18 && lat <= 19.5) {
    return { name: "Mumbai Metropolitan Area", region: "Maharashtra Coast", flood_base: 78, sea_level_base: 74, heat_base: 65, water_scarcity_base: 45 };
  }
  if (lng >= 88 && lng <= 89 && lat >= 22 && lat <= 23) {
    return { name: "Kolkata Urban Agglomeration", region: "West Bengal Delta", flood_base: 85, sea_level_base: 80, heat_base: 70, water_scarcity_base: 30 };
  }
  if (lng >= 76 && lng <= 77.5 && lat >= 8 && lat <= 9) {
    return { name: "Thiruvananthapuram District", region: "Kerala Coast", flood_base: 75, sea_level_base: 65, heat_base: 55, water_scarcity_base: 20 };
  }
  // Indo-Gangetic Plain (flood risk, heat stress)
  if (lng >= 76 && lng <= 88 && lat >= 24 && lat <= 30) {
    return { name: "Indo-Gangetic Plain", region: "Northern India", flood_base: 60, sea_level_base: 10, heat_base: 85, water_scarcity_base: 70 };
  }
  // Rajasthan / arid (water scarcity, heat)
  if (lng >= 69 && lng <= 77 && lat >= 24 && lat <= 30) {
    return { name: "Rajasthan Arid Zone", region: "Northwestern India", flood_base: 20, sea_level_base: 5, heat_base: 95, water_scarcity_base: 90 };
  }
  // Deccan Plateau
  if (lng >= 74 && lng <= 80 && lat >= 14 && lat <= 22) {
    return { name: "Deccan Plateau Region", region: "Central India", flood_base: 40, sea_level_base: 8, heat_base: 78, water_scarcity_base: 65 };
  }
  // Northeast (high rainfall, flood)
  if (lng >= 89 && lat >= 23 && lat <= 30) {
    return { name: "Northeast India", region: "Brahmaputra Basin", flood_base: 88, sea_level_base: 15, heat_base: 55, water_scarcity_base: 15 };
  }
  // Gujarat / Odisha coasts
  if (lng >= 68 && lng <= 75 && lat >= 20 && lat <= 24) {
    return { name: "Gujarat Coastal Zone", region: "Western India", flood_base: 55, sea_level_base: 58, heat_base: 80, water_scarcity_base: 72 };
  }
  // Default - interior
  return { name: `Location (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`, region: "Interior India", flood_base: 38, sea_level_base: 12, heat_base: 68, water_scarcity_base: 55 };
}

// ─────────────────────────────────────────────────────────────
// Property type modifiers
// ─────────────────────────────────────────────────────────────
const PROPERTY_MODIFIERS: Record<string, { flood: number; heat: number; sea: number; water: number }> = {
  residential:  { flood: 0,   heat: 5,  sea: 0,  water: 0  },
  commercial:   { flood: -5,  heat: 8,  sea: 5,  water: 5  },
  industrial:   { flood: 10,  heat: 10, sea: 8,  water: 15 },
  agricultural: { flood: 15,  heat: 15, sea: 5,  water: 20 },
  mixed_use:    { flood: 5,   heat: 8,  sea: 5,  water: 8  },
};

// ─────────────────────────────────────────────────────────────
// Risk classification
// ─────────────────────────────────────────────────────────────
export function classifyRisk(score: number): RiskClassification {
  if (score < 25) return "Low";
  if (score < 50) return "Moderate";
  if (score < 75) return "High";
  return "Severe";
}

// ─────────────────────────────────────────────────────────────
// Core scoring engine
// ─────────────────────────────────────────────────────────────

/**
 * Calculates weighted Climate Risk Score (0–100).
 * Weights based on RBI climate risk guidelines (2023) and SEBI BRSR norms.
 *
 * Factor weights:
 *   Flood probability:       0.35  (highest — direct property damage)
 *   Sea-level rise:          0.25  (long-term asset devaluation)
 *   Heat stress index:       0.25  (operational + health risk)
 *   Water scarcity:          0.15  (utility + habitability risk)
 */
export function calculateFactorScores(
  lat: number,
  lng: number,
  propertyType: string
): ClimateFactorScore[] {
  const profile = getRegionProfile(lat, lng);
  const mod = PROPERTY_MODIFIERS[propertyType] || PROPERTY_MODIFIERS.residential;

  // Add ±10% stochastic noise to simulate real data variance
  const noise = () => (Math.random() - 0.5) * 12;

  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

  const floodScore    = clamp(profile.flood_base    + mod.flood + noise());
  const seaScore      = clamp(profile.sea_level_base + mod.sea  + noise());
  const heatScore     = clamp(profile.heat_base      + mod.heat  + noise());
  const waterScore    = clamp(profile.water_scarcity_base + mod.water + noise());

  const weights = { flood: 0.35, sea: 0.25, heat: 0.25, water: 0.15 };

  return [
    {
      factor: "Flood Probability",
      score: floodScore,
      weight: weights.flood,
      weighted_score: parseFloat((floodScore * weights.flood).toFixed(1)),
      description: `${floodScore > 60 ? "High" : floodScore > 35 ? "Moderate" : "Low"} annual flood inundation probability. Based on IMD rainfall anomaly data and NATMO flood hazard maps.`,
      data_source: "IMD Gridded Rainfall + NATMO Flood Hazard Atlas",
    },
    {
      factor: "Sea-Level Rise Exposure",
      score: seaScore,
      weight: weights.sea,
      weighted_score: parseFloat((seaScore * weights.sea).toFixed(1)),
      description: `IPCC AR6 SSP2-4.5 scenario projects ${(seaScore * 0.05).toFixed(2)}m sea-level rise by 2050. Coastal proximity amplifies long-term asset devaluation risk.`,
      data_source: "IPCC AR6 Sea-Level Projections + INCOIS Coastal Vulnerability Index",
    },
    {
      factor: "Heat Stress Index",
      score: heatScore,
      weight: weights.heat,
      weighted_score: parseFloat((heatScore * weights.heat).toFixed(1)),
      description: `Wet-Bulb Globe Temperature (WBGT) analysis indicates ${heatScore > 70 ? "dangerous" : heatScore > 45 ? "elevated" : "manageable"} heat exposure. Affects habitability and property operational costs.`,
      data_source: "NIUA Heat Action Plans + IMD Temperature Projections",
    },
    {
      factor: "Water Scarcity Projection",
      score: waterScore,
      weight: weights.water,
      weighted_score: parseFloat((waterScore * weights.water).toFixed(1)),
      description: `CWMI composite score indicates ${waterScore > 60 ? "critical" : waterScore > 40 ? "stressed" : "adequate"} water availability through 2040. Groundwater depletion rate factored in.`,
      data_source: "NITI Aayog CWMI + CGWB Groundwater Atlas",
    },
  ];
}

// ─────────────────────────────────────────────────────────────
// 20-year projection engine (IPCC SSP2-4.5 trajectory)
// ─────────────────────────────────────────────────────────────
export function generateProjections(factors: ClimateFactorScore[]): ProjectionDataPoint[] {
  const baseYear = new Date().getFullYear();
  const floodBase  = factors.find(f => f.factor === "Flood Probability")?.score ?? 50;
  const heatBase   = factors.find(f => f.factor === "Heat Stress Index")?.score ?? 50;
  const seaBase    = factors.find(f => f.factor === "Sea-Level Rise Exposure")?.score ?? 50;
  const waterBase  = factors.find(f => f.factor === "Water Scarcity Projection")?.score ?? 50;

  return Array.from({ length: 11 }, (_, i) => {
    const year = baseYear + i * 2;
    const t = i / 10; // 0 → 1 over 20 years

    // Climate trajectories follow IPCC SSP2-4.5 (moderate emissions)
    // Non-linear acceleration curves
    const flood_risk      = Math.min(100, floodBase  + t * 18 + t * t * 7);
    const heat_stress     = Math.min(100, heatBase   + t * 15 + t * t * 9);
    const sea_level_rise  = Math.min(100, seaBase    + t * 22 + t * t * 5);
    const water_scarcity  = Math.min(100, waterBase  + t * 12 + t * t * 6);
    const composite_risk  = parseFloat(
      (flood_risk * 0.35 + sea_level_rise * 0.25 + heat_stress * 0.25 + water_scarcity * 0.15).toFixed(1)
    );

    return {
      year,
      flood_risk:     parseFloat(flood_risk.toFixed(1)),
      heat_stress:    parseFloat(heat_stress.toFixed(1)),
      sea_level_rise: parseFloat(sea_level_rise.toFixed(1)),
      water_scarcity: parseFloat(water_scarcity.toFixed(1)),
      composite_risk,
    };
  });
}

// ─────────────────────────────────────────────────────────────
// Lending adjustment recommendation engine
// ─────────────────────────────────────────────────────────────
export function generateLendingAdjustments(
  score: number,
  classification: RiskClassification,
  propertyType: string,
  factors: ClimateFactorScore[]
): LendingAdjustment[] {
  const adjustments: LendingAdjustment[] = [];
  const floodScore = factors.find(f => f.factor === "Flood Probability")?.score ?? 0;
  const seaScore   = factors.find(f => f.factor === "Sea-Level Rise Exposure")?.score ?? 0;

  // Interest rate adjustment
  const rateAdj = score < 25 ? 0 : score < 50 ? 0.5 : score < 75 ? 1.5 : 2.5;
  if (rateAdj > 0) {
    adjustments.push({
      type: "interest_rate",
      title: "Climate Risk Premium",
      description: `Apply a climate-adjusted interest rate premium to compensate for elevated default risk from physical climate hazards. Based on RBI Climate Risk Framework (2024).`,
      value: `+${rateAdj.toFixed(1)}% p.a.`,
      severity: classification === "Severe" ? "critical" : classification === "High" ? "warning" : "info",
    });
  }

  // Insurance requirements
  if (floodScore > 40) {
    adjustments.push({
      type: "insurance",
      title: floodScore > 65 ? "Mandatory Flood Insurance" : "Recommended Flood Cover",
      description: `Property is in ${floodScore > 65 ? "a high-probability flood zone" : "a moderate flood-risk area"}. ${floodScore > 65 ? "Flood insurance is a mandatory loan condition." : "Flood insurance is strongly recommended."}`,
      value: floodScore > 65 ? "Mandatory" : "Recommended",
      severity: floodScore > 65 ? "critical" : "warning",
    });
  }

  if (seaScore > 50) {
    adjustments.push({
      type: "insurance",
      title: "Coastal Hazard Insurance",
      description: "Significant sea-level rise exposure detected. Comprehensive coastal hazard coverage required including storm surge and tidal flooding events.",
      value: "Required",
      severity: seaScore > 70 ? "critical" : "warning",
    });
  }

  // Loan cap
  if (classification === "High" || classification === "Severe") {
    const capPct = classification === "Severe" ? 60 : 70;
    adjustments.push({
      type: "loan_cap",
      title: "Loan-to-Value Cap",
      description: `Restrict maximum LTV ratio to ${capPct}% due to elevated climate risk. Future asset devaluation from climate hazards may erode collateral value.`,
      value: `Max ${capPct}% LTV`,
      severity: classification === "Severe" ? "critical" : "warning",
    });
  }

  // Enhanced due diligence
  if (classification === "Severe") {
    adjustments.push({
      type: "enhanced_due_diligence",
      title: "Enhanced Climate Due Diligence",
      description: "Mandatory independent climate risk assessment by an accredited third-party environmental consultant before loan sanction. Board-level approval required for all loans above ₹5 Cr.",
      value: "Required",
      severity: "critical",
    });
  }

  // Positive note for low risk
  if (classification === "Low") {
    adjustments.push({
      type: "risk_warning",
      title: "Standard Lending Terms Applicable",
      description: "Climate risk assessment indicates low exposure. Standard lending terms apply. Annual climate risk review recommended as part of portfolio monitoring.",
      value: "No adjustment",
      severity: "info",
    });
  }

  // Agricultural special conditions
  if (propertyType === "agricultural" && score > 40) {
    adjustments.push({
      type: "risk_warning",
      title: "Kharif/Rabi Season Risk",
      description: "Agricultural property in a climate-stressed zone. Consider weather-indexed crop insurance linkage and staggered disbursement tied to seasonal rainfall assessment.",
      value: "Conditional",
      severity: "warning",
    });
  }

  return adjustments;
}

// ─────────────────────────────────────────────────────────────
// Seed data — pre-assessed properties for recent history
// ─────────────────────────────────────────────────────────────
export const SEED_ASSESSMENTS = [
  { id: "A001", location_name: "Bandra, Mumbai", property_type: "residential" as const, score: 74, classification: "High" as const, timestamp: "2024-02-17T09:30:00Z", loan_amount: 250 },
  { id: "A002", location_name: "Whitefield, Bengaluru", property_type: "commercial" as const, score: 41, classification: "Moderate" as const, timestamp: "2024-02-16T14:15:00Z", loan_amount: 180 },
  { id: "A003", location_name: "Jodhpur, Rajasthan", property_type: "residential" as const, score: 82, classification: "Severe" as const, timestamp: "2024-02-15T11:00:00Z", loan_amount: 95 },
  { id: "A004", location_name: "Koramangala, Bengaluru", property_type: "mixed_use" as const, score: 18, classification: "Low" as const, timestamp: "2024-02-14T16:45:00Z", loan_amount: 320 },
  { id: "A005", location_name: "Marina Beach, Chennai", property_type: "commercial" as const, score: 76, classification: "Severe" as const, timestamp: "2024-02-13T10:20:00Z", loan_amount: 450 },
];
