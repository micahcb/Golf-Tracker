import Link from "next/link"

import { signOut } from "@/app/actions/auth"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { Button } from "@workspace/ui/components/button"

export async function AuthHeader() {
  if (!isSupabaseConfigured()) {
    return null
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return (
      <header className="flex h-11 items-center justify-end gap-3 border-b border-border px-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </header>
    )
  }

  return (
    <header className="flex h-11 items-center justify-end gap-3 border-b border-border px-4">
      <span className="max-w-[50vw] truncate text-xs text-muted-foreground">{user.email}</span>
      <form action={signOut}>
        <Button type="submit" variant="outline" size="sm">
          Sign out
        </Button>
      </form>
    </header>
  )
}
