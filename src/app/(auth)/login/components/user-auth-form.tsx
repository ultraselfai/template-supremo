"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { authClient } from "@/lib/auth-client"
import { Loader2 } from "lucide-react"

type AuthMode = "login" | "register"

export function UserAuthForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>("login")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      })

      if (result.error) {
        setError(result.error.message || "Email ou senha inválidos")
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Erro ao fazer login. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres")
      setIsLoading(false)
      return
    }

    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name: `${firstName} ${lastName}`.trim(),
      })

      if (result.error) {
        setError(result.error.message || "Erro ao criar conta")
        return
      }

      setSuccess("Conta criada com sucesso! Redirecionando...")
      
      // Faz login automático após registro
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 1500)
    } catch {
      setError("Erro ao criar conta. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Toggle Entrar/Registrar */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-border p-1 bg-muted/50">
          <button
            type="button"
            onClick={() => {
              setMode("login")
              setError(null)
              setSuccess(null)
            }}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-all",
              mode === "login"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register")
              setError(null)
              setSuccess(null)
            }}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-all",
              mode === "register"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Registrar
          </button>
        </div>
      </div>

      {/* Mensagens de erro/sucesso */}
      {error && (
        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md text-center">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/15 text-green-600 dark:text-green-400 text-sm p-3 rounded-md text-center">
          {success}
        </div>
      )}

      {/* Formulário de Login */}
      {mode === "login" && (
        <form onSubmit={handleLoginSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">Entre na sua conta</h1>
            <p className="text-muted-foreground text-sm text-balance">
              Digite seu email e senha para acessar
            </p>
          </div>
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                placeholder="seu@email.com" 
                required 
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-3">
              <div className="flex items-center">
                <Label htmlFor="password">Senha</Label>
                <a
                  href="/forgot-password"
                  className="ml-auto text-sm underline-offset-4 hover:underline"
                >
                  Esqueceu a senha?
                </a>
              </div>
              <Input 
                id="password" 
                name="password"
                type="password" 
                required 
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-background text-muted-foreground relative z-10 px-2">
                Ou continue com
              </span>
            </div>
            <Button variant="outline" type="button" className="w-full" disabled={isLoading}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                  fill="currentColor"
                />
              </svg>
              Entrar com GitHub
            </Button>
          </div>
        </form>
      )}

      {/* Formulário de Registro */}
      {mode === "register" && (
        <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">Crie sua conta</h1>
            <p className="text-muted-foreground text-sm text-balance">
              Preencha as informações para criar uma nova conta
            </p>
          </div>
          <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-3">
                <Label htmlFor="firstName">Nome</Label>
                <Input 
                  id="firstName" 
                  name="firstName"
                  placeholder="João" 
                  required 
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input 
                  id="lastName" 
                  name="lastName"
                  placeholder="Silva" 
                  required 
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="register-email">Email</Label>
              <Input 
                id="register-email" 
                name="email"
                type="email" 
                placeholder="seu@email.com" 
                required 
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="register-password">Senha</Label>
              <Input 
                id="register-password" 
                name="password"
                type="password" 
                required 
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input 
                id="confirmPassword" 
                name="confirmPassword"
                type="password" 
                required 
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" name="terms" required disabled={isLoading} />
              <Label htmlFor="terms" className="text-xs leading-none">
                Concordo com os{" "}
                <a href="#" className="underline underline-offset-4 hover:text-primary">
                  Termos
                </a>{" "}
                e{" "}
                <a href="#" className="underline underline-offset-4 hover:text-primary">
                  Política de Privacidade
                </a>
              </Label>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar Conta"
              )}
            </Button>
            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-background text-muted-foreground relative z-10 px-2">
                Ou continue com
              </span>
            </div>
            <Button variant="outline" type="button" className="w-full" disabled={isLoading}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                  fill="currentColor"
                />
              </svg>
              Registrar com GitHub
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
