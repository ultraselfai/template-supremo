import { AdminLoginForm } from "./components/admin-login-form"

export const metadata = {
  title: "Admin Login | Decode Console",
  description: "Acesso ao painel administrativo do Decode Console",
}

export default function AdminLoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <AdminLoginForm />
      </div>
    </div>
  )
}
