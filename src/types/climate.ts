/**
 * Climate Risk Engine — Type Definitions
 * Mirrors the FastAPI backend Pydantic models
 */

export type PropertyType =
  | "residential"
  | "commercial"
  | "industrial"
  | "agricultural"
  | "mixed_use";

export type RiskClassification = "Low" | "Moderate" | "High" | "Severe";

export interface PropertyAssessmentInput {
  latitude: number;
  longitude: number;
  property_type: PropertyType;
  loan_amount?: number; // INR in lakhs
  loan_tenure?: number; // years
}

export interface ClimateFactorScore {
  factor: string;
  score: number;        // 0–100
  weight: number;       // 0–1, sums to 1
  weighted_score: number;
  description: string;
  data_source: string;
}

export interface LendingAdjustment {
  type: "interest_rate" | "insurance" | "risk_warning" | "loan_cap" | "enhanced_due_diligence";
  title: string;
  description: string;
  value?: string;       // e.g., "+1.5% p.a." or "Mandatory flood insurance"
  severity: "info" | "warning" | "critical";
}

export interface ProjectionDataPoint {
  year: number;
  flood_risk: number;
  heat_stress: number;
  sea_level_rise: number;
  water_scarcity: number;
  composite_risk: number;
}

export interface ClimateRiskReport {
  // Input echo
  latitude: number;
  longitude: number;
  property_type: PropertyType;
  location_name: string;
  region: string;

  // Core score
  climate_risk_score: number;         // 0–100
  risk_classification: RiskClassification;
  confidence_level: number;           // 0–1

  // Factor breakdown
  factors: ClimateFactorScore[];

  // 20-year projection
  projections: ProjectionDataPoint[];

  // Lending recommendations
  lending_adjustments: LendingAdjustment[];

  // Metadata
  assessment_date: string;
  model_version: string;
  data_vintage: string;
}

export interface RecentAssessment {
  id: string;
  location_name: string;
  property_type: PropertyType;
  score: number;
  classification: RiskClassification;
  timestamp: string;
  loan_amount?: number;
}
