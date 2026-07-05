// Shared "claim this email onto newClientId" logic — used by every path that
// can attach an email to an account (self-service after code verification,
// Stripe checkout, admin grant). Migrates the plan record and saved searches
// from whichever clientId currently owns the email, then invalidates that old
// clientId via the existing sv:deleted: soft-delete convention (with a
// mergedInto marker) rather than leaving it silently orphaned. This is also
// what gives "single active clientId per email" its enforcement: sv:email:
// only ever points at one clientId, and this is the only place that repoints
// it away from an existing owner.
export async function mergeEmailOwnership(kv, email, newClientId) {
  const existingClientId = await kv.get(`sv:email:${email}`);
  if (!existingClientId || existingClientId === newClientId) {
    return { merged: false };
  }

  const existingRecord = await kv.get(`sv:sub:${existingClientId}`);
  if (!existingRecord) {
    // Stale index pointing at a record that's already gone — nothing to merge.
    return { merged: false };
  }

  const merged = { ...existingRecord, email, updatedAt: Date.now() };
  const existingSearches = await kv.get(`sv:searches:${existingClientId}`);

  await Promise.all([
    kv.set(`sv:sub:${newClientId}`, merged),
    kv.set(`sv:email:${email}`, newClientId),
    kv.set(`sv:deleted:${existingClientId}`, { ...existingRecord, mergedInto: newClientId, deletedAt: Date.now() }),
    kv.del(`sv:sub:${existingClientId}`),
    existingRecord.customerId ? kv.set(`sv:customer:${existingRecord.customerId}`, newClientId) : Promise.resolve(),
    existingSearches ? kv.set(`sv:searches:${newClientId}`, existingSearches) : Promise.resolve(),
    existingSearches ? kv.del(`sv:searches:${existingClientId}`) : Promise.resolve(),
  ]);

  return { merged: true, searches: existingSearches?.searches ?? [], previousClientId: existingClientId };
}
