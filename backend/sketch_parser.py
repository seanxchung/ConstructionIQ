"""Parse a hand-drawn site sketch on the ConstructionIQ 30x30 grid template.

Accepts an image (photo/scan of a highlighted grid), sends it to Claude Vision
to identify zone placements, and returns a spatial config matching the frontend schema.
"""

from __future__ import annotations

import base64
import json
import os
import uuid

from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = "claude-sonnet-4-20250514"

# Column letters: A=0, B=1, ... Z=25, AA=26, AB=27, AC=28, AD=29
COL_MAP = {}
for i in range(26):
    COL_MAP[chr(65 + i)] = i
COL_MAP["AA"] = 26
COL_MAP["AB"] = 27
COL_MAP["AC"] = 28
COL_MAP["AD"] = 29

ZONE_TYPE_MAP = {
    "building": "building",
    "bldg": "building",
    "bl": "building",
    "b": "building",
    "crane": "crane",
    "cr": "crane",
    "c": "crane",
    "workers": "workerZone",
    "worker zone": "workerZone",
    "worker": "workerZone",
    "wk": "workerZone",
    "w": "workerZone",
    "materials": "materialZone",
    "material zone": "materialZone",
    "material": "materialZone",
    "mat": "materialZone",
    "mt": "materialZone",
    "m": "materialZone",
    "road": "road",
    "access road": "road",
    "rd": "road",
    "r": "road",
    "office": "office",
    "site office": "office",
    "of": "office",
    "o": "office",
    "parking": "parking",
    "pk": "parking",
    "p": "parking",
    "fence": "fence",
    "fn": "fence",
    "f": "fence",
    "manlift": "manlift",
    "man lift": "manlift",
    "ml": "manlift",
    "delivery zone": "deliveryZone",
    "delivery": "deliveryZone",
    "dz": "deliveryZone",
    "dl": "deliveryZone",
    "truck staging": "truckStaging",
    "staging": "truckStaging",
    "ts": "truckStaging",
    "boundary": "boundary",
    "site boundary": "boundary",
    "bd": "boundary",
}

VISION_PROMPT = """You are analyzing a photograph/scan of a 30×30 construction site grid template.

The grid has:
- Columns labeled A through AD across the top (A=col 0, B=col 1, ... Z=col 25, AA=col 26, AB=col 27, AC=col 28, AD=col 29)
- Rows labeled 1 through 30 down the left side (Row 1=row 0 in zero-indexed, Row 30=row 29)

The user has outlined rectangular regions on this grid with a RED MARKER and written the zone type inside each region with a BLACK SHARPIE (e.g., "Building", "Crane", "Workers", "Materials", "Road", "Office", "Parking", "Fence", "Manlift", "Delivery Zone", "Truck Staging", "Boundary").

Look for RED outlines/rectangles to identify zone boundaries, and BLACK handwritten text inside to identify the zone type.

For roads, they may have drawn a red line of cells (1 cell wide) along a row or column.

Your task: identify every highlighted/drawn region and output a JSON array of zones.

For each zone, output:
{
  "type": "<zone type as written on grid>",
  "startCol": "<column letter of top-left cell, e.g. 'E'>",
  "startRow": <row number of top-left cell (1-indexed), e.g. 5>,
  "endCol": "<column letter of bottom-right cell, e.g. 'H'>",
  "endRow": <row number of bottom-right cell (1-indexed), e.g. 8>
}

For single-cell items like cranes, startCol=endCol and startRow=endRow.

For roads drawn as a line:
- Horizontal road: startRow=endRow, startCol and endCol span the line
- Vertical road: startCol=endCol, startRow and endRow span the line

RULES:
- Be precise about grid coordinates. Count carefully from the column/row labels.
- If you cannot read a label, make your best guess from context (e.g., a small square near a building is likely "Crane").
- If a region looks highlighted but has no label, skip it or label it "unknown".
- Output ONLY the JSON array. No explanation, no markdown fences.
- If nothing is drawn on the grid, return an empty array: []
"""


def _col_to_index(col_str: str) -> int:
    """Convert column letter(s) to 0-based index."""
    return COL_MAP.get(col_str.upper().strip(), -1)


def _row_to_index(row_num: int) -> int:
    """Convert 1-based row number to 0-based index."""
    return row_num - 1


def _new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def _normalize_type(raw_type: str) -> str:
    """Map user-written type labels to internal zone type IDs."""
    key = raw_type.lower().strip()
    if key in ZONE_TYPE_MAP:
        return ZONE_TYPE_MAP[key]
    for pattern, zone_type in ZONE_TYPE_MAP.items():
        if pattern in key or key in pattern:
            return zone_type
    return key


