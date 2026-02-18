/**
 * Property Assessment Form
 * Loan officer inputs property location and type.
 */
import { useState } from "react";
import { MapPin, Loader2, Zap, Info } from "lucide-react";
import { PropertyAssessmentInput, PropertyType } from "@/types/climate";

interface AssessmentFormProps {
  onSubmit: (input: PropertyAssessmentInput) => void;
  isLoading: boolean;
}

const PROPERTY_TYPES: { value: PropertyType; label: string; desc: string }[] = [
  { value: "residential",  label: "Residential",  desc: "House, flat, villa" },
  { value: "commercial",   label: "Commercial",   desc: "Office, retail, hotel" },
  { value: "industrial",   label: "Industrial",   desc: "Factory, warehouse" },
  { value: "agricultural", label: "Agricultural", desc: "Farmland, plantation" },
  { value: "mixed_use",    label: "Mixed Use",    desc: "Combined residential/commercial" },
];

const QUICK_LOCATIONS = [
  { label: "Mumbai (Bandra)", lat: 19.054, lng: 72.841 },
  { label: "Chennai (Marina)", lat: 13.062, lng: 80.283 },
  { label: "Kolkata (Salt Lake)", lat: 22.581, lng: 88.416 },
  { label: "Jodhpur (City)", lat: 26.292, lng: 73.015 },
  { label: "Bengaluru (Whitefield)", lat: 12.978, lng: 77.730 },
];

export function AssessmentForm({ onSubmit, isLoading }: AssessmentFormProps) {
  const [form, setForm] = useState<PropertyAssessmentInput>({
    latitude: 19.076,
    longitude: 72.8777,
    property_type: "residential",
    loan_amount: 150,
    loan_tenure: 20,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const setQuickLocation = (lat: number, lng: number) => {
    setForm(f => ({ ...f, latitude: lat, longitude: lng }));
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 flex items-center gap-3" style={{ background: "var(--gradient-card-header)" }}>
        <MapPin className="w-5 h-5" style={{ color: "hsl(var(--secondary))" }} />
        <div>
          <h2 className="font-semibold text-sm" style={{ color: "hsl(var(--primary-foreground))" }}>
            Property Risk Assessment
          </h2>
          <p className="text-xs" style={{ color: "hsl(var(--primary-foreground) / 0.65)" }}>
            Input property coordinates for climate risk evaluation
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Quick locations */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Quick Select Location
          </label>
          <div className="flex flex-wrap gap-2">
            {QUICK_LOCATIONS.map(loc => (
              <button
                key={loc.label}
                type="button"
                onClick={() => setQuickLocation(loc.lat, loc.lng)}
                className="px-3 py-1.5 text-xs rounded-md border border-border font-medium transition-all hover:border-secondary hover:text-secondary"
                style={{
                  borderColor: form.latitude === loc.lat ? "hsl(var(--secondary))" : undefined,
                  color: form.latitude === loc.lat ? "hsl(var(--secondary))" : undefined,
                  background: form.latitude === loc.lat ? "hsl(var(--secondary-light))" : undefined,
                }}
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Coordinates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Latitude (°N)
            </label>
            <input
              type="number"
              step="0.0001"
              min="6"
              max="37"
              required
              value={form.latitude}
              onChange={e => setForm(f => ({ ...f, latitude: parseFloat(e.target.value) }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-mono transition-all focus:outline-none focus:ring-2 focus:border-secondary"
              style={{ "--tw-ring-color": "hsl(var(--secondary))" } as React.CSSProperties}
              placeholder="19.0760"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Longitude (°E)
            </label>
            <input
              type="number"
              step="0.0001"
              min="68"
              max="98"
              required
              value={form.longitude}
              onChange={e => setForm(f => ({ ...f, longitude: parseFloat(e.target.value) }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-mono transition-all focus:outline-none focus:ring-2 focus:border-secondary"
              placeholder="72.8777"
            />
          </div>
        </div>

        {/* Property type */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            Property Type
          </label>
          <div className="grid grid-cols-1 gap-2">
            {PROPERTY_TYPES.map(pt => (
              <label
                key={pt.value}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all"
                style={{
                  borderColor: form.property_type === pt.value ? "hsl(var(--secondary))" : "hsl(var(--border))",
                  background: form.property_type === pt.value ? "hsl(var(--secondary-light))" : "transparent",
                }}
              >
                <input
                  type="radio"
                  name="property_type"
                  value={pt.value}
                  checked={form.property_type === pt.value}
                  onChange={() => setForm(f => ({ ...f, property_type: pt.value }))}
                  className="accent-secondary"
                />
                <div>
                  <div className="text-sm font-medium text-foreground">{pt.label}</div>
                  <div className="text-xs text-muted-foreground">{pt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Loan details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Loan Amount (₹ Lakhs)
            </label>
            <input
              type="number"
              min="1"
              value={form.loan_amount ?? ""}
              onChange={e => setForm(f => ({ ...f, loan_amount: parseFloat(e.target.value) }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2"
              placeholder="150"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Tenure (Years)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={form.loan_tenure ?? ""}
              onChange={e => setForm(f => ({ ...f, loan_tenure: parseInt(e.target.value) }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2"
              placeholder="20"
            />
          </div>
        </div>

        {/* Info note */}
        <div className="flex gap-2 rounded-lg p-3 text-xs" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>Scores are computed using IMD, NATMO, IPCC AR6, and CWMI datasets. For regulatory use only.</span>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-150 disabled:opacity-60"
          style={{
            background: "hsl(var(--primary))",
            color: "hsl(var(--primary-foreground))",
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing Climate Data…
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Run Climate Risk Assessment
            </>
          )}
        </button>
      </form>
    </div>
  );
}
