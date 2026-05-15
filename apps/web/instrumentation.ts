export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runBootstrap } = await import("./lib/db/run-bootstrap")
    const result = await runBootstrap()
    if (!result.ok && !("skipped" in result && result.skipped)) {
      console.error("[golf-tracker] schema bootstrap failed:", result.error)
    }
  }
}
