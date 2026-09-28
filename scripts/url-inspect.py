#!/usr/bin/env python3
"""One-off: URL Inspection API — report Google's real index status for guide URLs."""
import json
import sys
import urllib.request
import urllib.error

from google.oauth2 import service_account
import google.auth.transport.requests

KEY = "/Users/leeandrew/.hermes/supervint-gsc-key.json"
SITE = "sc-domain:supervint.com"
SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]

creds = service_account.Credentials.from_service_account_file(KEY, scopes=SCOPES)
creds.refresh(google.auth.transport.requests.Request())

urls = sys.argv[1:]
for u in urls:
    body = {"inspectionUrl": u, "siteUrl": SITE}
    req = urllib.request.Request(
        "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
        data=json.dumps(body).encode(),
        method="POST",
    )
    req.add_header("Authorization", f"Bearer {creds.token}")
    req.add_header("Content-Type", "application/json")
    try:
        res = json.loads(urllib.request.urlopen(req, timeout=60).read())
        idx = res.get("inspectionResult", {}).get("indexStatusResult", {})
        print(f"{u}")
        print(f"   verdict          : {idx.get('verdict')}")
        print(f"   coverageState    : {idx.get('coverageState')}")
        print(f"   robotsTxtState   : {idx.get('robotsTxtState')}  indexingState: {idx.get('indexingState')}")
        print(f"   pageFetchState   : {idx.get('pageFetchState')}  googleCanonical: {idx.get('googleCanonical')}")
        print(f"   userCanonical    : {idx.get('userCanonical')}")
        print(f"   lastCrawlTime    : {idx.get('lastCrawlTime')}")
        print(f"   crawledAs        : {idx.get('crawledAs')}")
        print()
    except urllib.error.HTTPError as e:
        print(f"{u}  -> API error {e.code}: {e.read()[:300].decode()}")
        print()
