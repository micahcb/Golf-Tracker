import type { ReactNode } from "react"
import Link from "next/link"

import { signOut } from "@/app/actions/auth"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { Button } from "@workspace/ui/components/button"

/** Matches fixed bar: safe area + one `h-11` content row (used for layout offset). */
const AUTH_BAR_SPACER_H =
  "h-[calc(env(safe-area-inset-top,0px)+2.75rem)] shrink-0" as const

function AuthChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[100] border-b border-border bg-background pt-[env(safe-area-inset-top,0px)] shadow-sm">
        <div className="flex h-11 items-center justify-end gap-3 px-4">{children}</div>
      </div>
      <div aria-hidden className={AUTH_BAR_SPACER_H} />
    </>
  )
}

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
      <AuthChrome>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </AuthChrome>
    )
  }

  return (
    <AuthChrome>
      <span className="max-w-[50vw] truncate text-xs text-muted-foreground">{user.email}</span>
      <form action={signOut}>
        <Button type="submit" variant="outline" size="sm">
          Sign out
        </Button>
      </form>
    </AuthChrome>
  )
}
