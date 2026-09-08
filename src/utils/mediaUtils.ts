import ENV from "@/config/env";

/**
 * Resolves any relative or absolute media path to a fully qualified URL
 * using the configured backend server origin.
 */
export const resolveMediaUrl = (path?: string | null): string => {
  if (!path) return "";
  const trimmed = String(path).trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return "";

  // If multiple comma-separated paths exist, take the first one
  const first = trimmed.split(",")[0].trim();
  if (!first) return "";

  if (
    first.startsWith("http://") ||
    first.startsWith("https://") ||
    first.startsWith("file://") ||
    first.startsWith("data:") ||
    first.startsWith("blob:")
  ) {
    return first;
  }

  const rawBase =
    ENV.API_BASE_URL ||
    ENV.BASE_URL ||
    "https://kolve18freeswing.com/api";

  // Remove trailing slashes and '/api' to get the origin of the server
  const origin = rawBase.replace(/\/api\/?$/i, "").replace(/\/+$/, "");
  const normalizedPath = first.replace(/\\/g, "/");
  const cleanPath = normalizedPath.startsWith("/")
    ? normalizedPath
    : `/${normalizedPath}`;

  return `${origin}${cleanPath}`;
};

/**
 * Resolves an array of media URLs (e.g. from comma-separated string or string array)
 */
export const resolveMediaUrls = (paths?: string | string[] | null): string[] => {
  if (!paths) return [];
  if (Array.isArray(paths)) {
    return paths.map((p) => resolveMediaUrl(p)).filter(Boolean);
  }
  return String(paths)
    .split(",")
    .map((p) => resolveMediaUrl(p.trim()))
    .filter(Boolean);
};
