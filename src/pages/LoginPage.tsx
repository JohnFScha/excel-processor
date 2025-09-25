import { Unauthenticated, Authenticated } from "convex/react";
import { Navigate } from "react-router";
import { SignInForm } from "@/components/SignInForm.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export function LoginPage() {
  return (
    <>
      <Authenticated>
        <Navigate to="/" replace />
      </Authenticated>
      <Unauthenticated>
        <div className="min-h-screen bg-background flex justify-center items-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">Procesador de Excel</CardTitle>
              <CardDescription className="text-lg">
                Procesa archivos de Excel con reglas comerciales personalizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignInForm />
            </CardContent>
          </Card>
        </div>
      </Unauthenticated>
    </>
  );
}