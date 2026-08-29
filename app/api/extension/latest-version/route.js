import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// ─── Latest published version (for the popup "update available" check) ──────
// GET /api/extension/latest-version → { version: "1.2.12" }
//
// The extension popup compares chrome.runtime.getManifest().version against
// this value on open. If the user is behind, it shows an "update available"
// banner that opens chrome://extensions so they can click Chrome's own
// Update / reinstall. Chrome auto-update is unreliable (real users have sat
// on old builds for hours), so this gives them a manual path.
//
// ⚠️ BUMP THIS whenever a new version is PUBLISHED to the Chrome Web Store.
// It must track the *published* version, NOT the dev version — otherwise a
// dev build would flag every Store user as "out of date" before it's live.
const LATEST_VERSION = '1.2.17';

export async function GET() {
  return NextResponse.json({ version: LATEST_VERSION }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
