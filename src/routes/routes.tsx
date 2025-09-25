import { createBrowserRouter } from "react-router";
import { lazy } from "react";

const DashboardLayout = lazy(() =>
  import("@/components/DashboardLayout.tsx").then((m) => ({ default: m.DashboardLayout }))
);
const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage.tsx").then((m) => ({ default: m.DashboardPage }))
);
const SettingsPage = lazy(() =>
  import("@/pages/SettingsPage.tsx").then((m) => ({ default: m.SettingsPage }))
);
const AuthLayout = lazy(() =>
  import("@/layouts/AuthLayout.tsx").then((m) => ({ default: m.AuthLayout }))
);
const LoginPage = lazy(() =>
  import("@/pages/LoginPage.tsx").then((m) => ({ default: m.LoginPage }))
);
const ExcelProcessorPage = lazy(() =>
  import("@/pages/ExcelProcessorPage.tsx").then((m) => ({ default: m.ExcelProcessorPage }))
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthLayout />,
    children: [
      {
        path: "/",
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: <ExcelProcessorPage />
          },
          {
            path: "dashboard",
            element: <DashboardPage />
          },
          {
            path: "settings",
            element: <SettingsPage />
          },
          {
            path: "excel-processor",
            element: <ExcelProcessorPage />
          }
        ]
      }
    ],
  },
  {
    path: "/login",
    element: <LoginPage />
  }
]);