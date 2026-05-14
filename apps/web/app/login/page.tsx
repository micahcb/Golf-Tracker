import { LoginForm } from "@/components/login-form"

export const metadata = {
  title: "Sign in",
}

export default function LoginPage() {
  return (
    <main className="flex min-h-[calc(100vh-2.75rem)] flex-col items-center justify-center p-6">
      <LoginForm />
    </main>
  )
}
