/** PostgREST: relation missing from schema cache (table not created or cache stale). */
export function isGolfTrackerTableSchemaError(error: {
  code?: string
  message?: string
} | null): boolean {
  if (!error) return false
  if (error.code === "PGRST205") return true
  const m = error.message
  return typeof m === "string" && m.includes("schema cache")
}
