import json
import re
import sys
from html import unescape
from pathlib import Path

import requests


BASE = "https://vgr5arena.my.id"
URLS = {
    14: f"{BASE}/index.php?p=competition&id=31&cat=14",
    15: f"{BASE}/index.php?p=competition&id=31&cat=15",
    16: f"{BASE}/index.php?p=competition&id=31&cat=16",
}

OUT_JSON = Path(__file__).with_name("scraped-results.json")
OUT_JS = Path(__file__).with_name("scraped-results.js")


def clean(text: str) -> str:
    text = unescape(re.sub(r"<.*?>", "", text))
    return re.sub(r"\s+", " ", text).strip()


def parse_results(html: str) -> list[dict]:
    rows = []
    for row in re.findall(r'(<div class="result-row"[^>]*>.*?</div>)', html, re.S):
        a = re.search(r'<span class="r-a[^"]*">(.*?)</span>', row, re.S)
        score = re.search(r'<span class="r-score">(.*?)</span>', row, re.S)
        b = re.search(r'<span class="r-b[^"]*">(.*?)</span>', row, re.S)

        score_text = clean(score.group(1)) if score else ""
        meta = ""
        if "WO" in score_text:
            meta = "(WO)"
            score_text = score_text.replace("(WO)", "").strip()
            score_text = score_text or "WO"

        rows.append(
            {
                "a": clean(a.group(1)) if a else "",
                "score": score_text,
                "meta": meta,
                "b": clean(b.group(1)) if b else "",
                "winner": "a" if 'class="r-a win"' in row else ("b" if 'class="r-b win"' in row else ""),
            }
        )
    return rows


def parse_schedule(html: str) -> list[dict]:
    start = html.find('data-panel="jadwal"')
    end = html.find('data-panel="groups"', start)
    block = html[start:end] if start != -1 and end != -1 else ""

    days = []
    date_matches = list(re.finditer(r'<div class="sched-date">(.*?)</div>', block, re.S))
    for i, dm in enumerate(date_matches):
        date = clean(dm.group(1))
        next_start = date_matches[i + 1].start() if i + 1 < len(date_matches) else len(block)
        chunk = block[dm.end():next_start]
        rows = []
        for tm in re.finditer(
            r'<div class="sched-row">\s*<span class="sched-time">(.*?)</span>\s*<span class="sched-a">(.*?)</span>\s*<span class="sched-vs">vs</span>\s*<span class="sched-b">(.*?)</span>\s*<span class="sched-tag">(.*?)</span>',
            chunk,
            re.S,
        ):
            rows.append(
                {
                    "time": clean(tm.group(1)),
                    "a": clean(tm.group(2)),
                    "b": clean(tm.group(3)),
                    "tag": clean(tm.group(4)),
                }
            )
        if rows:
            days.append({"date": date, "rows": rows})
    return days


def parse_groups(html: str) -> list[dict]:
    names = list(re.finditer(r'<th class="group-name" colspan="2">(.*?)</th>', html, re.S))
    groups = []
    for i, nm in enumerate(names):
        group_name = clean(nm.group(1))
        slice_end = names[i + 1].start() if i + 1 < len(names) else len(html)
        section = html[nm.start():slice_end]
        rows = []
        for tr in re.finditer(r'<tr class="([^"]*)">(.*?)</tr>', section, re.S):
            cls = tr.group(1)
            tds = re.findall(r'<td[^>]*>(.*?)</td>', tr.group(2), re.S)
            vals = [clean(t) for t in tds]
            if len(vals) >= 13:
                rows.append(
                    {
                        "rank": vals[0],
                        "team": vals[1],
                        "pts": vals[2],
                        "win": vals[3],
                        "loss": vals[4],
                        "pf_pa": vals[11],
                        "form": vals[12],
                        "qualified": "qualified" in cls.split(),
                    }
                )
        if rows:
            groups.append({"group": group_name, "rows": rows})
    return groups


def scrape_category(cat: int) -> dict:
    html = requests.get(URLS[cat], timeout=30).text

    title = clean(re.search(r"<h1>(.*?)<span class=\"badge badge-green\">", html, re.S).group(1))
    desc = clean(re.search(r"<p class=\"muted\">(.*?)</p>", html, re.S).group(1))
    active = clean(re.search(r'<a class="cat-pill active"\s*href="[^"]+">(.*?)</a>', html, re.S).group(1))
    stage = clean(re.search(r'<div class="result-stage">(.*?)</div>', html, re.S).group(1))

    return {
        "cat": cat,
        "category": active,
        "title": title,
        "description": desc,
        "stage": stage,
        "results": parse_results(html),
        "schedule": parse_schedule(html),
        "groups": parse_groups(html),
        "url": URLS[cat],
    }


def build_payload() -> dict:
    return {
        "source": BASE,
        "items": [scrape_category(cat) for cat in (14, 15, 16)],
    }


def write_outputs(payload: dict) -> None:
    json_text = json.dumps(payload, ensure_ascii=False, indent=2)
    OUT_JSON.write_text(json_text, encoding="utf-8")
    OUT_JS.write_text(f"window.VGRScrapedResults = {json_text};\n", encoding="utf-8")


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

    payload = build_payload()
    write_outputs(payload)
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
