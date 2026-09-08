/**
 * Date and time parsing / formatting utilities.
 */

/**
 * Safely parses a date string or timestamp from the backend into a Date object.
 *
 * Background:
 * When ASP.NET / Entity Framework serializes DateTime instances with DateTimeKind.Unspecified
 * (the default when retrieved from SQL Server without timezone columns), it outputs strings like
 * "2026-09-08T12:14:00" without a trailing 'Z' or timezone offset.
 *
 * In ECMAScript/JavaScript, ISO-like date-time strings without a timezone offset are treated as
 * LOCAL time by default. Since the backend persists UTC timestamps (e.g. DateTime.UtcNow),
 * interpreting them as local time prevents timezone conversion (e.g. 12:14 UTC becomes 12:14 PM IST
 * instead of 5:44 PM IST).
 *
 * This utility ensures that any date-time string lacking a timezone offset is properly treated as UTC.
 */
export const parseUtcDate = (dateVal?: string | Date | number | null): Date => {
  if (!dateVal) return new Date();
  if (dateVal instanceof Date) return dateVal;
  if (typeof dateVal === "number") return new Date(dateVal);

  let str = String(dateVal).trim();
  if (!str) return new Date();

  // Check if string already contains a timezone indicator ('Z', 'z', or +/-HH:mm offset)
  const hasTimezone =
    str.endsWith("Z") ||
    str.endsWith("z") ||
    /[+-]\d{2}(:?\d{2})?$/.test(str);

  if (!hasTimezone) {
    if (str.includes("T")) {
      str += "Z";
    } else if (str.includes(" ")) {
      str = str.replace(" ", "T") + "Z";
    }
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? new Date(dateVal) : parsed;
};

/**
 * Formats a comment date-time for display in the user's local timezone.
 * Example output: "Sep 8, 05:44 PM"
 */
export const formatCommentDate = (dateVal?: string | Date | number | null): string => {
  if (!dateVal) return "";
  const d = parseUtcDate(dateVal);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Formats a post date and time for display in the user's local timezone.
 * Example output: "9/8/2026 • 05:40 PM"
 */
export const formatPostDate = (dateVal?: string | Date | number | null): string => {
  if (!dateVal) return "";
  const d = parseUtcDate(dateVal);
  const datePart = d.toLocaleDateString();
  const timePart = d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} • ${timePart}`;
};
