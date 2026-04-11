import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PackageOpen } from "lucide-react";

async function loginAction(formData: FormData) {
  "use server";

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/chat",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          redirect("/login?error=invalid");
        default:
          redirect("/login?error=unknown");
      }
    }
    throw error;
  }
}

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params.error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo / Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex items-center justify-center w-14 h-14 bg-primary rounded-xl shadow-lg">
            <PackageOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            ASPACK AI Assistant
          </h1>
          <p className="text-sm text-muted-foreground">
            Asistente inteligente para envases de cartón
          </p>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Iniciar sesión</CardTitle>
            <CardDescription>
              Accede con tus credenciales de ASPACK
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={loginAction} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                  {error === "invalid"
                    ? "Email o contraseña incorrectos. Por favor, inténtalo de nuevo."
                    : "Ha ocurrido un error. Por favor, inténtalo de nuevo."}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@empresa.com"
                  required
                  autoComplete="email"
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="bg-white"
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          ¿Problemas para acceder? Contacta con el administrador de ASPACK.
        </p>
      </div>
    </div>
  );
}
