"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@workspace/ui/components/button"

type Step = "email" | "code"

export function LoginForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function sendCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setPending(true)
    try {
      const supabase = createClient()
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
        },
      })
      if (otpError) {
        setError(otpError.message)
        return
      }
      setStep("code")
      setMessage("Check your email for a 6-digit code.")
    } finally {
      setPending(false)
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setPending(true)
    try {
      const supabase = createClient()
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim().replace(/\s/g, ""),
        type: "email",
      })
      if (verifyError) {
        setError(verifyError.message)
        return
      }
      router.push("/")
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card/40 p-6 shadow-sm">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          {step === "email"
            ? "We will email you a one-time code."
            : `Enter the code sent to ${email}.`}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={sendCode} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className="flex h-9 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="you@example.com"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Sending…" : "Send code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium">
              Code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(ev) => setCode(ev.target.value)}
              className="flex h-9 w-full rounded-xl border border-input bg-background px-3 text-sm tracking-widest outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              placeholder="000000"
              maxLength={12}
            />
          </div>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={pending}
              onClick={() => {
                setStep("email")
                setCode("")
                setError(null)
                setMessage(null)
              }}
            >
              Back
            </Button>
            <Button type="submit" className="flex-1" disabled={pending}>
              {pending ? "Verifying…" : "Verify"}
            </Button>
          </div>
        </form>
      )}

      <p className="text-center text-xs text-muted-foreground">
        <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
          <Link href="/">Return home</Link>
        </Button>
      </p>
    </div>
  )
}
