"""Pin circuit SVGs and metadata for every circuit in the supported 2025–26 seasons."""
import json
import math
import re
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "public" / "tracks"
SVG_REF = "c1bcd6fcb1b6fdb662136daa6bc19f3a2f870f65"
DB_REF = "7731345ffc121487d73afbf6dd3896718862b157"
GEO_REF = "8094e957b8d6aa8b9f4510c93968556cccd30e02"
SVG = f"https://raw.githubusercontent.com/f1db/f1-circuits-svg/{SVG_REF}/"
DB = f"https://raw.githubusercontent.com/f1db/f1db/{DB_REF}/src/data/circuits/"
GEO = f"https://raw.githubusercontent.com/bacinger/f1-circuits/{GEO_REF}/"
ALIASES = {
    "albert_park": "melbourne", "shanghai": "shanghai", "suzuka": "suzuka", "miami": "miami",
    "villeneuve": "montreal", "monaco": "monaco", "catalunya": "catalunya", "red_bull_ring": "spielberg",
    "silverstone": "silverstone", "spa": "spa-francorchamps", "hungaroring": "hungaroring",
    "zandvoort": "zandvoort", "monza": "monza", "madring": "madring", "baku": "baku",
    "sepang": "sepang", "marina_bay": "marina-bay", "americas": "austin", "rodriguez": "mexico-city",
    "interlagos": "interlagos", "vegas": "las-vegas", "losail": "lusail", "yas_marina": "yas-marina",
    "bahrain": "bahrain", "jeddah": "jeddah", "imola": "imola",
}
GEO_FALLBACK = {"sepang": "my-1999", "imola": "it-1953"}
OFFICIAL_SEPANG = "https://www.formula1.com/en/racing/2026/bahrain"

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "APEX/2.0 (https://github.com/ROMPEL2000/apex-f1)"})
    with urllib.request.urlopen(req, timeout=25) as response:
        return response.read()

def years(rule):
    for item in rule.split(","):
        bounds = list(map(int, item.split("-")))
        yield from range(bounds[0], bounds[-1] + 1)

def draw_geo(coords):
    x0, y0 = coords[0]
    scale_x = math.cos(math.radians(y0))
    points = [((x-x0)*scale_x, y0-y) for x,y in coords]
    min_x, max_x = min(x for x,y in points), max(x for x,y in points)
    min_y, max_y = min(y for x,y in points), max(y for x,y in points)
    scale = min(444/(max_x-min_x), 410/(max_y-min_y))
    pts = [((x-(min_x+max_x)/2)*scale+250, (y-(min_y+max_y)/2)*scale+250) for x,y in points]
    d = "M" + " ".join(f"{x:.2f},{y:.2f}" for x,y in pts) + "Z"
    x,y = pts[0]
    x1,y1 = pts[1]
    mag = math.hypot(x1-x,y1-y)
    ux,uy = (x1-x)/mag, (y1-y)/mag
    px,py = -uy,ux
    sx,sy = x + 33*ux,y + 33*uy
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">'
        f'<path d="{d}" fill="none" stroke="#fff" stroke-width="12" stroke-linejoin="round"/>'
        f'<path d="M{x-13*px:.2f},{y-13*py:.2f} L{x+13*px:.2f},{y+13*py:.2f}" stroke="#ff6147" stroke-width="7"/>'
        f'<path d="M{sx-7*ux-8*px:.2f},{sy-7*uy-8*py:.2f} L{sx:.2f},{sy:.2f} L{sx-7*ux+8*px:.2f},{sy-7*uy+8*py:.2f}" fill="none" stroke="#ff6147" stroke-width="4"/>'
        '</svg>'
    )

def main():
    PATH.mkdir(parents=True, exist_ok=True)
    index = {c["id"]: c for c in json.loads(get(SVG + "circuits.json"))}
    stretches = json.loads(get(GEO + "f1-circuits.geojson"))["features"]
    geometry = {f["properties"]["id"]: f["geometry"]["coordinates"] for f in stretches}

    def import_circuit(item):
        key, source_id = item
        details = get(DB + source_id + ".yml").decode()
        direction = re.search(r"^direction: (.+)$", details, re.M)[1].strip()
        if key == "suzuka":
            direction = "FIGURE_OF_EIGHT"
        entries = {}
        for layout in index[source_id]["layouts"]:
            layout_id = layout["layoutId"]
            valid_years = sorted(set(years(layout["seasons"])) & {2025,2026})
            if key == "sepang" and layout_id == "sepang-1":
                valid_years = [2026]
            if key == "shanghai" and layout_id == "shanghai-1":
                valid_years = [2025, 2026] # Same Grand Prix circuit in both official event guides.
            if not valid_years:
                continue
            blocks = re.split(r"(?m)^  - id: ", details)
            block = next((item for item in blocks[1:] if item.split()[0] == layout_id), None)
            if not block:
                raise ValueError("Missing metadata " + layout_id)
            length = float(re.search(r"(?m)^    length: ([\d.]+)", block)[1])
            turns = int(re.search(r"(?m)^    turns: (\d+)", block)[1])
            if key == "madring":
                length = 5.414 # Race length reported by Formula 1 for the September event.
            if key in GEO_FALLBACK:
                svg = draw_geo(geometry[GEO_FALLBACK[key]])
            else:
                raw = get(SVG + "circuits/detailed/white/" + layout_id + ".svg").decode()
                root = ET.fromstring(raw)
                if len(root) < 3 or any(node.tag.split("}")[-1] not in {"svg","path","g","rect","polygon","circle","line"} for node in root.iter()):
                    raise ValueError("Expected detailed vector for " + layout_id)
                svg = raw.replace('<svg ', '<svg viewBox="0 0 500 500" ', 1) if "viewBox=" not in raw else raw
                first_path = svg.find("<path")
                annotations = svg.find("<path", first_path + 5)
                svg = svg[:annotations] + svg[annotations:].replace("#fff", "#ff6147")
            (PATH / (layout_id + ".svg")).write_text(svg.strip() + "\n", encoding="utf-8")
            entries.update({year: {
                "id": layout_id, "length": length, "turns": turns, "direction": direction,
                "geo": key in GEO_FALLBACK, "source": OFFICIAL_SEPANG if key == "sepang" else
                "https://www.formula1.com/en/latest/article/need-to-know-the-most-important-facts-stats-and-trivia-ahead-of-the-2026-spanish-grand-prix-madrid-madring.0VbYQHCnrBCibxbkwygP0" if key == "madring" else
                "https://github.com/f1db/f1db/blob/" + DB_REF + "/src/data/circuits/" + source_id + ".yml"
            } for year in valid_years})
        if not entries:
            raise ValueError("No verified years for " + key)
        return key, entries

    with ThreadPoolExecutor(max_workers=6) as pool:
        result = dict(pool.map(import_circuit, ALIASES.items()))
    (ROOT / "src" / "tracks.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (PATH / "LICENSE-bacinger.md").write_bytes(get(GEO + "LICENSE.md"))
    print(len(result), "verified circuit ids")

if __name__ == "__main__":
    main()
