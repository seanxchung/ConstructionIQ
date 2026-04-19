"""PDF text extraction + Claude-based structuring for ConstructionIQ project briefs.

Accepts raw PDF bytes from a filled-out project brief template, extracts the
text via pdfplumber, then asks Claude to produce a valid project_config JSON.
"""

from __future__ import annotations

import io
import json
import os

import pdfplumber
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

MODEL = "claude-sonnet-4-20250514"

SYSTEM_PROMPT = """You are a parser that converts construction project briefs into structured JSON configurations for a construction simulation system.

Input: raw text extracted from a filled-out project brief PDF.
Output: valid JSON matching the project_config schema.

SCHEMA:
{
  "_projectType": string (optional — from "Project type" field, e.g. "data center", "office"),
  "_buildingFloors": int (optional — from "Building floors" field),
  "_numBuildings": int (optional — 1 or 2, infer from project name/context or default to 1),
  "_buildingSize": string (optional — "small", "medium", or "large", from Building footprint size),
  "phases": [
    {"id": string, "name": string, "startDay": int, "endDay": int, "color": string}
  ],
  "cranes": [
    {"id": string, "x": int, "y": int, "type": string, "arrivalDay": int, "departureDay": int, "entryRoad": string, "notes": string}
  ],
  "deliveries": [
    {"id": string, "material": string, "destination": string, "days": string, "recurring": string, "truckCount": int, "entryPoint": string, "timeWindow": string, "notes": string}
  ],
  "workforce": {
    "<phase_id>": {"total": int, "laborers": int, "carpenters": int, "ironworkers": int, "operators": int, "electricians": int, "plumbers": int, "painters": int, "hvac": int, "glaziers": int, "other": int}
  },
  "equipment": [],
  "milestones": [
    {"id": string, "name": string, "day": int, "type": string, "impact": string, "notes": string}
  ]
}

RULES:
- If a field is blank in the brief, OMIT it from the output (do not invent values).
- If the user typed "n/a", "N/A", or left underscores untouched, treat as blank.
- phase id should be snake_case of the phase name (e.g., "Site Preparation" -> "site-prep").
- Phase colors: use these mappings by name:
    Site Preparation -> #64748b
    Foundation -> #3b82f6
    Structural -> #8b5cf6
    MEP -> #f59e0b
    Finishing -> #22c55e
    Closeout -> #ef4444
    (for other phase names, use #64748b)
- For workforce, include ONLY fields the user filled. Do not add zero-valued keys.
- Crane x/y coordinates and delivery destinations/entry points cannot be inferred from the brief; omit them. The user will set these via the site plan grid.
- Milestone types: map to "Concrete Pour" / "Inspection Day" / "Steel Erection Start" / "MEP Rough-In Start" / "Owner Walkthrough" / "Substantial Completion" / "Weather Buffer" / "Subcontractor Mobilization" based on the user's written description. Default to "Inspection Day" if unclear.
- _projectType should come directly from the 'Project type:' line. If blank, omit.
- _buildingFloors should come from the 'Building floors:' line. If blank, omit.
- _numBuildings: read the 'Number of buildings' line. If blank, infer from project description. If the brief mentions 'tower A' or 'phase 1' suggesting multiple buildings, use 2. Otherwise default to 1. Must be 1 or 2.
- _buildingSize: read the 'Building footprint size' line. Accept 'small', 'medium', 'large' (case insensitive). If blank, omit and let the system auto-size from floors.
- Output ONLY the JSON object. No preamble, no explanation, no markdown fences.

If the input text is clearly not from a ConstructionIQ brief (too short, totally unstructured, missing key sections), return: {"error": "This does not appear to be a valid ConstructionIQ project brief."}
"""

