import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { getSupabasePublishableKey, getSupabaseUrl } from "./config"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet, headers) {
        void headers
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components cannot always set cookies; middleware refreshes the session.
        }
      },
    },
  })
}
