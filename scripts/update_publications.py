#!/usr/bin/env python3
from __future__ import annotations
import json, os, time, urllib.parse, urllib.request, urllib.error
from pathlib import Path
from datetime import datetime, timezone

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
MEMBERS=json.loads((DATA/"members.json").read_text(encoding="utf-8"))
API_KEY=os.getenv("OPENALEX_API_KEY","").strip()

def request_json(url, params=None, retries=6):
    params=dict(params or {})
    if API_KEY:
        params["api_key"]=API_KEY
    full=url+("?" + urllib.parse.urlencode(params) if params else "")
    headers={"User-Agent":"BERL-publication-sync/4.0"}
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(urllib.request.Request(full,headers=headers), timeout=60) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            body=e.read().decode("utf-8","ignore")[:500]
            if e.code in (401,403):
                raise RuntimeError("OpenAlex authentication failed. Add a free API key as repository secret OPENALEX_API_KEY. "+body)
            if e.code in (429,500,502,503,504) and attempt<retries-1:
                wait=min(2**attempt,16)
                print(f"OpenAlex HTTP {e.code}; retrying in {wait}s ({attempt+1}/{retries})")
                time.sleep(wait)
                continue
            raise RuntimeError(f"OpenAlex HTTP {e.code}: {body}")
        except Exception as e:
            if attempt<retries-1:
                wait=min(2**attempt,16)
                print(f"OpenAlex request error {type(e).__name__}; retrying in {wait}s ({attempt+1}/{retries})")
                time.sleep(wait)
                continue
            raise

def author_id(v):
    return str(v or "").strip().replace("https://openalex.org/authors/","").replace("https://openalex.org/","").strip("/")

def clean_doi(v):
    return str(v or "").replace("https://doi.org/","").replace("http://doi.org/","").strip()

def convert_work(w):
    authors=[]; author_ids=[]
    for x in w.get("authorships") or []:
        author=x.get("author") or {}
        n=(author.get("display_name") or "").strip()
        aid=(author.get("id") or "").split("/")[-1].strip()
        if n: authors.append(n)
        if aid: author_ids.append(aid)
    loc=w.get("primary_location") or {}; src=loc.get("source") or {}
    topics=[x.get("display_name") for x in (w.get("topics") or [])[:4] if x.get("display_name")]
    doi=clean_doi(w.get("doi"))
    return {
        "id":(w.get("id") or "").split("/")[-1],
        "year":w.get("publication_year"),
        "title":w.get("title") or "Untitled",
        "authors":authors,
        "author_ids":author_ids,
        "journal":src.get("display_name") or "",
        "doi":doi,
        "url":loc.get("landing_page_url") or (f"https://doi.org/{doi}" if doi else w.get("id","")),
        "open_access":bool((w.get("open_access") or {}).get("is_oa")),
        "cited_by_count":int(w.get("cited_by_count") or 0),
        "type":w.get("type") or "",
        "source":"OpenAlex",
        "topics":topics
    }

def fetch_author_profile(aid):
    return request_json(f"https://api.openalex.org/authors/{aid}")

def fetch_works(aid):
    out=[];cursor="*"
    while cursor:
        payload=request_json("https://api.openalex.org/works",{
            "filter":f"author.id:{aid}",
            "per_page":50,
            "cursor":cursor
        })
        out.extend(convert_work(w) for w in payload.get("results",[]))
        cursor=(payload.get("meta") or {}).get("next_cursor")
        if not cursor: break
        time.sleep(.18)
    return out

def pkey(p):
    if p.get("doi"): return "doi:"+p["doi"].lower()
    if p.get("id"): return "id:"+str(p["id"]).lower()
    return "title:"+str(p.get("title","")).strip().lower()

def calc_h(vals):
    vals=sorted([int(v or 0) for v in vals],reverse=True);h=0
    for i,v in enumerate(vals,1):
        if v>=i:h=i
        else:break
    return h

def main():
    linked_members=[m for m in MEMBERS if m.get("id") and author_id(m.get("openalex_id"))]
    if not API_KEY:
        print("NOTICE: OPENALEX_API_KEY secret is not set. Trying keyless access; add a free key for reliable scheduled updates.")

    merged={}
    member_metrics={}
    now=datetime.now(timezone.utc).isoformat()

    for m in linked_members:
        aid=author_id(m.get("openalex_id"))
        print(f"Fetching member {m.get('name','')} ({aid})")
        profile=fetch_author_profile(aid)
        works=fetch_works(aid)
        cites=[int(p.get("cited_by_count") or 0) for p in works]
        stats=profile.get("summary_stats") or {}
        h=int(stats.get("h_index") or calc_h(cites))
        i10=int(stats.get("i10_index") or sum(1 for c in cites if c>=10))
        total_cites=int(profile.get("cited_by_count") or sum(cites))
        works_count=int(profile.get("works_count") or len(works))

        member_metrics[m["id"]]={
            "member_id":m["id"],
            "name":m.get("name",profile.get("display_name") or ""),
            "openalex_id":aid,
            "publications":works_count,
            "linked_publications":len(works),
            "citations":total_cites,
            "h_index":h,
            "i10_index":i10,
            "open_access_works":sum(1 for p in works if p.get("open_access")),
            "last_updated":now,
            "source":"OpenAlex",
            "status":"Synchronized"
        }
        print(f"  resolved={profile.get('display_name')} works={works_count} citations={total_cites} h={h} i10={i10}")

        for p in works:
            k=pkey(p)
            if k not in merged or p.get("cited_by_count",0)>merged[k].get("cited_by_count",0):
                merged[k]=p

    manual_path=DATA/"manual-publications.json"
    manual=json.loads(manual_path.read_text(encoding="utf-8")) if manual_path.exists() else []
    for p in manual:
        merged[pkey(p)]=p

    pubs=sorted(merged.values(),key=lambda p:(p.get("year") or 0,p.get("cited_by_count") or 0),reverse=True)
    (DATA/"publications.json").write_text(json.dumps(pubs,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (DATA/"member-metrics.json").write_text(json.dumps(member_metrics,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

    cites=[int(p.get("cited_by_count") or 0) for p in pubs]
    metrics={
        "publications":len(pubs),
        "citations":sum(cites),
        "h_index":calc_h(cites),
        "i10_index":sum(1 for c in cites if c>=10),
        "open_access_works":sum(1 for p in pubs if p.get("open_access")),
        "linked_members":len(member_metrics),
        "last_updated":now,
        "source":"OpenAlex",
        "status":"Synchronized"
    }
    (DATA/"metrics.json").write_text(json.dumps(metrics,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Updated {len(member_metrics)} member profiles and {len(pubs)} unique publications.")

if __name__=="__main__":
    main()
