import dns from "node:dns"

import { BOOTSTRAP_DDL } from "./bootstrap-schema"
import {
  databaseUrlHostnameOnly,
  resolveDatabaseUrlForIpv4,
} from "./resolve-database-url-ipv4"

/** Supabase/AWS often resolve to IPv6 first; many local networks cannot route IPv6 (EHOSTUNREACH). */
function preferIpv4FirstDns(): void {
  if (typeof dns.setDefaultResultOrder === "function") {
    dns.setDefaultResultOrder("ipv4first")
  }
}

export type BootstrapResult =
  | { ok: true }
  | { ok: false; skipped: true; error: string }
  | { ok: false; error: string; hint?: string; dbHost?: string }

export async function runBootstrap(): Promise<BootstrapResult> {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    return { ok: false, skipped: true, error: "DATABASE_URL is not set" }
  }

  try {
    preferIpv4FirstDns()
    const postgres = (await import("postgres")).default
    const resolved = await resolveDatabaseUrlForIpv4(url)
    const sql = postgres(resolved.url, {
      max: 1,
      ...(resolved.tlsServerName
        ? {
            ssl: {
              servername: resolved.tlsServerName,
              rejectUnauthorized: false,
            },
          }
        : {}),
    })
    try {
      await sql.unsafe(BOOTSTRAP_DDL)
      console.info("[golf-tracker] schema bootstrap finished")
      return { ok: true }
    } finally {
      await sql.end({ timeout: 5 })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[golf-tracker] schema bootstrap failed:", err)
    const dbHost = databaseUrlHostnameOnly(url)
    let hint: string | undefined
    if (/EHOSTUNREACH|ENETUNREACH|ETIMEDOUT|ECONNREFUSED/i.test(message)) {
      hint =
        "TCP to Postgres failed. Common causes: (1) This network cannot route IPv6 — use Supabase Database → Connection string → Session pooler (host often contains pooler.supabase.com) or run the SQL from lib/db/bootstrap-schema.ts in the SQL editor once. (2) Wrong password — use the database password from Database settings, not the anon API key. (3) Wrong host/port for your project."
    }
    return {
      ok: false,
      error: message,
      ...(hint ? { hint } : {}),
      ...(dbHost ? { dbHost } : {}),
    }
  }
}