FEW_SHOT_EXAMPLE = """EXAMPLE INPUT:
CONSTRUCTIQ PROJECT BRIEF

PROJECT BASICS
Project name: Tower A
Total duration (days): 90
Project type: office building
Building floors: 10

CONSTRUCTION PHASES
Phase 1: Site Preparation   Days 1 to 8
Phase 2: Foundation         Days 9 to 25
Phase 3: Structural         Days 26 to 60

WORKFORCE BY PHASE
FOUNDATION
  Total workers: 25
  Laborers: 12  Carpenters: 8  Ironworkers: 3  Operators: 2

MATERIAL DELIVERIES
Concrete deliveries on days: 10, 14, 18, 22

EXAMPLE OUTPUT:
{"_projectType":"office building","_buildingFloors":10,"_numBuildings":1,"phases":[{"id":"site-prep","name":"Site Preparation","startDay":1,"endDay":8,"color":"#64748b"},{"id":"foundation","name":"Foundation","startDay":9,"endDay":25,"color":"#3b82f6"},{"id":"structural","name":"Structural","startDay":26,"endDay":60,"color":"#8b5cf6"}],"cranes":[],"deliveries":[{"id":"del-concrete","material":"Concrete","destination":"","days":"10, 14, 18, 22","recurring":"None","truckCount":1,"entryPoint":"","timeWindow":"Morning 8-10am","notes":""}],"workforce":{"foundation":{"total":25,"laborers":12,"carpenters":8,"ironworkers":3,"operators":2}},"equipment":[],"milestones":[]}
"""


async def parse_project_brief_pdf(pdf_bytes: bytes) -> dict:
    """Extract text from a project brief PDF and structure it into config JSON via Claude."""

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        pages_text = []
        for page in pdf.pages:
            text = page.extract_text() or ""
            pages_text.append(text)
        full_text = "\n".join(pages_text)

    if len(full_text.strip()) < 50:
        raise ValueError(
            "PDF appears empty or text extraction failed. "
            "Ensure the PDF is not a scanned image."
        )

    response = client.messages.create(
        model=MODEL,
        max_tokens=4000,
        system=SYSTEM_PROMPT + "\n\n" + FEW_SHOT_EXAMPLE,
        messages=[{"role": "user", "content": f"Parse this project brief:\n\n{full_text}"}],
    )

    raw_output = response.content[0].text.strip()

    if raw_output.startswith("```"):
        lines = raw_output.split("\n")
        raw_output = "\n".join(lines[1:-1]) if len(lines) > 2 else raw_output
        if raw_output.startswith("json"):
            raw_output = raw_output[4:].strip()

    try:
        config = json.loads(raw_output)
    except json.JSONDecodeError:
        raise ValueError("Claude returned invalid JSON. PDF may be malformed.")

    if "error" in config:
        raise ValueError(config["error"])

    warnings: list[str] = []
    required_keys = ["phases", "cranes", "deliveries", "workforce", "equipment", "milestones"]
    for k in required_keys:
        if k not in config:
            config[k] = [] if k != "workforce" else {}
            warnings.append(f"Missing '{k}' in parsed output; defaulted to empty.")

    # Generate spatial layout from the parsed temporal config
    num_buildings = config.pop("_numBuildings", 1) if "_numBuildings" in config else 1
    building_floors = config.pop("_buildingFloors", 5) if "_buildingFloors" in config else 5
    project_type = config.pop("_projectType", "") if "_projectType" in config else ""

    explicit_size = config.pop("_buildingSize", None) if "_buildingSize" in config else None
    if explicit_size:
        size_map = {"small": 4, "medium": 6, "large": 8}
        building_size = size_map.get(explicit_size.lower(), 6)
    else:
        building_size = 6
        if building_floors >= 15:
            building_size = 8
        elif building_floors <= 3:
            building_size = 4

    config_for_layout = dict(config)
    config_for_layout["_projectType"] = project_type
    config_for_layout["_buildingFloors"] = building_floors

    layout = generate_layout_from_brief(
        config_for_layout,
        num_buildings=num_buildings,
        building_size=building_size,
    )

    # Auto-assign delivery entry points and destinations from the generated layout
    GRID_SIZE = 30

    # Collect several spread-out edge road cells for entry point rotation
    edge_road_indices = []
    for road in layout.get("roads", []):
        rx, ry = road["gridX"], road["gridY"]
        if ry == 0 and rx % 6 == 3:
            edge_road_indices.append(ry * GRID_SIZE + rx)
    if not edge_road_indices:
        for road in layout.get("roads", []):
            rx, ry = road["gridX"], road["gridY"]
            if ry == 0 or rx == 0:
                edge_road_indices.append(ry * GRID_SIZE + rx)
                if len(edge_road_indices) >= 4:
                    break

    # Use material zone origins as destinations, rotating across them
    material_dest_indices = []
    for mz in layout.get("materialZones", []):
        material_dest_indices.append(mz["gridY"] * GRID_SIZE + mz["gridX"])

    deliveries = config.get("deliveries", [])
    for i, delivery in enumerate(deliveries):
        if not delivery.get("entryPoint") and edge_road_indices:
            delivery["entryPoint"] = str(edge_road_indices[i % len(edge_road_indices)])
        if not delivery.get("destination") and material_dest_indices:
            delivery["destination"] = str(material_dest_indices[i % len(material_dest_indices)])

    # layout's "cranes" has full spatial + temporal objects, replacing temporal-only
    merged_config = {**config, **layout}

    return {"config": merged_config, "warnings": warnings}


