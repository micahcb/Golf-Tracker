import dns from "node:dns/promises"
import net from "node:net"
import { URL } from "node:url"

export type ResolvedDatabaseUrl = {
  /** Connection string (possibly with host replaced by an IPv4 literal). */
  url: string
  /** When host was rewritten to IPv4, use this as TLS SNI `servername`. */
  tlsServerName?: string
}

/** Hostname from a Postgres URL (for diagnostics; never includes password). */
export function databaseUrlHostnameOnly(rawUrl: string): string | null {
  try {
    const h = new URL(rawUrl).hostname
    return h || null
  } catch {
    return null
  }
}

async function firstIpv4Address(hostname: string): Promise<string | null> {
  try {
    const { address } = await dns.lookup(hostname, { family: 4 })
    if (address && net.isIP(address) === 4) return address
  } catch {
    /* try resolve4 */
  }
  try {
    const list = await dns.resolve4(hostname)
    for (const a of list) {
      if (net.isIP(a) === 4) return a
    }
  } catch {
    /* no A records */
  }
  return null
}

/**
 * Many Supabase hostnames resolve to IPv6 first; some networks cannot route IPv6 (EHOSTUNREACH).
 * Resolve the DB host to an A record and connect by IPv4 while preserving SNI for TLS.
 */
export async function resolveDatabaseUrlForIpv4(rawUrl: string): Promise<ResolvedDatabaseUrl> {
  let u: URL
  try {
    u = new URL(rawUrl)
  } catch {
    return { url: rawUrl }
  }

  const hostname = u.hostname
  if (!hostname || net.isIP(hostname)) {
    return { url: rawUrl }
  }

  const address = await firstIpv4Address(hostname)
  if (!address || address === hostname) {
    return { url: rawUrl }
  }

  u.hostname = address
  return { url: u.toString(), tlsServerName: hostname }
}
