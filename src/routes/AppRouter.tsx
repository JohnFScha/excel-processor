import { RouterProvider } from "react-router";
import { router } from "./routes.tsx";
import { Toaster } from "sonner";

export function AppRouter() {
  return (
    <div className="min-h-screen bg-background">
      <RouterProvider router={router} />
      <Toaster />
    </div>
  );
}