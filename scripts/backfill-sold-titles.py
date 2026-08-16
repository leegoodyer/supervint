#!/usr/bin/env python3
"""Backfill the sv:sold:titles prefix index from existing sold item records.
The live-prefix-search feature was added AFTER the sold DB was populated, so
the 377 existing records have no title-index entries. This re-adds them.

Direct Upstash KV access — needs UPSTASH_REDIS_REST_URL + TOKEN env vars.
"""
import json, os, sys, urllib.request, urllib.parse

URL = os.environ.get("UPSTASH_REDIS_REST_URL", "")
TOKEN = os.environ.get("UPSTASH_REDIS_REST_TOKEN", "")

def kv(method, *args):
    body = json.dumps([method, *args]).encode()
    req = urllib.request.Request(f"{URL}/pipeline", data=body,
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"ERR {method}: {e.code} {e.read().decode()[:150]}")
        return None
    except Exception as e:
        print(f"ERR {method}: {str(e)[:100]}")
        return None

def main():
    if not URL or not TOKEN:
        print("Need UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN")
        sys.exit(1)
    # Scan all sv:sold:item:* keys
    print("Scanning sold item keys...")
    cursor = "0"
    keys = []
    while True:
        r = kv("scan", cursor, "sv:sold:item:*", 500)
        if not r or len(r) < 2: break
        cursor = r[0]
        keys.extend(r[1])
        if cursor == "0": break
    print(f"Found {len(keys)} sold item records")

    # Fetch records in batches and rebuild title index
    added = 0
    for i in range(0, len(keys), 100):
        batch = keys[i:i+100]
        r = kv("mget", *batch)
        if not r: continue
        pipe = [["pipeline"]]
        for key, rec in zip(batch, r):
            if not rec or not rec.get("title"): continue
            item_id = key.replace("sv:sold:item:", "")
            title = str(rec["title"]).lower()
            sold_at = int(rec.get("soldAt") or 0)
            pipe.append(["zadd", "sv:sold:titles", str(sold_at), f"{title}||{item_id}"])
        if len(pipe) > 1:
            pipe.append(["exec"])
            # REST pipeline API: POST /pipeline with array of commands
            body = json.dumps([["zadd", "sv:sold:titles", str(0), "x"]]).encode()
            # Instead do a raw pipeline via the REST pipeline endpoint
            try:
                cmds = [c for c in pipe[1:-1]]
                pbody = json.dumps(cmds).encode()
                preq = urllib.request.Request(f"{URL}/pipeline", data=pbody,
                    headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
                with urllib.request.urlopen(preq, timeout=30) as resp:
                    resp.read()
                added += len(cmds)
            except Exception as e:
                print(f"batch {i}: ERR {str(e)[:80]}")
        if (i // 100) % 5 == 0:
            print(f"  ...{i}/{len(keys)}")
    print(f"Done — added {added} title index entries")

if __name__ == "__main__":
    main()