def generate_layout_from_brief(config: dict, num_buildings: int = 1, building_size: int = 6) -> dict:
    """Generate a reasonable spatial layout based on the parsed temporal config.

    Places zones on a 30x30 grid using deterministic rules:
    - 1 building centered (or 2 buildings side-by-side)
    - Cranes flanking each building
    - Worker zones near buildings
    - Material zones with road access
    - Perimeter road on one edge
    - Truck staging at road entry

    Returns a dict with spatial arrays matching the frontend schema.
    """
    import uuid

    GRID = 30

    def new_id(prefix: str) -> str:
        return f"{prefix}-{uuid.uuid4().hex[:8]}"

    layout = {
        "buildings": [],
        "workerZones": [],
        "materialZones": [],
        "roads": [],
        "offices": [],
        "parking": [],
        "fences": [],
        "manlifts": [],
        "deliveryZones": [],
        "truckStaging": [],
        "boundaries": [],
        "cranes": [],
    }

    temporal_cranes = config.get("cranes", [])

    num_buildings = max(1, min(2, num_buildings))
    bsize = max(4, min(10, building_size))

    if num_buildings == 1:
        bx = (GRID - bsize) // 2
        by = (GRID - bsize) // 2
        building_type = _infer_building_type(config)
        floors = _infer_floors(config)
        layout["buildings"].append({
            "id": new_id("building"),
            "gridX": bx,
            "gridY": by,
            "width": bsize,
            "height": bsize,
            "floors": floors,
            "buildingType": building_type,
        })
        building_positions = [(bx, by, bsize, bsize)]
    else:
        total_w = bsize * 2 + 2
        start_x = (GRID - total_w) // 2
        by = (GRID - bsize) // 2
        for i in range(2):
            bx = start_x + i * (bsize + 2)
            layout["buildings"].append({
                "id": new_id("building"),
                "gridX": bx,
                "gridY": by,
                "width": bsize,
                "height": bsize,
                "floors": _infer_floors(config),
                "buildingType": _infer_building_type(config),
            })
        building_positions = [
            (start_x, by, bsize, bsize),
            (start_x + bsize + 2, by, bsize, bsize),
        ]

    # Perimeter roads: top (y=0), left (x=0), and bottom (y=GRID-2) for material access
    for x in range(GRID):
        layout["roads"].append({"id": new_id("road"), "gridX": x, "gridY": 0})
    for y in range(1, GRID):
        layout["roads"].append({"id": new_id("road"), "gridX": 0, "gridY": y})
    for x in range(1, GRID):
        layout["roads"].append({"id": new_id("road"), "gridX": x, "gridY": GRID - 2})

    # Truck staging at road entry
    layout["truckStaging"].append({
        "id": new_id("ts"),
        "gridX": 2,
        "gridY": 2,
        "width": 3,
        "height": 2,
    })

    # Cranes flanking buildings — merge with temporal metadata
    for i, (bx, by, bw, bh) in enumerate(building_positions):
        crane_x = min(bx + bw + 1, GRID - 2)
        crane_y = by + bh // 2 - 1
        crane_y = max(0, min(crane_y, GRID - 2))

        temporal = temporal_cranes[i] if i < len(temporal_cranes) else {}
        layout["cranes"].append({
            "id": new_id("crane"),
            "gridX": crane_x,
            "gridY": crane_y,
            "type": temporal.get("type", "Tower Crane"),
            "arrivalDay": temporal.get("arrivalDay", 1),
            "departureDay": temporal.get("departureDay", 90),
            "entryRoad": "",
            "notes": temporal.get("notes", ""),
        })

    # Worker zones — sized to peak workforce demand
    workforce_by_phase = config.get("workforce", {})
    peak_workers = 0
    for phase_id, wf in workforce_by_phase.items():
        if isinstance(wf, dict):
            total = wf.get("total", 0)
            if isinstance(total, (int, float)) and total > peak_workers:
                peak_workers = int(total)

    WORKERS_PER_ZONE = 25
    zones_needed = max(2, (peak_workers + WORKERS_PER_ZONE - 1) // WORKERS_PER_ZONE) if peak_workers > 0 else 2
    zones_needed = min(zones_needed, 6)

    first_b = building_positions[0]
    last_b = building_positions[-1]
    worker_positions = []

    worker_y_top = max(2, first_b[1] - 3)
    if worker_y_top + 2 <= first_b[1] - 1:
        x = first_b[0]
        while x + 2 <= last_b[0] + last_b[2] and len(worker_positions) < zones_needed:
            worker_positions.append((x, worker_y_top))
            x += 3

    worker_y_bot = first_b[1] + first_b[3] + 1
    if worker_y_bot + 2 <= GRID - 1:
        x = first_b[0]
        while x + 2 <= last_b[0] + last_b[2] and len(worker_positions) < zones_needed:
            worker_positions.append((x, worker_y_bot))
            x += 3

    if len(worker_positions) < zones_needed:
        left_x = max(2, first_b[0] - 3)
        if left_x + 2 <= first_b[0] - 1:
            y = first_b[1]
            while y + 2 <= first_b[1] + first_b[3] and len(worker_positions) < zones_needed:
                worker_positions.append((left_x, y))
                y += 3

    for wx, wy in worker_positions:
        layout["workerZones"].append({
            "id": new_id("wk"),
            "gridX": wx,
            "gridY": wy,
            "width": 2,
            "height": 2,
        })

    # Material zones along bottom of site
    mat_y = GRID - 4
    layout["materialZones"].append({
        "id": new_id("mat"),
        "gridX": 3,
        "gridY": mat_y,
        "width": 3,
        "height": 2,
    })
    layout["materialZones"].append({
        "id": new_id("mat"),
        "gridX": 7,
        "gridY": mat_y,
        "width": 3,
        "height": 2,
    })

    # Office
    layout["offices"].append({
        "id": new_id("of"),
        "gridX": 3,
        "gridY": 6,
        "width": 4,
        "height": 2,
    })

    # Parking
    layout["parking"].append({
        "id": new_id("pk"),
        "gridX": 3,
        "gridY": 9,
        "width": 4,
        "height": 3,
    })

    return layout


def _infer_building_type(config: dict) -> str:
    """Guess building type from project notes / context."""
    project_type = config.get("_projectType", "").lower() if config.get("_projectType") else ""
    if "data" in project_type and "cent" in project_type:
        return "data_center"
    if "warehouse" in project_type or "distribution" in project_type:
        return "warehouse"
    if "residential" in project_type or "apartment" in project_type:
        return "residential"
    return "office"


def _infer_floors(config: dict) -> int:
    """Guess floor count from config. Defaults to 5."""
    floors = config.get("_buildingFloors")
    if floors and isinstance(floors, int) and 1 <= floors <= 50:
        return floors
    return 5
