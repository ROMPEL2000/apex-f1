"""Build the local media archive from free Wikimedia Commons files."""
import concurrent.futures
import html
import io
import json
import os
import re
import subprocess
from pathlib import Path

import imageio_ffmpeg
import requests
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "media"
UA = {"User-Agent": "ApexF1Portfolio/1.0 (https://github.com/ROMPEL2000/apex-f1)"}
WIKI = "https://en.wikipedia.org/w/api.php"
COMMONS = "https://commons.wikimedia.org/w/api.php"
CARS = {
    "mercedes": "Mercedes W17", "ferrari": "Ferrari SF-26", "red-bull": "Red Bull RB22",
    "mclaren": "McLaren MCL40", "racing-bulls": "Racing Bulls VCARB 03", "alpine": "Alpine A526",
    "haas": "Haas VF-26", "audi": "Audi R26", "williams": "Williams FW48",
    "aston-martin": "Aston Martin AMR26", "cadillac": "Cadillac MAC-26",
}
DRIVERS = {
    "russell": "George Russell (racing driver)", "antonelli": "Kimi Antonelli",
    "leclerc": "Charles Leclerc", "hamilton": "Lewis Hamilton", "verstappen": "Max Verstappen",
    "hadjar": "Isack Hadjar", "norris": "Lando Norris", "piastri": "Oscar Piastri", "lawson": "Liam Lawson",
    "lindblad": "Arvid Lindblad", "gasly": "Pierre Gasly", "colapinto": "Franco Colapinto",
    "bearman": "Oliver Bearman", "camara": "Rafael Câmara", "hulkenberg": "Nico Hülkenberg",
    "bortoleto": "Gabriel Bortoleto", "sainz": "Carlos Sainz Jr.", "albon": "Alex Albon",
    "alonso": "Fernando Alonso", "stroll": "Lance Stroll", "perez": "Sergio Pérez", "bottas": "Valtteri Bottas",
}
LOGO_FILES = {
    "mercedes": "Mercedes-Benz free logo.svg", "audi": "Audi logo detail.svg",
    "mclaren": "McLaren logo (2026).svg", "cadillac": "Cadillac Formula 1 Team logo.png",
    "haas": "TGR Haas F1 Team Logo (2026).svg", "williams": "Williams Racing Logo 2024.webp",
    "aston-martin": "Aston Martin F1 Team logo 2024.jpg", "alpine": "Alpine F1 Team Logo.svg",
    "ferrari": "Ferrari logo on 458 Speciale.jpg",
}
CLIP = "2021 Russian Grand Prix - start for warm-up.webm"
OVERRIDES = {
    "red-bull": "FIA F1 Austria 2026 Nr. 3 Verstappen (1).jpg",
    "hamilton": "2025 Japan GP - Ferrari - Lewis Hamilton - Fanzone Stage (cropped).jpg",
    "hero": "2026 Chinese GP - Ferrari - Charles Leclerc - FP1.jpg",
}

def request(url, **params):
    response = requests.get(url, params=params, headers=UA, timeout=35)
    response.raise_for_status()
    return response

def query(url, **params):
    return request(url, action="query", format="json", formatversion=2, **params).json().get("query", {})

def primary_image(title):
    data = query(WIKI, titles=title, redirects=1, prop="pageimages", piprop="name")
    return data.get("pages", [{}])[0].get("pageimage")

def details(file, width):
    data = query(COMMONS, titles="File:" + file, redirects=1, prop="imageinfo",
                 iiprop="url|extmetadata|size", iiurlwidth=width)
    return data.get("pages", [{}])[0].get("imageinfo", [{}])[0]

def plain(value):
    return html.unescape(re.sub(r"<[^>]*>", "", value)).strip()

def credit(info, file, output, changes):
    meta = info["extmetadata"]
    license_name = meta["LicenseShortName"]["value"]
    if not re.match(r"^(CC BY(?:-SA)? [\d.]+|CC0|Public domain|PD)", license_name):
        raise ValueError(f"Unsupported licence {license_name}: {file}")
    author = plain(meta.get("Artist", {}).get("value", ""))
    license_url = meta.get("LicenseUrl", {}).get("value", "")
    return {"file": output, "title": file.replace("_", " "), "author": author,
            "license": license_name, "licenseUrl": license_url, "source": info["descriptionurl"],
            "changes": changes}

def image_job(job):
    key, title, kind = job
    width = {"hero": 1800, "car": 1500, "driver": 640, "logo": 240}[kind]
    file = LOGO_FILES.get(key) if kind == "logo" else (OVERRIDES.get(key) or primary_image(title))
    if not file:
        raise ValueError(f"Missing free image for {title}")
    info = details(file, width)
    name = "hero.webp" if kind == "hero" else f"{kind}-{key}.webp"
    item = credit(info, file, name, "Оптимизация WebP")
    try:
        content = request(info.get("thumburl", info["url"])).content
    except requests.HTTPError:
        content = request(info["url"]).content
    picture = ImageOps.exif_transpose(Image.open(io.BytesIO(content)))
    picture.thumbnail((width, width))
    picture.save(OUT / name, "WEBP", quality=88 if kind == "car" else 83, method=6)
    return name, item

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    jobs = [(k, v, "car") for k, v in CARS.items()] + [(k, v, "driver") for k, v in DRIVERS.items()]
    jobs += [(k, k, "logo") for k in LOGO_FILES] + [("hero", "Ferrari SF-26", "hero")]
    index = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(image_job, job): job for job in jobs}
        for future in concurrent.futures.as_completed(futures):
            try:
                name, item = future.result()
                index[name] = item
                print(name, item["title"], item["license"], flush=True)
            except Exception as error:
                print("SKIP", *futures[future], str(error), flush=True)
    info = details(CLIP, 640)
    video = Path(os.environ["TEMP"]) / "f1-clip.webm"
    if not video.exists():
        video.write_bytes(request(info["url"]).content)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-ss", "2", "-i", str(video),
                    "-t", "16", "-an", "-vf", "scale=854:-2", "-c:v", "libx264", "-preset", "fast",
                    "-crf", "28", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(OUT / "warm-up.mp4")], check=True)
    index["warm-up.mp4"] = credit(info, CLIP, "warm-up.mp4", "Фрагмент 16 секунд, уменьшение и удаление звука")
    subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-ss", "6", "-i", str(video),
                    "-frames:v", "1", "-vf", "scale=854:-2", str(OUT / "warm-up-poster.webp")], check=True)
    index["warm-up-poster.webp"] = credit(info, CLIP, "warm-up-poster.webp", "Стоп-кадр и оптимизация WebP")
    (ROOT / "src" / "media.json").write_text(json.dumps(index, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")

if __name__ == "__main__":
    main()

