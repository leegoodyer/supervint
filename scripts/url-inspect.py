#!/usr/bin/env python3
"""
Supervint — Google URL Inspection API (index-status check for the SEO cron).

Complements scripts/gsc-report.py: Search Analytics shows impressions/clicks,
this shows whether Google has actually CRAWLED + INDEXED a URL at all. Use it
first whenever published guides show zero impressions.

Service account: supervint-seo-agent@supervint.iam.gserviceaccount.com
Key file:       ~/.hermes/supervint-gsc-key.json (outside the repo — never commit)
Property:       sc-domain:supervint.com

Usage:
  python3 scripts/url-inspect.py https://supervint.com/guides/<slug> [...]

Caveat: coverageState is NONDETERMINISTIC for unindexed URLs — the same URL can
report "URL is unknown to Google" and "Discovered - currently not indexed" on
consecutive calls. Trust verdict/lastCrawlTime over the exact coverageState.
"""
import json
import sys
import urllib.request
import urllib.error

from google.oauth2 import service_account
import google.auth.transport.requests

KEY = "/Users/leeandrew/.hermes/supervint-gsc-key.json"
SITE = "sc-domain:supervint.com"
SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]
ENDPOINT = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect"
FIELDS = [
    "verdict",
    "coverageState",
    "robotsTxtState",
    "indexingState",
    "pageFetchState",
    "googleCanonical",
    "userCanonical",
    "lastCrawlTime",
    "crawledAs",
]


def get_creds():
    creds = service_account.Credentials.from_service_account_file(KEY, scopes=SCOPES)
    creds.refresh(google.auth.transport.requests.Request())
    return creds


def inspect(creds, url):
    body = {"inspectionUrl": url, "siteUrl": SITE}
    r = urllib.request.Request(ENDPOINT, data=json.dumps(body).encode(), method="POST")
    r.add_header("Authorization", f"Bearer {creds.token}")
    r.add_header("Content-Type", "application/json")
    res = json.loads(urllib.request.urlopen(r, timeout=60).read())
    return res.get("inspectionResult", {}).get("indexStatusResult", {})


def main():
    urls = sys.argv[1:]
    if not urls:
        sys.exit(__doc__)
    creds = get_creds()
    for url in urls:
        try:
            idx = inspect(creds, url)
            print(url)
            for f in FIELDS:
                print(f"   {f:17}: {idx.get(f)}")
            print()
        except urllib.error.HTTPError as e:
            print(f"{url}  -> API error {e.code}: {e.read()[:300].decode()}\n")


if __name__ == "__main__":
    main()
