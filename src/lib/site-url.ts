import { headers } from "next/headers";

/**
 * Resolve the site's public origin (e.g. `https://splitty.example.com`).
 *
 * Tries, in order:
 *   1. The actual request headers (works on Vercel, custom domains, localhost)
 *   2. NEXT_PUBLIC_SITE_URL (explicit override)
 *   3. VERCEL_URL (auto-set by Vercel for previews/deployments)
 *   4. Empty string (caller can fall back to a relative path)
 *
 * Must be called from a Server Component or route handler.
 */
export async function getSiteUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // headers() throws outside a request scope — fall through to env vars.
  }

  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "";
}
