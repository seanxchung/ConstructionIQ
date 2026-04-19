"""Test the resource-gated build progress system with 3 scenarios."""

import json
from simulation import simulate_building_progress

GRID = 30

def make_zone(zone_type, x, y, w=1, h=1):
    return {"type": zone_type, "x": x, "y": y, "width": w, "height": h}

ROADS = [make_zone("road", i, 0) for i in range(10)] + \
        [make_zone("road", 0, i) for i in range(1, 10)]
WORKERS_3 = [
    make_zone("workers", 5, 5, 2, 2),
    make_zone("workers", 10, 5, 2, 2),
    make_zone("workers", 15, 5, 2, 2),
]
MATERIALS_3 = [
    make_zone("materials", 5, 10, 3, 2),
    make_zone("materials", 10, 10, 3, 2),
    make_zone("materials", 15, 10, 3, 2),
]
CRANES_2 = [
    make_zone("crane", 8, 15, 2, 2),
    make_zone("crane", 14, 15, 2, 2),
]
BUILDING = [make_zone("building", 20, 15, 6, 6)]


def print_result(label, result, show_all_stalled=False):
    print(f"\n{'='*70}")
    print(f"  SCENARIO: {label}")
    print(f"{'='*70}")
    summary = {k: v for k, v in result.items() if k != "daily_history"}
    print(json.dumps(summary, indent=2))

    history = result["daily_history"]
    if show_all_stalled:
        stalled = [e for e in history if e["status"] == "stalled"]
        print(f"\n  Stalled days ({len(stalled)} total):")
        for entry in stalled[:5]:
            print(f"    Day {entry['day']:3d}: modifier={entry['modifier']:.4f}  "
                  f"build_pct={entry['build_pct']:.2f}%")
        if len(stalled) > 5:
            print(f"    ... and {len(stalled) - 5} more stalled days")
    print(f"\n  Daily history (last 5 days):")
    for entry in history[-5:]:
        print(f"    Day {entry['day']:3d}: modifier={entry['modifier']:.4f}  "
              f"status={entry['status']:<10s}  build_pct={entry['build_pct']:.2f}%")


# ── Scenario 1: Ideal ────────────────────────────────────────────────────────
zones_ideal = BUILDING + CRANES_2 + WORKERS_3 + MATERIALS_3 + ROADS
result1 = simulate_building_progress(zones_ideal, 90, 30)
print_result("IDEAL (2 cranes, 3 workers, 3 materials, roads) — day=30, dur=90", result1)

# ── Scenario 2: No cranes — test at day 40 (mid-steel-erection) ─────────────
zones_no_cranes = BUILDING + WORKERS_3 + MATERIALS_3 + ROADS
result2 = simulate_building_progress(zones_no_cranes, 90, 50)
print_result("NO CRANES — day=50, dur=90", result2, show_all_stalled=True)

# ── Scenario 3: No materials ────────────────────────────────────────────────
zones_no_mats = BUILDING + CRANES_2 + WORKERS_3 + ROADS
result3 = simulate_building_progress(zones_no_mats, 90, 30)
print_result("NO MATERIALS — day=30, dur=90", result3, show_all_stalled=True)

# ── Scenario 3b: No materials at day 20 (to catch mid-foundation-forming) ──
result3b = simulate_building_progress(zones_no_mats, 90, 20)
print_result("NO MATERIALS — day=20, dur=90 (mid-foundation)", result3b, show_all_stalled=True)