def parse_sketch_image(image_bytes: bytes, content_type: str = "image/jpeg") -> dict:
    """Send the grid image to Claude Vision and return parsed spatial config."""

    b64 = base64.standard_b64encode(image_bytes).decode("utf-8")

    media_type = content_type
    if media_type not in ("image/jpeg", "image/png", "image/gif", "image/webp"):
        media_type = "image/jpeg"

    response = client.messages.create(
        model=MODEL,
        max_tokens=4000,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": b64,
                    },
                },
                {
                    "type": "text",
                    "text": VISION_PROMPT,
                },
            ],
        }],
    )

    raw = response.content[0].text.strip()

    if raw.startswith("```"):
        lines = raw.split("\n")
        raw = "\n".join(lines[1:-1]) if len(lines) > 2 else raw
        if raw.startswith("json"):
            raw = raw[4:].strip()

    try:
        zones_raw = json.loads(raw)
    except json.JSONDecodeError:
        raise ValueError(f"Claude returned invalid JSON from sketch analysis.")

    if not isinstance(zones_raw, list):
        raise ValueError("Expected a JSON array of zones from sketch analysis.")

    return _convert_to_config(zones_raw)


def _convert_to_config(zones_raw: list[dict]) -> dict:
    """Convert Claude's zone array into the frontend spatial config format."""

    config = {
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

    warnings = []

    for zone in zones_raw:
        raw_type = zone.get("type", "unknown")
        zone_type = _normalize_type(raw_type)

        sc = _col_to_index(zone.get("startCol", "A"))
        sr = _row_to_index(zone.get("startRow", 1))
        ec = _col_to_index(zone.get("endCol", "A"))
        er = _row_to_index(zone.get("endRow", 1))

        if sc < 0 or ec < 0:
            warnings.append(f"Skipped zone '{raw_type}': invalid column reference")
            continue

        sc, ec = min(sc, ec), max(sc, ec)
        sr, er = min(sr, er), max(sr, er)

        sc = max(0, min(29, sc))
        ec = max(0, min(29, ec))
        sr = max(0, min(29, sr))
        er = max(0, min(29, er))

        w = ec - sc + 1
        h = er - sr + 1

        if zone_type == "road":
            for dy in range(h):
                for dx in range(w):
                    config["roads"].append({
                        "id": _new_id("road"),
                        "gridX": sc + dx,
                        "gridY": sr + dy,
                    })
        elif zone_type == "crane":
            config["cranes"].append({
                "id": _new_id("crane"),
                "gridX": sc,
                "gridY": sr,
                "type": "Tower Crane",
                "arrivalDay": 1,
                "departureDay": 90,
                "entryRoad": "",
                "notes": "",
            })
        elif zone_type == "building":
            config["buildings"].append({
                "id": _new_id("building"),
                "gridX": sc,
                "gridY": sr,
                "width": w,
                "height": h,
                "floors": 5,
                "buildingType": "office",
            })
        elif zone_type == "workerZone":
            config["workerZones"].append({
                "id": _new_id("wk"),
                "gridX": sc,
                "gridY": sr,
                "width": w,
                "height": h,
            })
        elif zone_type == "materialZone":
            config["materialZones"].append({
                "id": _new_id("mat"),
                "gridX": sc,
                "gridY": sr,
                "width": w,
                "height": h,
            })
        elif zone_type == "office":
            config["offices"].append({
                "id": _new_id("of"),
                "gridX": sc,
                "gridY": sr,
                "width": w,
                "height": h,
            })
        elif zone_type == "parking":
            config["parking"].append({
                "id": _new_id("pk"),
                "gridX": sc,
                "gridY": sr,
                "width": w,
                "height": h,
            })
        elif zone_type == "fence":
            for dy in range(h):
                for dx in range(w):
                    config["fences"].append({
                        "id": _new_id("fence"),
                        "gridX": sc + dx,
                        "gridY": sr + dy,
                    })
        elif zone_type == "manlift":
            config["manlifts"].append({
                "id": _new_id("ml"),
                "gridX": sc,
                "gridY": sr,
            })
        elif zone_type == "deliveryZone":
            config["deliveryZones"].append({
                "id": _new_id("dz"),
                "gridX": sc,
                "gridY": sr,
                "width": w,
                "height": h,
            })
        elif zone_type == "truckStaging":
            config["truckStaging"].append({
                "id": _new_id("ts"),
                "gridX": sc,
                "gridY": sr,
                "width": w,
                "height": h,
            })
        elif zone_type == "boundary":
            for dy in range(h):
                for dx in range(w):
                    config["boundaries"].append({
                        "id": _new_id("bound"),
                        "gridX": sc + dx,
                        "gridY": sr + dy,
                    })
        else:
            warnings.append(f"Unknown zone type '{raw_type}' at ({sc},{sr}) — skipped")

    zone_count = sum(len(v) for v in config.values())

    return {
        "config": config,
        "zone_count": zone_count,
        "warnings": warnings,
    }
