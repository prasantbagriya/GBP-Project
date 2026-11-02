import { PanelUser } from '../types';

export const resolveCanonicalSlug = (text: string = '', id: string = ''): string | null => {
  const t = (text + ' ' + id).toLowerCase().trim();
  if (t.includes('sainik')) return 'sainik';
  if (t.includes('floreto')) return 'floreto';
  if (t.includes('hospital')) return 'hospital';
  if (t.includes('medical') || t.includes('minauti')) return 'medical';
  if (t.includes('nda') && !t.includes('defence')) return 'nda';
  if (t.includes('defence') || t.includes('pda')) return 'defence';
  if (t.includes('lotus')) return 'lotus';
  if (t.includes('jaipur')) return 'jaipur';
  if (t.includes('prime') || t.includes('rahul')) return 'prime';
  if (t.includes('piprali')) return 'piprali';
  if (t.includes('rbse')) return 'rbse_palwas';
  if (t.includes('college') && !t.includes('medical')) return 'college';
  if (t.includes('academy') && !t.includes('nda') && !t.includes('defence')) return 'academy';
  return null;
};

export const isItemAllowedForMember = (
  title: string = '',
  id: string = '',
  user: PanelUser | null
): boolean => {
  if (!user || user.role === 'admin') {
    return true;
  }

  const assigned = (user.assigned_wing || '').trim();
  const assignedWings = (user.assigned_wings || []).map(w => w.trim());
  const allowedItems = assigned ? [assigned, ...assignedWings] : assignedWings;

  const locTitle = title.toLowerCase().trim();
  const locId = id.toLowerCase().trim();
  const cleanLocId = locId.replace(/^(accounts\/[^/]+\/locations\/|locations\/)/, '');
  const locSlug = resolveCanonicalSlug(locTitle, locId);

  // If no assigned wing is specified on member account, auto-detect from name/email
  if (allowedItems.length === 0) {
    const userSlug = resolveCanonicalSlug((user.name || '') + ' ' + (user.email || ''));
    if (!userSlug) return true;
    return locSlug === userSlug;
  }

  // Check wildcard access
  if (allowedItems.some(i => i === '*' || i.toLowerCase() === 'all')) {
    return true;
  }

  for (const item of allowedItems) {
    const itemLower = item.toLowerCase().trim();
    if (!itemLower) continue;

    const cleanItem = itemLower.replace(/^(accounts\/[^/]+\/locations\/|locations\/)/, '');

    // 1. Exact match on title or ID
    if (locTitle && locTitle === itemLower) return true;
    if (locId && (locId === itemLower || cleanLocId === cleanItem)) return true;

    // 2. Canonical branch slug match
    const itemSlug = resolveCanonicalSlug(itemLower);
    if (locSlug !== null && itemSlug !== null) {
      if (locSlug === itemSlug) return true;
      // If recognized as different canonical branch, strictly disallow!
      continue;
    }

    // 3. Substring match fallback
    if (locTitle && (locTitle.includes(itemLower) || itemLower.includes(locTitle))) return true;
  }

  return false;
};
