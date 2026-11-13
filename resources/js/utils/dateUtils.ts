/**
 * Business Date Utilities for Google Business Profile Management
 * 
 * Rules:
 * - Indian Standard Time (Asia/Kolkata)
 * - 5:00 AM daily cutoff: each business day runs from 05:00:00 AM to 04:59:59 AM next calendar day.
 * - Any time before 05:00:00 AM IST belongs to the previous business day.
 */

export const BUSINESS_CUTOFF_HOURS = 5;
export const BUSINESS_TIMEZONE = 'Asia/Kolkata';

/**
 * Returns a new Date object shifted back by 5 hours so that midnight aligns with the 5:00 AM IST cutoff.
 */
export function getBusinessShiftedDate(d: Date = new Date()): Date {
  return new Date(d.getTime() - BUSINESS_CUTOFF_HOURS * 3600 * 1000);
}

/**
 * Get the business date string (YYYY-MM-DD) in Asia/Kolkata timezone with 5:00 AM cutoff.
 */
export function getBusinessDateStr(d: Date | string = new Date()): string {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  const shifted = getBusinessShiftedDate(dateObj);
  return shifted.toLocaleDateString('en-CA', { timeZone: BUSINESS_TIMEZONE });
}

/**
 * Checks whether a given timestamp falls into the current business day (from 5:00 AM IST today until 4:59:59 AM IST tomorrow).
 */
export function isTodayBusinessDay(dateInput: string | Date | null | undefined): boolean {
  if (!dateInput) return false;
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return false;
    return getBusinessDateStr(d) === getBusinessDateStr(new Date());
  } catch {
    return false;
  }
}

/**
 * Formats a Google review timestamp accurately:
 * - "Today at hh:mm A" (if created during current business day)
 * - "Yesterday at hh:mm A" (if created during previous business day)
 * - "MMM d, yyyy" (if older)
 */
export function formatReviewTimestamp(createTime: string | null | undefined): string {
  if (!createTime) return '';
  try {
    const d = new Date(createTime);
    if (isNaN(d.getTime())) return '';

    if (isTodayBusinessDay(createTime)) {
      return `Today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: BUSINESS_TIMEZONE })}`;
    }

    const shifted = getBusinessShiftedDate(d);
    const nowShifted = getBusinessShiftedDate(new Date());
    const diffDays = Math.round(
      (new Date(nowShifted.toDateString()).getTime() - new Date(shifted.toDateString()).getTime()) /
        (24 * 3600 * 1000)
    );

    if (diffDays === 1) {
      return `Yesterday at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: BUSINESS_TIMEZONE })}`;
    }

    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: BUSINESS_TIMEZONE,
    });
  } catch {
    return '';
  }
}

/**
 * Safely format a local Date into YYYY-MM-DD without UTC timezone shifts.
 */
export function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
