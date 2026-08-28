#!/usr/bin/env python3
"""
Update BERL publications and metrics from OpenAlex.

Configuration:
  data/scholar-config.json
  - Fill one or more authors[].openalex_id values, e.g. "A1234567890".
  - Google Scholar profile links can be stored for display, but this script does NOT scrape Google Scholar.

The script:
  1. fetches works for all configured OpenAlex author IDs
  2. deduplicates by DOI (or OpenAlex work ID)
  3. merges data/manual-publications.json
  4. writes data/publications.json and data/metrics.json
"""
from __future__ import annotations
import json, math, time
from pathlib import Path
from datetime import datetime, timezone
import urllib.parse, urllib.request

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
CONFIG = json.loads((DATA / "scholar-config.json").read_text(encoding="utf-8"))

def get_json(url, params=None):
    params = params or {}
    mailto = CONFIG.get("contact_email_for_openalex", "").strip()
    if mailto and "replace@" not in mailto.lower():
        params["mailto"] = mailto
    full = url + ("?" + urllib.parse.urlencode(params) if params else "")
    req = urllib.request.Request(full, headers={"User-Agent":"BERL-publication-updater/1.0"})
    with urllib.request.urlopen(req, timeout=45) as r:
        return json.loads(r.read().decode("utf-8"))

def clean_doi(doi):
    if not doi: return ""
    return doi.replace("https://doi.org/","").replace("http://doi.org/","").strip()

def convert_work(w):
    loc = w.get("primary_location") or {}
    src = loc.get("source") or {}
    authors=[]
    for a in w.get("authorships") or []:
        name=((a.get("author") or {}).get("display_name") or "").strip()
        if name: authors.append(name)
    topics=[]
    for t in (w.get("topics") or [])[:4]:
        name=t.get("display_name")
        if name: topics.append(name)
    doi=clean_doi(w.get("doi"))
    return {
        "id": (w.get("id") or "").split("/")[-1],
        "year": w.get("publication_year"),
        "title": w.get("title") or "Untitled",
        "authors": authors,
        "journal": src.get("display_name") or "",
        "doi": doi,
        "url": loc.get("landing_page_url") or (f"https://doi.org/{doi}" if doi else w.get("id","")),
        "open_access": bool((w.get("open_access") or {}).get("is_oa")),
        "cited_by_count": int(w.get("cited_by_count") or 0),
        "type": w.get("type") or "",
        "source": "OpenAlex",
        "topics": topics
    }

def fetch_author_works(author_id):
    author_id=author_id.strip().replace("https://openalex.org/","")
    cursor="*"; out=[]
    while cursor:
        payload=get_json("https://api.openalex.org/works",{
            "filter":f"author.id:{author_id}",
            "per-page":200,
            "cursor":cursor,
            "select":"id,doi,title,publication_year,authorships,primary_location,open_access,cited_by_count,type,topics"
        })
        out.extend(convert_work(w) for w in payload.get("results",[]))
        cursor=(payload.get("meta") or {}).get("next_cursor")
        if not cursor: break
        time.sleep(0.15)
    return out

def key(p):
    if p.get("doi"): return "doi:"+p["doi"].lower()
    if p.get("id"): return "id:"+str(p["id"]).lower()
    return "title:"+str(p.get("title","")).strip().lower()

def h_index(citations):
    vals=sorted((int(x or 0) for x in citations), reverse=True)
    h=0
    for i,c in enumerate(vals,1):
        if c>=i: h=i
        else: break
    return h

def main():
    ids=[a.get("openalex_id","").strip() for a in CONFIG.get("authors",[]) if a.get("openalex_id","").strip()]
    if not ids:
        print("No OpenAlex author IDs configured. Nothing changed.")
        return

    merged={}
    for aid in ids:
        print("Fetching",aid)
        for p in fetch_author_works(aid):
            k=key(p)
            if k not in merged or p.get("cited_by_count",0)>merged[k].get("cited_by_count",0):
                merged[k]=p

    manual_path=DATA/"manual-publications.json"
    manual=json.loads(manual_path.read_text(encoding="utf-8")) if manual_path.exists() else []
    for p in manual:
        merged[key(p)]=p

    pubs=sorted(merged.values(), key=lambda p:(p.get("year") or 0,p.get("cited_by_count") or 0), reverse=True)
    (DATA/"publications.json").write_text(json.dumps(pubs,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

    cites=[p.get("cited_by_count",0) for p in pubs]
    metrics={
        "publications":len(pubs),
        "citations":sum(cites),
        "h_index":h_index(cites),
        "open_access_works":sum(1 for p in pubs if p.get("open_access")),
        "last_updated":datetime.now(timezone.utc).isoformat(),
        "source":"OpenAlex"
    }
    (DATA/"metrics.json").write_text(json.dumps(metrics,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Updated {len(pubs)} publications.")

if __name__=="__main__":
    main()
