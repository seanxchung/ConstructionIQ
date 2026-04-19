// Preset scenario library for v1 (presets-only, no AI generation).
// Each scenario triggers at a fraction of total project duration.

export const PRESET_SCENARIOS = [
  {
    id: "crane_breakdown",
    label: "Crane Breakdown",
    triggerType: "equipment_failure",
    triggerDayFraction: 0.35,
    baseProbability: 0.18,
    baseCostImpact: 285000,
    description:
      "Tower crane at J12 experiences mechanical failure during peak structural phase.",
    perturbation: { type: "crane_breakdown", params: { duration_days: 5 } },
    recoveries: [
      {
        id: "crane_breakdown_wait",
        label: "Wait for Repair",
        description:
          "Pause affected work for 5 days while OEM technician arrives and completes repair.",
        probability: 0.6,
        costImpact: 75000,
        scheduleDelta: 5,
        perturbation: {
          type: "crane_breakdown",
          params: { duration_days: 5 },
        },
      },
      {
        id: "crane_breakdown_mobile",
        label: "Rent Mobile Crane",
        description:
          "Mobilize mobile crane within 24hr to minimize schedule impact. Higher rental cost.",
        probability: 0.4,
        costImpact: 45000,
        scheduleDelta: 1,
        perturbation: {
          type: "crane_breakdown",
          params: { duration_days: 1 },
        },
      },
    ],
  },
  {
    id: "steel_delay",
    label: "Steel Delivery Delay",
    triggerType: "material_delay",
    triggerDayFraction: 0.45,
    baseProbability: 0.22,
    baseCostImpact: 180000,
    description:
      "Structural steel shipment delayed 8 days due to mill backlog. Erection sequence at risk.",
    perturbation: {
      type: "material_delay",
      params: { affected_material: "steel", duration_days: 8 },
    },
    recoveries: [
      {
        id: "steel_delay_resequence",
        label: "Resequence Work",
        description:
          "Shift MEP rough-in earlier while waiting for steel. Parallel path reduces schedule hit.",
        probability: 0.55,
        costImpact: 30000,
        scheduleDelta: 3,
        perturbation: {
          type: "material_delay",
          params: { affected_material: "steel", duration_days: 3 },
        },
      },
      {
        id: "steel_delay_expedite",
        label: "Expedite Shipment",
        description:
          "Pay premium for air freight on critical-path members. Maintains schedule.",
        probability: 0.45,
        costImpact: 120000,
        scheduleDelta: 0,
        perturbation: {
          type: "material_delay",
          params: { affected_material: "steel", duration_days: 0 },
        },
      },
    ],
  },
  {
    id: "weather_shutdown",
    label: "Weather Shutdown",
    triggerType: "weather",
    triggerDayFraction: 0.25,
    baseProbability: 0.28,
    baseCostImpact: 95000,
    description:
      "3-day storm event halts outdoor work. Site protection and cleanup required.",
    perturbation: { type: "weather_shutdown", params: { duration_days: 3 } },
    recoveries: [
      {
        id: "weather_accept",
        label: "Accept Delay",
        description: "Absorb 3-day schedule slip. No additional action.",
        probability: 0.7,
        costImpact: 45000,
        scheduleDelta: 3,
        perturbation: {
          type: "weather_shutdown",
          params: { duration_days: 3 },
        },
      },
      {
        id: "weather_weekend",
        label: "Work Weekend Recovery",
        description:
          "Schedule overtime weekends to recover lost days. Crew premium costs apply.",
        probability: 0.3,
        costImpact: 65000,
        scheduleDelta: 0,
        perturbation: {
          type: "weather_shutdown",
          params: { duration_days: 0 },
        },
      },
    ],
  },
  {
    id: "labor_shortage",
    label: "Ironworker Shortage",
    triggerType: "labor_shortage",
    triggerDayFraction: 0.4,
    baseProbability: 0.15,
    baseCostImpact: 220000,
    description:
      "Regional ironworker shortage reduces available crew by 40% during structural phase.",
    perturbation: {
      type: "labor_shortage",
      params: { pct_reduction: 40, duration_days: 14 },
    },
    recoveries: [
      {
        id: "labor_travel",
        label: "Travel Crew Premium",
        description:
          "Import crew from out-of-region. Per diem + travel costs but maintains pace.",
        probability: 0.5,
        costImpact: 140000,
        scheduleDelta: 2,
        perturbation: {
          type: "labor_shortage",
          params: { pct_reduction: 10, duration_days: 14 },
        },
      },
      {
        id: "labor_extend",
        label: "Extend Schedule",
        description:
          "Accept reduced crew, extend structural phase timeline proportionally.",
        probability: 0.5,
        costImpact: 90000,
        scheduleDelta: 9,
        perturbation: {
          type: "labor_shortage",
          params: { pct_reduction: 40, duration_days: 14 },
        },
      },
    ],
  },
  {
    id: "concrete_curing",
    label: "Concrete Curing Delay",
    triggerType: "material_delay",
    triggerDayFraction: 0.2,
    baseProbability: 0.12,
    baseCostImpact: 65000,
    description:
      "Cold snap extends concrete cure time beyond spec. Structural load testing delayed.",
    perturbation: { type: "concrete_curing", params: { duration_days: 4 } },
    recoveries: [
      {
        id: "curing_heat",
        label: "Heated Enclosures",
        description:
          "Deploy heated enclosures and accelerator admixtures. Cost premium, full schedule recovery.",
        probability: 0.65,
        costImpact: 35000,
        scheduleDelta: 0,
        perturbation: {
          type: "concrete_curing",
          params: { duration_days: 0 },
        },
      },
      {
        id: "curing_wait",
        label: "Extend Cure Window",
        description:
          "Accept extended cure time, absorb schedule delay.",
        probability: 0.35,
        costImpact: 20000,
        scheduleDelta: 4,
        perturbation: {
          type: "concrete_curing",
          params: { duration_days: 4 },
        },
      },
    ],
  },
  {
    id: "inspection_fail",
    label: "Inspection Failure",
    triggerType: "inspection_fail",
    triggerDayFraction: 0.6,
    baseProbability: 0.1,
    baseCostImpact: 340000,
    description:
      "Building inspector flags MEP rough-in deficiency. Rework required before closeout.",
    perturbation: { type: "inspection_fail", params: { rollback_days: 7 } },
    recoveries: [
      {
        id: "inspection_rework",
        label: "Rework Per Spec",
        description:
          "Full rework to code. Standard approach, full schedule and cost impact.",
        probability: 0.75,
        costImpact: 180000,
        scheduleDelta: 7,
        perturbation: {
          type: "inspection_fail",
          params: { rollback_days: 7 },
        },
      },
      {
        id: "inspection_variance",
        label: "File Variance Request",
        description:
          "Pursue engineered variance with AHJ. Risk of denial but potential schedule save.",
        probability: 0.25,
        costImpact: 45000,
        scheduleDelta: 2,
        perturbation: {
          type: "inspection_fail",
          params: { rollback_days: 2 },
        },
      },
    ],
  },
];

export function selectScenarios(projectDuration, mainConflicts = []) {
  const conflictTypes = new Set(mainConflicts.map((c) => c.type));

  const scored = PRESET_SCENARIOS.map((s) => {
    const triggerDay = Math.floor(s.triggerDayFraction * projectDuration);
    const fitsInProject = triggerDay > 0 && triggerDay < projectDuration;
    let score = s.baseProbability;
    if (conflictTypes.has(s.triggerType)) score += 0.3;
    return { scenario: s, score, triggerDay, eligible: fitsInProject };
  }).filter((x) => x.eligible);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((x) => ({ ...x.scenario, triggerDay: x.triggerDay }));
}
