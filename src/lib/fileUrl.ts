const FILE_DOMAIN = process.env.NEXT_PUBLIC_FILE_DOMAIN ?? "";

/**
 * Converts a relative image path (e.g. "ops-desk/abc.jpg") to a full URL.
 * If the path is already a full URL (starts with http), returns it as-is.
 */
export function fileUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = FILE_DOMAIN.endsWith("/") ? FILE_DOMAIN : `${FILE_DOMAIN}/`;
  const rel = path.startsWith("/") ? path.slice(1) : path;
  return `${base}${rel}`;
}
