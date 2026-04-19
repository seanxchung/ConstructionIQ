"""One-time script to generate the ConstructionIQ Project Brief PDF template.

Usage:
    python backend/generate_template.py

Output:
    frontend/public/constructiq_project_brief_template.pdf
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

PAGE_W, PAGE_H = letter
OUTPUT_PATH = os.path.join(
    os.path.dirname(__file__), "..", "frontend", "public", "constructiq_project_brief_template.pdf"
)

HEADER_STYLE = ParagraphStyle(
    "Header",
    fontName="Helvetica-Bold",
    fontSize=18,
    leading=24,
    textColor="#1a1a2e",
    spaceAfter=6,
)

SECTION_STYLE = ParagraphStyle(
    "Section",
    fontName="Helvetica-Bold",
    fontSize=12,
    leading=16,
    textColor="#1a1a2e",
    spaceBefore=4,
    spaceAfter=4,
)

BODY_STYLE = ParagraphStyle(
    "Body",
    fontName="Courier",
    fontSize=10,
    leading=16,
    textColor="#333333",
)

INSTRUCTIONS_STYLE = ParagraphStyle(
    "Instructions",
    fontName="Helvetica",
    fontSize=9,
    leading=13,
    textColor="#555555",
    spaceAfter=4,
)

DIVIDER = "\u2501" * 50


def build_pdf():
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.6 * inch,
        bottomMargin=0.6 * inch,
    )

    story = []
    add = story.append

    def header(text):
        add(Paragraph(text, HEADER_STYLE))

    def section(text):
        add(Spacer(1, 6))
        add(Paragraph(DIVIDER, BODY_STYLE))
        add(Paragraph(text, SECTION_STYLE))
        add(Paragraph(DIVIDER, BODY_STYLE))
        add(Spacer(1, 4))

    def body(text):
        add(Paragraph(text, BODY_STYLE))

    def instructions(text):
        add(Paragraph(text, INSTRUCTIONS_STYLE))

    def gap(h=8):
        add(Spacer(1, h))

    U = "______"
    UL = "______________________________"
    UXL = "_______________________________________________"

    header("CONSTRUCTIQ PROJECT BRIEF")
    gap(4)
    instructions(
        "Instructions: Fill in blanks below. Leave blank for &quot;not applicable&quot; or &quot;use default&quot;."
    )
    instructions(
        "Do not change section headings. Save as PDF and upload to ConstructionIQ Configure tab."
    )

    # ── Project Basics ──
    section("PROJECT BASICS")
    body(f"Project name:            {UL}")
    body(f"Total duration (days):   {U}")
    body(f"Project type:            {UL}")
    instructions("         (e.g. data center, office building, warehouse)")
    gap(4)
    body(f"Building floors:         {U}")
    body("Grid size:               30x30 (default, do not change)")

    # ── Site Layout Hints ──
    section("SITE LAYOUT HINTS")
    instructions(
        "Optional hints for auto-generated site layout. Leave blank for single building defaults."
    )
    gap(4)
    body(f"Number of buildings (1 or 2):   {U}")
    body(f"Building footprint size:        {U}")
    instructions("         (small = 4x4, medium = 6x6, large = 8x8; leave blank for auto-size based on floors)")

    # ── Construction Phases ──
    section("CONSTRUCTION PHASES")
    instructions(
        "List each phase with start day and end day. "
        "Standard phases: Site Preparation, Foundation, Structural, MEP, Finishing, Closeout."
    )
    gap(4)
    for i in range(1, 7):
        body(f"Phase {i}:  _______________________  Days {U} to {U}")

    # ── Workforce By Phase ──
    section("WORKFORCE BY PHASE")
    instructions(
        "For each phase, list total worker count and role breakdown. Leave blank to use defaults."
    )
    gap(4)

    body("SITE PREPARATION")
    body(f"  Total workers:         {U}")
    body(f"  Laborers: {U}  Operators: {U}")
    gap(6)
    body("FOUNDATION")
    body(f"  Total workers:         {U}")
    body(f"  Laborers: {U}  Carpenters: {U}  Ironworkers: {U}  Operators: {U}")
    gap(6)
    body("STRUCTURAL")
    body(f"  Total workers:         {U}")
    body(f"  Laborers: {U}  Carpenters: {U}  Ironworkers: {U}  Operators: {U}")
    gap(6)
    body("MEP")
    body(f"  Total workers:         {U}")
    body(f"  Laborers: {U}  Electricians: {U}  Plumbers: {U}  Operators: {U}")
    gap(6)
    body("FINISHING")
    body(f"  Total workers:         {U}")
    body(f"  Laborers: {U}  Carpenters: {U}  Painters: {U}  Operators: {U}")
    gap(6)
    body("CLOSEOUT")
    body(f"  Total workers:         {U}")
    body(f"  Laborers: {U}  Operators: {U}")

    # ── Crane Configuration ──
    section("CRANE CONFIGURATION")
    for c in range(1, 3):
        body(f"Crane {c}:")
        body(f"  Type (Tower/Mobile/Boom):  {UL}")
        body(f"  Arrival day: {U}   Departure day: {U}")
        body(f"  Notes: {UXL}")
        gap(6)

    # ── Material Deliveries ──
    section("MATERIAL DELIVERIES")
    instructions("For each delivery type, list scheduled days (comma separated).")
    gap(4)
    body(f"Concrete deliveries on days:      {UL}")
    body(f"Rebar deliveries on days:         {UL}")
    body(f"Structural steel on days:         {UL}")
    body(f"MEP conduit on days:              {UL}")
    body(f"Lumber on days:                   {UL}")
    body(f"Masonry on days:                  {UL}")

    # ── Milestones ──
    section("MILESTONES")
    instructions("Key project events by day.")
    gap(4)
    for i in range(1, 5):
        body(f"Milestone {i}: {UL}  Day {U}")

    # ── Notes & Context ──
    section("NOTES &amp; CONTEXT")
    instructions("Anything else about the project (location, constraints, risks):")
    gap(4)
    long_line = "_" * 70
    body(long_line)
    gap(4)
    body(long_line)
    gap(4)
    body(long_line)

    # ── End ──
    gap(12)
    add(Paragraph(DIVIDER, BODY_STYLE))
    add(Paragraph("END OF BRIEF", SECTION_STYLE))
    add(Paragraph(DIVIDER, BODY_STYLE))

    doc.build(story)
    print(f"Template generated: {os.path.abspath(OUTPUT_PATH)}")


if __name__ == "__main__":
    build_pdf()
