#!/usr/bin/env python3
"""
Supervint — Google Search Console report via API (used by the SEO content cron).

Service account: supervint-seo-agent@supervint.iam.gserviceaccount.com
Key file:       ~/.hermes/supervint-gsc-key.json (outside the repo — never commit)
Property:       sc-domain:supervint.com

Usage:
  python3 scripts/gsc-report.py [days] [row_limit]
"""
import json
import sys
import datetime
import urllib.request
import urllib.parse
import urllib.error

from google.oauth2 import service_account
import google.auth.transport.requests

KEY = "/Users/leeandrew/.hermes/supervint-gsc-key.json"
SITE = "sc-domain:supervint.com"
SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]


def get_creds():
    creds = service_account.Credentials.from_service_account_file(KEY, scopes=SCOPES)
    creds.refresh(google.auth.transport.requests.Request())
    return creds


def query(creds, start, end, dims, row_limit=1000):
    body = {"startDate": start, "endDate": end, "dimensions": dims, "rowLimit": row_limit}
    url = (
        "https://searchconsole.googleapis.com/webmasters/v3/sites/"
        + urllib.parse.quote(SITE, safe="")
        + "/searchAnalytics/query"
    )
    r = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST")
    r.add_header("Authorization", f"Bearer {creds.token}")
    r.add_header("Content-Type", "application/json")
    return json.loads(urllib.request.urlopen(r, timeout=60).read())


def main():
    days = int(sys.argv[1]) if len(sys.argv) > 1 else 90
    row_limit = int(sys.argv[2]) if len(sys.argv) > 2 else 1000
    end = datetime.date.today()
    start = end - datetime.timedelta(days=days)
    creds = get_creds()

    print(f"# Supervint — Google Search ({start} .. {end})\n")
    try:
        # --- Summary over time ---
        summ = query(creds, start.isoformat(), end.isoformat(), ["date"], 400)
        rows = summ.get("rows", [])
        clicks = sum(r.get("clicks", 0) for r in rows)
        impr = sum(r.get("impressions", 0) for r in rows)
        print(f"Total clicks: {clicks} | impressions: {impr:,} | "
              f"CTR: {clicks/impr*100:.2f}% | avg pos: "
              f"{sum(r.get('position',0) for r in rows)/max(len(rows),1):.1f} | active days: {len(rows)}")
        if clicks == 0:
            print("\n[NOT ENOUGH DATA — 0 clicks in window. Fall back to competitor research.]")

        # --- Top queries (all, by clicks desc as GSC defaults) ---
        qrows = query(creds, start.isoformat(), end.isoformat(), ["query"], row_limit).get("rows", [])
        print(f"\n## All queries (top {len(qrows)} rows):")
        for r in qrows:
            q = r["keys"][0]
            print(f"  {q[:55]:55} | cl {r.get('clicks',0):>3} | imp {r.get('impressions',0):>6} | pos {r.get('position',0):>5.1f}")

        # --- Opportunity bucket: positions 11-30 with meaningful impressions ---
        opp = [r for r in qrows if 11 <= r.get("position", 99) <= 30]
        opp.sort(key=lambda r: r.get("impressions", 0), reverse=True)
        print(f"\n## OPPORTUNITY: positions 11-30 (impressions desc, n={len(opp)}):")
        for r in opp:
            q = r["keys"][0]
            print(f"  {q[:55]:55} | cl {r.get('clicks',0):>3} | imp {r.get('impressions',0):>6} | pos {r.get('position',0):>5.1f}")

        # --- Fringe: position > 30 with impressions (page-2+ demand) ---
        fringe = [r for r in qrows if r.get("position", 99) > 30 and r.get("impressions", 0) >= 5]
        fringe.sort(key=lambda r: r.get("impressions", 0), reverse=True)
        print(f"\n## PAGE 2+: position > 30, imp >= 5 (n={len(fringe)}):")
        for r in fringe[:40]:
            q = r["keys"][0]
            print(f"  {q[:55]:55} | cl {r.get('clicks',0):>3} | imp {r.get('impressions',0):>6} | pos {r.get('position',0):>5.1f}")

        # --- Top pages ---
        prows = query(creds, start.isoformat(), end.isoformat(), ["page"], row_limit).get("rows", [])
        print(f"\n## Top pages (n={len(prows)}):")
        for r in prows[:50]:
            p = r["keys"][0].replace("https://supervint.com", "").replace("https://www.supervint.com", "")
            print(f"  {p[:60]:60} | cl {r.get('clicks',0):>3} | imp {r.get('impressions',0):>6} | pos {r.get('position',0):>5.1f}")

    except urllib.error.HTTPError as e:
        print("API error", e.code, ":", e.read()[:300].decode())
        print("If 403: add the service account to the GSC property (sc-domain:supervint.com).")


if __name__ == "__main__":
    main()
