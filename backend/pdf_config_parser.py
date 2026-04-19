"""PDF text extraction + Claude-based structuring for ConstructIQ project briefs.

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
- Output ONLY the JSON object. No preamble, no explanation, no markdown fences.

If the input text is clearly not from a ConstructIQ brief (too short, totally unstructured, missing key sections), return: {"error": "This does not appear to be a valid ConstructIQ project brief."}
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
{"phases":[{"id":"site-prep","name":"Site Preparation","startDay":1,"endDay":8,"color":"#64748b"},{"id":"foundation","name":"Foundation","startDay":9,"endDay":25,"color":"#3b82f6"},{"id":"structural","name":"Structural","startDay":26,"endDay":60,"color":"#8b5cf6"}],"cranes":[],"deliveries":[{"id":"del-concrete","material":"Concrete","destination":"","days":"10, 14, 18, 22","recurring":"None","truckCount":1,"entryPoint":"","timeWindow":"Morning 8-10am","notes":""}],"workforce":{"foundation":{"total":25,"laborers":12,"carpenters":8,"ironworkers":3,"operators":2}},"equipment":[],"milestones":[]}
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

    return {"config": config, "warnings": warnings}
